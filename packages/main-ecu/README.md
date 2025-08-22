# Main ECU

**Vehicle Interface Controller for Pitu Platform**

The Main ECU (Electronic Control Unit) serves as the critical hardware bridge between the Pitu Platform's edge computing system and the vehicle's electronic infrastructure. Built on ESP32 microcontroller technology, it provides real-time CAN bus communication, vehicle telemetry acquisition, and command execution capabilities.

## 🚗 Overview

The Main ECU is the physical interface layer that enables the Pitu Platform to:

- **Read Vehicle Data** - Extract real-time telemetry from vehicle CAN buses
- **Execute Commands** - Control vehicle systems like lighting, climate, and auxiliary equipment  
- **Monitor Status** - Track vehicle health, diagnostic codes, and operational parameters
- **Ensure Safety** - Implement fail-safes and emergency protocols
- **Local Processing** - Handle time-critical operations with microsecond response times

## 🔌 Mercedes PSM Integration

Pitu Platform leverages the **Mercedes Parametrisable Special Module (PSM)** for seamless integration with Mercedes-Benz commercial vehicles, particularly the Sprinter 907/910 series.

### What is PSM?
The PSM is Mercedes-Benz's standardized interface for bodybuilders and fleet managers to access vehicle data and control systems without compromising vehicle warranties or safety systems.

### PSM Capabilities:
- **CAN Bus Access** - High-speed and comfort CAN networks
- **Digital I/O** - Configurable input/output pins for custom equipment
- **Power Management** - Switched and constant power distribution
- **Vehicle Integration** - Access to lighting, climate, and powertrain data
- **Diagnostic Integration** - OEM diagnostic compatibility

### Supported Data Points:
- Engine RPM, temperature, and load
- Vehicle speed and odometer readings
- Fuel level and consumption rates
- Battery voltage and charging status
- Door and lighting states
- Climate control settings
- Diagnostic trouble codes

## 🛠️ Hardware Architecture

### ESP32 Specifications
- **Microcontroller**: ESP32-WROOM-32 (recommended) or ESP32-WROVER
- **CPU**: Dual-core Xtensa LX6 @ 240MHz
- **Memory**: 520KB SRAM + 4MB Flash (minimum)
- **Connectivity**: WiFi 802.11 b/g/n + Bluetooth 4.2/BLE
- **CAN Interface**: External MCP2515 CAN controller + TJA1050 transceiver
- **Operating Voltage**: 3.3V (with 12V/24V vehicle power conversion)

### Pinout Configuration
```
ESP32 Pin    | Function           | PSM Connection
-------------|-------------------|----------------
GPIO4        | CAN_INT           | MCP2515 INT
GPIO5        | CAN_CS            | MCP2515 CS
GPIO18       | SPI_SCK           | MCP2515 SCK
GPIO19       | SPI_MISO          | MCP2515 MISO
GPIO23       | SPI_MOSI          | MCP2515 MOSI
GPIO16       | CAN_TX (optional) | Direct CAN TX
GPIO17       | CAN_RX (optional) | Direct CAN RX
GPIO21       | SDA               | I2C Devices
GPIO22       | SCL               | I2C Devices
```

### Power Management
- **Input**: 12V/24V vehicle power (PSM Pin 30)
- **Regulation**: DC-DC converter to 3.3V (LM2596 or similar)
- **Backup**: Supercapacitor for graceful shutdown
- **Protection**: Reverse polarity and overvoltage protection

## 📡 Communication Architecture

### CAN Bus Communication
```
Vehicle CAN Networks
├── High-Speed CAN (500 kbps)
│   ├── Engine Control Module
│   ├── Transmission Control
│   ├── ABS/ESP Systems
│   └── Instrument Cluster
├── Comfort CAN (125 kbps)
│   ├── Body Control Module
│   ├── Climate Control
│   ├── Lighting Systems
│   └── Door Modules
└── PSM Interface
    └── Main ECU (ESP32)
        └── WiFi/Bluetooth
            └── Raspberry Pi (Greengrass)
```

### Data Flow
1. **Vehicle Systems** → CAN Bus messages
2. **PSM Module** → Filters and routes messages
3. **Main ECU** → Processes and formats data
4. **WiFi/Bluetooth** → Transmits to edge computing device
5. **Greengrass Components** → Cloud synchronization and local processing

## 🚀 Quick Start

### Prerequisites
- Arduino IDE or PlatformIO
- ESP32 development board
- MCP2515 CAN module
- Mercedes vehicle with PSM
- Basic electronics tools

### Installation

1. **Hardware Setup**
   ```bash
   # Connect ESP32 to MCP2515 CAN module
   # Wire power supply (12V/24V to 3.3V)
   # Connect to vehicle PSM connector
   ```

