# Front Controller

**Physical Control Interface for Pitu Platform**

The Front Controller is a custom-designed physical control panel mounted in the vehicle's front headliner unit, providing intuitive tactile controls and visual indicators for essential van systems and peripherals. It serves as the primary physical interface between occupants and the Pitu Platform's digital systems, offering immediate access to critical functions without requiring touchscreen interaction.

## 🎛️ Overview

The Front Controller bridges the gap between digital vehicle management and physical user interaction, offering:

- **Physical Controls** - Tactile switches and buttons for essential vehicle functions
- **Visual Indicators** - LED status lights for system monitoring at a glance
- **Safety Integration** - Emergency controls and critical system overrides
- **Mode Management** - Travel/Living mode switching for different use profiles
- **Peripheral Control** - Direct access to cameras, lighting, and sensors
- **Status Display** - Real-time system health and diagnostic indicators

## 🏗️ Hardware Architecture

### Physical Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    Front Headliner Unit                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Front Plate                           │ │
│  │                                                         │ │
│  │  🔴 Travel/Living  💧 Water     🔥 Gas     🌡️ Heater   │ │
│  │                                                         │ │
│  │  🚨 Alarm         🔧 Diagnostics  📺 Screen Power      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Bottom Plate                           │ │
│  │                                                         │ │
│  │  [Travel/Living]  [Off-road]   [PIR]   [Cameras]  [Comms] │ │
│  │   Mode Switch    Lights Sw.   Sensor    Switch   Switch │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Electronic Components

**Input Devices:**
- Travel/Living mode pulse switch (momentary contact)
- Off-road lights illuminated switch (toggle with LED)
- Front PIR sensor activation switch
- Onboard cameras control switch
- Communications system switch
- Screen power pulse switch (momentary contact)

**Output Devices:**
- Travel/Living mode indicator LED (red/green)
- Water system status LED (blue)
- Gas system status LED (orange)
- Heater system status LED (red)
- Alarm system status LED (red, blinking capable)
- Diagnostics status LED (amber/green)
- Integrated switch illumination LEDs

## 🔌 System Integration

### Control Interface Architecture

```
Front Controller Hardware
    ↓ GPIO/I2C/SPI
Main ECU (ESP32)
    ↓ WiFi/Bluetooth
Raspberry Pi (Greengrass)
    ↓ MQTT/WebSocket
Vehicle Systems & Cloud
```

### Communication Protocol

The Front Controller interfaces with the Main ECU via digital I/O and serial communication:

```cpp
// Example control interface
enum ControllerInput {
  TRAVEL_LIVING_SWITCH = 0x01,
  OFFROAD_LIGHTS_SWITCH = 0x02,
  PIR_SENSOR_SWITCH = 0x04,
  CAMERAS_SWITCH = 0x08,
  COMMS_SWITCH = 0x10,
  SCREEN_POWER_SWITCH = 0x20
};

enum ControllerOutput {
  TRAVEL_LIVING_LED = 0x01,
  WATER_STATUS_LED = 0x02,
  GAS_STATUS_LED = 0x04,
  HEATER_STATUS_LED = 0x08,
  ALARM_STATUS_LED = 0x10,
  DIAGNOSTICS_LED = 0x20
};
```

## 🎯 Control Functions

### Bottom Plate Controls

#### Travel/Living Mode Switch
- **Type**: Pulse switch (momentary contact)
- **Function**: Toggles between travel and stationary/living modes
- **Integration**: Updates vehicle-wide system profiles
- **Response Time**: < 100ms
- **Visual Feedback**: Front plate LED indicator

#### Off-road Lights Switch
- **Type**: Illuminated toggle switch
- **Function**: Controls auxiliary off-road lighting systems
- **States**: Off/On with integrated LED indicator
- **Power Rating**: 12V/24V compatible
- **Protection**: Fuse protected circuit

#### Front PIR Sensor Switch
- **Type**: Toggle switch
- **Function**: Enables/disables front perimeter motion detection
- **Integration**: Connected to security system
- **Range**: Configurable detection zones
- **Power Consumption**: < 1W standby

#### Onboard Cameras Switch
- **Type**: Multi-position switch
- **Function**: Controls camera system activation
- **Positions**: Off/Recording/Live View
- **Integration**: Links to vehicle UI display system
- **Storage**: Local and cloud recording options

#### Communications Switch
- **Type**: Illuminated switch
- **Function**: Controls cellular/WiFi connectivity systems
- **States**: Off/Auto/Manual with status indication
- **Integration**: Router twin component management
- **Emergency**: Maintains emergency communication protocols

### Front Plate Indicators

