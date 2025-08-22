# Victron Twin

**Energy System Integration Component for Pitu Platform**

The Victron Twin is a critical AWS Greengrass component that provides seamless integration between Victron Energy devices and the Pitu Platform's digital twin architecture. It enables real-time monitoring, control, and optimization of solar power systems, battery banks, and energy management equipment commonly found in commercial vehicles, RVs, and off-grid installations.

## ⚡ Overview

The Victron Twin serves as a bidirectional bridge between Victron Energy ecosystem and AWS IoT, offering:

- **Real-Time Energy Monitoring** - Live solar generation, battery status, and power consumption data
- **Device Control** - Remote adjustment of charge parameters, load management, and system settings
- **Digital Twin Synchronization** - Cloud-based state management with offline resilience
- **Multi-Device Support** - Integration with MPPT controllers, battery monitors, inverters, and GX devices
- **Historical Data** - Energy production and consumption trending for optimization
- **Alarm Management** - Real-time alerts for system faults, low battery, and maintenance needs

## 🔋 Victron Energy Integration

### Supported Victron Devices
- **GX Devices** - Cerbo GX, Venus GX, Color Control GX
- **MPPT Solar Chargers** - SmartSolar and BlueSolar controllers
- **Battery Monitors** - BMV series and SmartShunt
- **Inverters/Chargers** - MultiPlus, Quattro, Phoenix series
- **DC-DC Chargers** - Orion and SmartCharger series
- **Tank & Temperature Sensors** - Monitoring peripherals

### VRM Portal Integration
- **VRM ID**: Unique identifier for Victron Remote Management
- **MQTT Broker**: Direct connection to GX device MQTT interface
- **Data Streams**: Real-time telemetry and configuration data
- **Remote Control**: Bidirectional command execution

### Energy Data Points
- **Solar Generation**: Power output, daily/monthly totals, MPPT efficiency
- **Battery Status**: Voltage, current, state of charge, temperature, health
- **Power Consumption**: AC/DC loads, inverter status, energy distribution
- **System Health**: Alarms, warnings, maintenance indicators, device status

## 🏗️ Technical Architecture

### Communication Flow
```
Victron GX Device (<CERBO-GX-IP-ADDRESS>)
    ↓ MQTT/SSL (Port 8883)
Victron Twin Component
    ↓ AWS Greengrass IPC
Device Shadow Manager
    ↓ MQTT/TLS
AWS IoT Core
    ↓ Digital Twin Sync
Cloud Applications & Analytics
```

### Digital Twin Structure
The component manages multiple device shadows:

| Shadow Name | Purpose | Data Source |
|-------------|---------|-------------|
| `victron-system` | Overall system status | GX Device |
| `victron-battery` | Battery bank monitoring | BMV/SmartShunt |
| `victron-solarcharger` | MPPT controller data | Solar Controllers |
| `victron-vebus` | Inverter/charger status | MultiPlus/Quattro |
| `victron-gps` | Location tracking | GX GPS |
| `victron-settings` | System configuration | GX Settings |

### Data Processing Pipeline
1. **MQTT Subscription** - Connect to Victron GX device MQTT broker
2. **Message Parsing** - Extract device data from VE.Direct protocol messages
3. **Data Transformation** - Convert to standardized format with units and metadata
4. **Batch Processing** - Aggregate updates for optimal cloud synchronization
5. **Shadow Updates** - Publish to AWS IoT device shadows
6. **Command Processing** - Handle control commands from cloud/UI applications

## 🚀 Quick Start

### Prerequisites
- **Victron GX Device** - Cerbo GX, Venus GX, or Color Control GX
- **Network Connectivity** - GX device connected to local network
- **MQTT Enabled** - MQTT broker activated on GX device
- **AWS Greengrass** - Deployed Pitu Platform edge environment

### Configuration

