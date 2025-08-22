# Pitu Platform

**Enterprise-grade IoT edge computing platform for smart commercial vehicles**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![AWS Greengrass](https://img.shields.io/badge/AWS-Greengrass%20v2-orange.svg)](https://aws.amazon.com/greengrass/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5+-blue.svg)](https://www.typescriptlang.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.0+-green.svg)](https://vuejs.org/)

Pitu Platform is a comprehensive IoT solution designed for commercial vehicle fleet management, energy optimization, and real-time telemetry. Built on AWS Greengrass v2, it provides edge-first computing with cloud synchronization, enabling robust offline operation and scalable fleet deployment.

## 🚀 Features

### Core Capabilities
- **Real-time Vehicle Telemetry** - CAN bus integration via Mercedes PSM (Parametrisable Special Module)
- **Energy Management** - Victron solar/battery system monitoring and control
- **Fleet Management** - Multi-vehicle deployment with centralized monitoring
- **Edge Computing** - Offline-capable with local data processing and storage
- **Digital Twin Architecture** - Real-time device state synchronization
- **Professional UI** - Touch-optimized dashboard for in-vehicle operation

### Technical Highlights
- **AWS Greengrass v2** - Edge runtime with component-based architecture
- **Microservices Design** - Containerized components with independent scaling
- **MQTT Pub/Sub** - Local broker with AWS IoT Core synchronization
- **WebSocket Communication** - Real-time UI updates and bidirectional control
- **Local Data Persistence** - DynamoDB Local for offline capability
- **Infrastructure as Code** - AWS CDK for reproducible deployments

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   IoT Core  │  │  DynamoDB   │  │    CloudFormation   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ MQTT/HTTPS
┌─────────────────────────┼───────────────────────────────────┐
│                  Vehicle Edge Device                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │             AWS Greengrass v2 Core                      │ │
│  │                                                         │ │
│  │  ┌───────────┐ ┌───────────┐ ┌─────────────────────────┐ │ │
│  │  │ Router    │ │ Victron   │ │      Vehicle UI         │ │ │
│  │  │ Twin      │ │ Twin      │ │    (Vue.js + WebSocket) │ │ │
│  │  └───────────┘ └───────────┘ └─────────────────────────┘ │ │
│  │                                                         │ │
│  │  ┌───────────┐ ┌───────────┐ ┌─────────────────────────┐ │ │
│  │  │    API    │ │ UI Socket │ │    DynamoDB Local       │ │ │
│  │  │ Component │ │ Component │ │                         │ │ │
│  │  └───────────┘ └───────────┘ └─────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Router    │ │   Victron   │ │      Main ECU           │ │
│  │ (LTE/WiFi)  │ │  (MPPT/BMV) │ │   (ESP32 + CAN bus)     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Component Overview

### Core Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **main-ecu** | Vehicle CAN bus interface | Arduino/ESP32 |
| **vehicle-ui** | In-vehicle touchscreen interface | Vue.js 3 + TypeScript |
| **device-infra** | Per-device cloud infrastructure | AWS CDK |
| **system-infra** | System-wide cloud infrastructure | AWS CDK |

### Greengrass Components

| Component | Description | Port |
|-----------|-------------|------|
| **api** | REST API for vehicle data | 9998 |
| **ui-socket** | WebSocket server for real-time updates | 9999 |
| **router-twin** | Network connectivity management | - |
| **victron-twin** | Energy system integration | - |

### Digital Twins

The platform implements multiple digital twins for comprehensive vehicle state management:

- **net-lte** - Network connectivity and cellular data
- **victron-*** - Energy system components (battery, solar, inverter)
- **relaybox-2** - Auxiliary device control

## 🚀 Quick Start

### Prerequisites

**Hardware Requirements:**
- Raspberry Pi 4B (minimum 4GB RAM)
- ESP32 development board
- 7"+ touchscreen display
- Mercedes vehicle with PSM support (Sprinter 907/910 series)
- Victron energy system (optional)

**Software Requirements:**
- AWS Account with IoT Core enabled
- Node.js 18+ and npm
- AWS CLI v2
- Arduino IDE or PlatformIO

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/nerdiyland/pitu-platform.git
   cd pitu-platform
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (if any)
   npm install
   
   # Install component dependencies
   cd packages/vehicle-ui && npm install
   cd ../device-infra && npm install
   cd ../system-infra && npm install
   ```

3. **Configure AWS credentials**
   ```bash
   aws configure
   # Set your AWS access key, secret, and preferred region
   ```

4. **Deploy system infrastructure**
   ```bash
   cd packages/system-infra
   npm run build
   npx cdk deploy
   ```

5. **Deploy device infrastructure**
   ```bash
   cd packages/device-infra
   npm run build
   npx cdk deploy
   ```

6. **Start local development**
   ```bash
   cd packages/vehicle-ui
   npm run dev
   ```

### Hardware Installation

**Mercedes PSM Integration:**
1. Locate the PSM connector in your Mercedes Sprinter
2. Connect the ESP32 to PSM using the provided wiring diagram
3. Flash the main-ecu firmware to the ESP32
4. Configure CAN bus parameters according to your vehicle model

**Victron Integration:**
1. Enable MQTT on your Victron GX device
2. Configure network connectivity between Raspberry Pi and GX device
3. Update Victron credentials in the deployment configuration

## 🎯 Use Cases

### Commercial Fleet Management
- Real-time vehicle tracking and diagnostics
- Energy consumption optimization
- Preventive maintenance scheduling
- Driver behavior monitoring

### RV/Van Life Applications
- Solar battery monitoring and control
- Energy usage optimization
- Remote vehicle monitoring
- Climate control automation

### OEM Integration
- Scalable platform for custom vehicle telematics
- White-label dashboard solutions
- API-first architecture for third-party integrations
- Enterprise-grade security and compliance

## 🔧 Development

### Architecture Patterns

**Digital Twin Pattern:**
Each physical component (router, battery, solar controller) has a corresponding digital twin that maintains state synchronization between the edge device and cloud.

**Event-Driven Architecture:**
Components communicate via MQTT publish/subscribe pattern, enabling loose coupling and independent scaling.

**Edge-First Design:**
All critical functionality works offline, with cloud synchronization for fleet management and remote monitoring.

### Adding New Components

1. Create component directory in `packages/`
2. Implement component logic with AWS Greengrass v2 IPC client
3. Add component definition to device infrastructure
4. Update deployment configuration
5. Test locally using Greengrass development tools

### API Documentation

The REST API provides endpoints for:
- Vehicle telemetry data (`GET /data/:entity`)
- Configuration management (`POST /data/:entity`)
- Real-time WebSocket connections on port 9999

WebSocket events follow the pattern:
- `shadows:{shadowName}` - Digital twin state updates
- Device-specific topics for bidirectional communication

## 🚗 Vehicle Compatibility

### Mercedes-Benz
- **Sprinter (907/910 series)** - Full PSM integration
- **Other models** - Generic OBD-II support (limited functionality)

### Universal Support
- **OBD-II Compatible** - Basic diagnostics for any vehicle
- **Modular Design** - Adaptable to different CAN bus implementations
- **Open Architecture** - Extensible for new vehicle manufacturers

## 🔐 Security

- **Device Certificates** - X.509 certificates for AWS IoT authentication
- **Encrypted Communication** - TLS 1.2+ for all cloud communication
- **Local Network Isolation** - Vehicle network segmentation
- **Role-Based Access** - IAM policies for fine-grained permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines and submit pull requests for any improvements.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Reporting Issues
- Use GitHub Issues for bug reports
- Include system information and reproduction steps
- Check existing issues before creating new ones

## 🌟 Support & Community

- **Documentation**: Comprehensive guides in each package directory
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: Community support and development discussions