#### Travel/Living Light
- **Color**: Red (Travel) / Green (Living)
- **Function**: Displays current operational mode
- **Behavior**: Solid on, flashing during transitions
- **Integration**: Synchronized with system-wide mode changes

#### Water Light
- **Color**: Blue
- **Function**: Water system status indicator
- **States**: 
  - Off: System disabled
  - Solid: Normal operation
  - Flashing: Low water/issues
  - Red: Critical alert

#### Gas Light
- **Color**: Orange
- **Function**: Gas system monitoring
- **States**:
  - Off: System disabled
  - Solid: Normal levels
  - Flashing: Low gas warning
  - Red: Safety alert/leak detection

#### Heater Light
- **Color**: Red
- **Function**: Heating system status
- **States**:
  - Off: Heater disabled
  - Solid: Active heating
  - Flashing: Ignition cycle
  - Amber: Maintenance required

#### Alarm Light
- **Color**: Red
- **Function**: Security system status
- **Behavior**: 
  - Off: System disarmed
  - Solid: Armed/monitoring
  - Fast flash: Intrusion detected
  - Slow flash: System fault

#### Diagnostics Light
- **Color**: Amber/Green
- **Function**: Overall system health indicator
- **States**:
  - Green: All systems normal
  - Amber: Minor issues/maintenance due
  - Red: Critical system failures
  - Flashing: Diagnostic mode active

#### Screen Power Control
- **Type**: Pulse switch (momentary contact)
- **Function**: Controls main display power state
- **Behavior**: Press to wake/sleep display
- **Integration**: Manages vehicle UI power states
- **Timeout**: Configurable auto-sleep timing

## 🔧 Installation & Wiring

### Mounting Requirements

**Location**: Front headliner, driver-accessible position
**Mounting**: Custom bracket with vibration dampening
**Access**: Tool-free removal for maintenance
**Clearance**: Minimum 50mm depth requirement
**Protection**: IP54 rating for moisture resistance

### Electrical Connections

```
Power Supply:
├── +12V Vehicle Power (Fused 5A)
├── +12V Switched Power (Ignition controlled)
├── Ground (Chassis ground)
└── CAN Bus Interface (Main ECU)

I/O Connections:
├── Digital Inputs (6x switches)
├── Digital Outputs (6x LED drivers)
├── Analog Inputs (2x sensor inputs)
└── Serial Communication (UART/I2C)
```

### Wiring Harness

```cpp
// Pin assignment example
const PinConfig frontController = {
  // Input pins
  .travelLivingSwitch = GPIO_PIN_2,
  .offroadLightsSwitch = GPIO_PIN_3,
  .pirSensorSwitch = GPIO_PIN_4,
  .camerasSwitch = GPIO_PIN_5,
  .commsSwitch = GPIO_PIN_6,
  .screenPowerSwitch = GPIO_PIN_7,
  
  // Output pins
  .travelLivingLED = GPIO_PIN_8,
  .waterStatusLED = GPIO_PIN_9,
  .gasStatusLED = GPIO_PIN_10,
  .heaterStatusLED = GPIO_PIN_11,
  .alarmStatusLED = GPIO_PIN_12,
  .diagnosticsLED = GPIO_PIN_13
};
```

## 🖥️ Software Integration

### Main ECU Interface

```cpp
// Front controller management class
class FrontController {
  private:
    uint8_t switchStates;
    uint8_t ledStates;
    uint32_t lastUpdateTime;
    
  public:
    void init();
    void update();
    void setSwitchCallback(uint8_t pin, void (*callback)());
    void setLED(uint8_t led, bool state);
    void setLEDBlink(uint8_t led, uint16_t period);
    uint8_t readSwitches();
    void handleModeSwitch();
    void updateSystemStatus();
};
```

### Mode Management

```cpp
// Travel/Living mode implementation
void handleTravelLivingMode() {
  static bool isLivingMode = false;
  
  if (frontController.switchPressed(TRAVEL_LIVING_SWITCH)) {
    isLivingMode = !isLivingMode;
    
    if (isLivingMode) {
      // Switch to living mode
      frontController.setLED(TRAVEL_LIVING_LED, LED_GREEN);
      enableLivingModeFeatures();
      publishModeChange("living");
    } else {
      // Switch to travel mode  
      frontController.setLED(TRAVEL_LIVING_LED, LED_RED);
      enableTravelModeFeatures();
      publishModeChange("travel");
    }
  }
}
```

### Status Monitoring