2. **Software Setup**
   ```bash
   # Clone repository
   git clone https://github.com/nerdiyland/pitu-platform.git
   cd pitu-platform/packages/main-ecu
   
   # Open in Arduino IDE
   # Install required libraries:
   # - MCP2515 CAN Library
   # - ArduinoJson
   # - WiFi ESP32 libraries
   ```

3. **Configuration**
   ```cpp
   // Update src/config.h with your settings
   #define WIFI_SSID "your-network"
   #define WIFI_PASSWORD "your-password"
   #define CAN_SPEED CAN_500KBPS
   #define PSM_VARIANT SPRINTER_907
   ```

4. **Upload Firmware**
   ```bash
   # Compile and upload via Arduino IDE
   # Monitor serial output for debugging
   ```

### Demo Code
The `demo01.ino` provides a basic LED blinker for testing hardware connectivity:

```cpp
// Basic LED blink test
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
```

## 🔧 Development

### CAN Message Processing
```cpp
// Example CAN message handler
void processCAN() {
  if (CAN.parsePacket()) {
    uint32_t id = CAN.packetId();
    uint8_t len = CAN.packetDlc();
    
    switch(id) {
      case 0x0C4: // Engine RPM
        processEngineRPM();
        break;
      case 0x3E8: // Vehicle Speed
        processVehicleSpeed();
        break;
      // Additional message handlers...
    }
  }
}
```

### WiFi Communication
```cpp
// Send telemetry to Greengrass
void sendTelemetry(JsonObject& data) {
  WiFiClient client;
  if (client.connect("192.168.1.100", 1883)) {
    client.print("POST /telemetry HTTP/1.1\r\n");
    // Send JSON payload...
  }
}
```

### Error Handling
- **CAN Bus Errors** - Automatic retry with exponential backoff
- **WiFi Disconnection** - Local buffering and reconnection logic
- **PSM Communication** - Watchdog timers and health monitoring
- **Power Management** - Graceful shutdown on low voltage

## 🔐 Safety & Compliance

### Automotive Standards
- **ISO 11898** - CAN bus communication protocol compliance
- **ISO 14229** - Unified Diagnostic Services (UDS) compatibility
- **Mercedes Standards** - PSM integration guidelines adherence

### Safety Features
- **Non-Intrusive Operation** - Read-only access to critical vehicle systems
- **Fail-Safe Design** - Default to safe state on communication loss
- **Watchdog Protection** - System reset on firmware hang
- **EMC Compliance** - Electromagnetic compatibility for automotive environment

### Security Considerations
- **CAN Message Validation** - Verify message integrity and source
- **Rate Limiting** - Prevent CAN bus flooding
- **Secure Boot** - Verified firmware loading
- **Encrypted Communication** - Protected data transmission to edge device

## 📋 Vehicle Compatibility

### Mercedes-Benz (Full PSM Support)
- **Sprinter 907/910** (2018+) - Complete integration
- **Vito/Viano** (2019+) - Limited PSM functionality
- **Other Models** - Check PSM availability

### Universal CAN Support
- **OBD-II Port** - Basic diagnostics (any vehicle 1996+)
- **J1939** - Heavy-duty vehicle compatibility
- **Custom Integration** - Adaptable to other manufacturer protocols

## 🛠️ Troubleshooting

### Common Issues

**CAN Bus Not Working**
- Check MCP2515 wiring and power
- Verify CAN bus termination resistors
- Confirm baud rate settings match vehicle

**WiFi Connection Problems**
- Verify network credentials
- Check signal strength and range
- Monitor for interference sources

**PSM Communication Errors**
- Confirm PSM connector wiring
- Check vehicle compatibility
- Verify PSM activation status

### Diagnostic Commands
```cpp
// CAN bus diagnostics
void canDiagnostics() {
  Serial.println("CAN Bus Status:");
  Serial.print("Error Count: ");
  Serial.println(CAN.errorCount());
  Serial.print("Bus State: ");
  Serial.println(CAN.busState());
}
```

## 📖 Documentation

- **PSM Documentation** - See `docs/PSM_Sprinter__Typ_907_910_06062018_v01_en.pdf`
- **Wiring Diagrams** - Hardware connection specifications
- **CAN Database** - DBC files for message definitions
- **API Reference** - Communication protocol documentation

## 🤝 Contributing

We welcome contributions to improve Main ECU functionality:

- **New Vehicle Support** - Add CAN message definitions
- **Hardware Variants** - Support for different ESP32 modules
- **Protocol Extensions** - Additional communication methods
- **Safety Improvements** - Enhanced error handling and validation

## 📄 License

This component is part of the Pitu Platform and is licensed under the MIT License.

---

**Main ECU: The Hardware Heart of Pitu Platform**

*Bridging the gap between traditional automotive systems and modern IoT connectivity*