1. **Enable MQTT on GX Device**
   ```bash
   # Access GX device via SSH or web interface
   # Navigate to Settings > Services > MQTT
   # Enable "MQTT on LAN (Insecure)"
   # Enable "MQTT on LAN (SSL)"
   # Set username/password if required
   ```

2. **Network Setup**
   ```bash
   # Ensure GX device is accessible from Greengrass device
   ping <CERBO-GX-IP-ADDRESS>
   
   # Test MQTT connectivity
   mosquitto_sub -h <CERBO-GX-IP-ADDRESS> -p 8883 -t "N/<YOUR-VRM-INSTANCE-ID>/#" --cafile ca.crt
   ```

3. **Component Deployment**
   ```bash
   # Deploy via AWS CDK (automated)
   cd packages/device-infra
   npx cdk deploy
   
   # Manual deployment via Greengrass CLI
   sudo greengrass-cli component install \
     --name com.vanlance.vehicle-components.VictronTwin \
     --version 0.0.35
   ```

### VRM Portal Setup

1. **Register Device**
   - Create account at [vrm.victronenergy.com](https://vrm.victronenergy.com)
   - Register your GX device using its VRM Portal ID
   - Configure remote access and MQTT settings

2. **API Access**
   ```bash
   # Obtain VRM API token for advanced integrations
   # Configure data sharing permissions
   # Set up alarm notifications
   ```

## 🔧 Development

### Component Architecture

```typescript
// Core VictronTwin class structure
export class VictronTwin {
  // Connection constants
  static readonly THING_NAME = 'pitu-caleya'
  static readonly VICTRON_IP = '<CERBO-GX-IP-ADDRESS>'
  static readonly VRM_ID = "<YOUR-VRM-INSTANCE-ID>"
  
  // MQTT broker connection
  private broker?: mqtt.MqttClient
  
  // Main lifecycle methods
  async start(): Promise<void>
  async startVictronBroker(): Promise<void>
  async startIpcBroker(): Promise<void>
}
```

### Message Processing

**MQTT Topic Structure**
```
N/{VRM_ID}/{namespace}/{device_id}/{attribute}
└── Examples:
    ├── N/<YOUR-VRM-INSTANCE-ID>/battery/512/Voltage
    ├── N/<YOUR-VRM-INSTANCE-ID>/solarcharger/279/Yield/Power
    └── N/<YOUR-VRM-INSTANCE-ID>/system/0/Ac/Grid/L1/Power
```

**Data Transformation**
```typescript
// Process incoming MQTT messages
this.broker.on('message', async (topic: string, message: Buffer) => {
  const topicSteps = topic.split('/').slice(2)
  const namespace = topicSteps[0]        // battery, solarcharger, etc.
  const deviceId = topicSteps[1]         // device instance ID
  const attribute = topicSteps.slice(2)  // measurement path
  
  const payload = JSON.parse(message.toString())
  
  // Transform to shadow format
  const shadowUpdate = {
    [namespace]: {
      deviceId,
      attribute: attribute.join('.'),
      value: payload.value,
      timestamp: Date.now()
    }
  }
  
  // Batch and publish to shadow
  await this.publishShadow(`victron-${namespace}`, shadowUpdate)
})
```

### Control Commands

**Shadow Delta Processing**
```typescript
// Handle control commands from cloud/UI
deltaSubscription.on('message', async (message) => {
  const shadowName = extractShadowName(message.topic)
  const commands = JSON.parse(message.payload)
  
  // Execute commands on Victron device
  for (const [parameter, value] of Object.entries(commands.state)) {
    const requestTopic = `W/${VRM_ID}/${shadowName}/${deviceId}/${parameter}`
    await this.broker.publishAsync(requestTopic, JSON.stringify({ value }))
  }
})
```

### Error Handling & Resilience

**Connection Management**
```typescript
// Automatic reconnection with exponential backoff
setTimeout(async () => {
  if (!connected) {
    this.connectionAttempts++
    if (this.connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      throw new Error("UNABLE_TO_CONNECT_TO_SOCKET_EXCEPTION")
    }
    await this.startVictronBroker() // Retry connection
  }
}, SOCKET_CONNECTION_TIMEOUT)
```

**Data Batching**
```typescript
// Optimize cloud updates with intelligent batching
const batchTimeout = setTimeout(async () => {
  const namespaces = Object.keys(batchDelta)
  await Promise.all(namespaces.map(async namespace => {
    await this.publishShadow(namespace, batchDelta[namespace])
  }))
}, DESIRED_UPDATE_FREQUENCY)
```

## 📊 Data Schema

### Battery Monitor Data
```json
{
  "victron-battery": {
    "deviceInstance": 512,
    "voltage": 12.45,
    "current": -5.2,
    "power": -64.74,
    "soc": 87.5,
    "timeToGo": 28800,
    "temperature": 23.4,
    "consumed": 12.34,
    "lastUpdate": "2024-01-15T14:30:00Z"
  }
}
```

### Solar Charger Data
```json
{
  "victron-solarcharger": {
    "deviceInstance": 279,
    "state": "Bulk",
    "pv": {
      "voltage": 18.67,
      "current": 8.2,
      "power": 153.1
    },
    "battery": {
      "voltage": 12.45,
      "current": 8.1
    },
    "yield": {
      "today": 2.45,
      "yesterday": 3.21,
      "total": 1234.56
    },
    "efficiency": 97.8
  }
}
```

### System Overview Data
```json
{
  "victron-system": {
    "ac": {
      "consumption": {
        "l1": 245.6,
        "l2": 0,
        "l3": 0
      }
    },
    "dc": {
      "battery": {
        "voltage": 12.45,
        "current": -3.2,
        "power": -39.84
      },
      "system": {
        "power": 284.16
      }
    },
    "solar": {
      "power": 153.1
    }
  }
}
```

## ⚙️ Configuration

### Environment Variables
```bash
# Victron connection settings
VICTRON_HOST=<CERBO-GX-IP-ADDRESS>
VICTRON_VRM_ID=<YOUR-VRM-INSTANCE-ID>
VICTRON_MQTT_USERNAME=u
VICTRON_MQTT_PASSWORD=<YOUR-VICTRON-MQTT-PASSWORD>

# AWS settings
AWS_IOT_THING_NAME=pitu-caleya
UPDATE_FREQUENCY=10000
BATCH_TIMEOUT=10000
```

### Component Configuration
```typescript
// victron-twin.recipe.yml equivalent
const config = {
  connectionTimeout: 30000,
  maxRetries: 10,
  updateFrequency: 10000,
  supportedNamespaces: [
    'battery', 'solarcharger', 'vebus', 
    'system', 'gps', 'settings'
  ],
  security: {
    tlsEnabled: true,
    certificateValidation: false // For local GX devices
  }
}
```

## 🔧 Troubleshooting

### Common Issues

**MQTT Connection Failed**
```bash
# Check GX device network connectivity
ping <CERBO-GX-IP-ADDRESS>

# Verify MQTT service is running
nmap -p 8883 <CERBO-GX-IP-ADDRESS>

# Test MQTT authentication
mosquitto_pub -h <CERBO-GX-IP-ADDRESS> -p 8883 -u u -P password -t test -m "hello"
```

**Missing Device Data**
```bash
# Check device registration in VRM Portal
# Verify device instance IDs match configuration
# Monitor MQTT traffic for specific devices
mosquitto_sub -h <CERBO-GX-IP-ADDRESS> -p 8883 -t "N/<YOUR-VRM-INSTANCE-ID>/battery/+/Voltage"
```

**Shadow Update Failures**
```bash
# Check Greengrass connectivity
sudo greengrass-cli component list
sudo greengrass-cli logs --name VictronTwin

# Verify IAM permissions for shadow updates
aws iot describe-thing-type --thing-type-name VehicleDevice
```

### Diagnostic Tools

**Component Health Check**
```typescript
// Health monitoring endpoint
async healthCheck(): Promise<ComponentHealth> {
  return {
    mqttConnected: this.broker?.connected ?? false,
    lastDataReceived: this.lastMessageTime,
    activeShadows: Object.keys(this.shadowStates),
    connectionAttempts: this.connectionAttempts,
    uptime: Date.now() - this.startTime
  }
}
```

**Data Validation**
```typescript
// Validate incoming data integrity
function validateVictronData(namespace: string, data: any): boolean {
  const schemas = {
    battery: ['voltage', 'current', 'soc'],
    solarcharger: ['state', 'pv', 'yield'],
    system: ['ac', 'dc']
  }
  
  return schemas[namespace]?.every(field => 
    data.hasOwnProperty(field) && data[field] !== null
  ) ?? false
}
```

## 🔐 Security

### MQTT Security
- **TLS Encryption** - All communication encrypted with TLS 1.2+
- **Authentication** - Username/password authentication to GX device
- **Network Isolation** - Local network communication only
- **Certificate Validation** - Configurable for production deployments

### AWS Integration Security
- **IAM Policies** - Least-privilege access to IoT shadows
- **Device Certificates** - X.509 certificates for device authentication
- **Encryption in Transit** - TLS for all AWS communication
- **Data Privacy** - No sensitive data stored in plaintext

### Best Practices
- Regular password rotation for MQTT credentials
- Network segmentation for Victron devices
- Monitoring for unusual data patterns
- Audit logging for all control commands

## 📈 Performance & Optimization

### Update Frequency Tuning
```typescript
// Balance real-time requirements with bandwidth
const updateStrategies = {
  critical: 1000,    // Battery voltage, system alarms
  normal: 10000,     // Solar power, consumption
  slow: 60000        // Configuration, statistics
}
```

### Data Compression
```typescript
// Minimize cloud data transfer
function compressUpdate(data: any): any {
  return {
    t: Date.now(),           // timestamp
    v: data.value,           // value only
    q: data.quality || 0     // quality indicator
  }
}
```

### Connection Optimization
- Keep-alive messaging to maintain MQTT connection
- Intelligent retry logic with exponential backoff  
- Connection pooling for multiple device support
- Graceful degradation during network issues

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices and strong typing
- Implement comprehensive error handling and logging
- Write unit tests for data transformation logic
- Test with actual Victron hardware when possible
- Document any new device integrations

### Adding New Device Support
1. Identify MQTT topic patterns for new device
2. Create data transformation logic
3. Add corresponding shadow schema
4. Update component configuration
5. Test with physical hardware
6. Document device-specific features

### Testing Procedures
```bash
# Unit tests for data processing
npm test

# Integration tests with mock MQTT broker
npm run test:integration

# Hardware-in-the-loop testing
npm run test:hardware
```

## 📄 License

This component is part of the Pitu Platform and is licensed under the MIT License.

## 🔗 Related Documentation

- [Main Platform README](../../README.md) - Overall platform architecture
- [Vehicle UI](../vehicle-ui/README.md) - Energy dashboard interface
- [Device Infrastructure](../device-infra/README.md) - AWS deployment configuration
- [Victron Energy Documentation](https://www.victronenergy.com/support-and-downloads/technical-information) - Official device manuals

## 📚 External Resources

- [Victron VRM Portal](https://vrm.victronenergy.com) - Remote monitoring platform
- [MQTT Protocol Specification](https://mqtt.org/mqtt-specification/) - Communication protocol
- [AWS IoT Device Shadow Service](https://docs.aws.amazon.com/iot/latest/developerguide/iot-device-shadows.html) - Digital twin documentation
- [Victron MQTT API](https://github.com/victronenergy/venus/wiki/dbus-api) - Device communication reference

---

**Victron Twin: Powering Intelligent Energy Management**

*Seamlessly bridging Victron Energy systems with cloud-native IoT for optimal solar and battery performance*