```cpp
// System status update
void updateSystemStatus() {
  // Water system
  if (waterLevel < LOW_THRESHOLD) {
    frontController.setLEDBlink(WATER_STATUS_LED, 500);
  } else if (waterLevel > NORMAL_THRESHOLD) {
    frontController.setLED(WATER_STATUS_LED, true);
  }
  
  // Gas system
  if (gasLevel < LOW_THRESHOLD) {
    frontController.setLEDBlink(GAS_STATUS_LED, 1000);
  } else if (gasLevel > NORMAL_THRESHOLD) {
    frontController.setLED(GAS_STATUS_LED, true);
  }
  
  // Diagnostic status
  uint8_t systemHealth = getSystemHealth();
  if (systemHealth == SYSTEM_HEALTHY) {
    frontController.setLED(DIAGNOSTICS_LED, LED_GREEN);
  } else if (systemHealth == SYSTEM_WARNING) {
    frontController.setLED(DIAGNOSTICS_LED, LED_AMBER);
  } else {
    frontController.setLEDBlink(DIAGNOSTICS_LED, 200);
  }
}
```

## 🔧 Configuration

### System Modes

**Travel Mode Configuration:**
```json
{
  "mode": "travel",
  "features": {
    "cameras": "auto_record",
    "lighting": "minimal",
    "heating": "economy",
    "comms": "mobile_optimized",
    "security": "motion_detection"
  }
}
```

**Living Mode Configuration:**
```json
{
  "mode": "living", 
  "features": {
    "cameras": "perimeter_only",
    "lighting": "full_control",
    "heating": "comfort",
    "comms": "high_bandwidth",
    "security": "full_monitoring"
  }
}
```

### LED Behavior Patterns

```cpp
// LED control patterns
enum LEDPattern {
  SOLID_ON = 0,
  SOLID_OFF = 1,
  SLOW_BLINK = 2,    // 1 Hz
  FAST_BLINK = 3,    // 4 Hz
  DOUBLE_FLASH = 4,  // Two quick flashes
  FADE_IN_OUT = 5    // Breathing pattern
};
```

## 🛠️ Maintenance

### Routine Checks

**Monthly Inspection:**
- Verify all switches operate smoothly
- Check LED functionality (all colors/patterns)
- Clean control surface and indicators
- Verify mounting security

**Annual Maintenance:**
- Disassemble and clean contacts
- Check wiring harness for wear
- Update firmware if available
- Calibrate sensor inputs

### Troubleshooting

**LED Not Working:**
1. Check power supply voltage
2. Verify wiring connections
3. Test LED driver circuit
4. Replace LED if necessary

**Switch Not Responding:**
1. Check switch contact continuity
2. Verify pull-up resistor values
3. Clean switch contacts
4. Check Main ECU GPIO configuration

**Intermittent Operation:**
1. Check ground connections
2. Verify power supply stability
3. Inspect wiring for vibration damage
4. Check EMI shielding integrity

## 🔧 Technical Specifications

### Electrical Ratings
- **Operating Voltage**: 10.5V - 15V DC (12V nominal)
- **Current Consumption**: 200mA maximum (all LEDs on)
- **Switch Rating**: 5A @ 12V DC resistive load
- **Operating Temperature**: -20°C to +70°C
- **Storage Temperature**: -40°C to +85°C
- **Humidity**: 95% RH non-condensing

### Mechanical Specifications
- **Dimensions**: 180mm x 100mm x 45mm
- **Weight**: 250g
- **Mounting**: M4 threaded inserts
- **Vibration**: Automotive grade (ISO 16750-3)
- **Shock**: 50G, 6ms duration
- **IP Rating**: IP54 (dust and splash resistant)

### Compliance Standards
- **EMC**: ECE R10 automotive electromagnetic compatibility
- **Safety**: ISO 26262 functional safety considerations
- **Environmental**: ISO 16750 automotive environmental testing
- **Materials**: RoHS compliant, halogen-free

## 🤝 Contributing

### Hardware Modifications
- Document any custom wiring changes
- Update pin configuration tables
- Test with automotive electrical standards
- Verify EMC compliance after modifications

### Software Updates
- Follow automotive coding standards (MISRA-C)
- Implement proper error handling
- Add comprehensive logging
- Test with hardware-in-the-loop setup

### Integration Testing
- Verify all switch/LED combinations
- Test mode switching under various conditions
- Validate emergency operation scenarios
- Check integration with other vehicle systems

## 📄 License

This component is part of the Pitu Platform and is licensed under the MIT License.

## 🔗 Related Documentation

- [Main Platform README](../../README.md) - Overall platform architecture
- [Main ECU](../main-ecu/README.md) - Hardware interface controller
- [Vehicle UI](../vehicle-ui/README.md) - Digital dashboard interface
- [Device Infrastructure](../device-infra/README.md) - Cloud deployment configuration

---

**Front Controller: Physical Interface to Digital Intelligence**

*Professional-grade tactile controls bringing immediate access to essential vehicle systems and status monitoring*
