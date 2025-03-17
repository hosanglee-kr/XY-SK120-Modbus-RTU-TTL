# XY-SK120 Modbus RTU Communication Library

This library provides a simple interface to communicate with the XY-SK series DC-DC buck-boost power supply modules (specifically the XY-SK120) digital power supply (DPS) using Modbus RTU protocol over a TTL serial connection.

## Overview

The XY-SK120 is a DC-DC buck-boost power supply module with a voltage range of 0.5-30V and current range of 0-5A. It supports Modbus RTU communication for remote control and monitoring. Recommend to keep the output within 120W.

This library allows you to:
- Set voltage and current limits
- Monitor actual voltage, current, and power
- Turn the output on/off
- Use constant voltage (CV) or constant current (CC) modes
- Configure protection settings
- Read device information and status
- Control various device settings like backlight, buzzer, etc.

With a open source libraries that is based on Arduino framework.

## Quickstart

- Clone this repo and open it with PlatformIO
- Hook up the XY-SK120 DPS with a SeeedStudio XIAO ESP32S3 on it's serial RX and TX pin
- Compile and upload
- Interface the DPS with serial monitor
- Type `help` in the serial monitor to bring up the list of commands

## Use it as a library

- Simply download the `XY-SKxxx` from the `lib` folder and place it to your PlatformIO project inside the `lib` folder
- `#include "XY-SKxxx.h"` in your `main.cpp` 
- Start coding!

## Hardware Requirements

- XY-SK120 (or compatible) DC-DC buck-boost power supply module
- A Seeedstudio XIAO ESP32S3 board (tested) or any Arduino-compatible board with hardware or software serial support (untested)
- TTL to RS-485/Modbus converter (optional, direct TTL connection also works)

## Different Models of DPS

There seems to be a number of brands / manufacturers making a very similar power supply module and possibly using the same MCU with a very similar hardware to control the functionalities of the DPS - they seem to vary only on certain additional functionalities such as different maximum input / output voltage, different add-on connectivity board such as the Sinilink ESP8285H16 TTL-WIFI adaptor or a unknown TTL-USB / TTL-Bluetooth adaptor, in order to provide additional interface such as Windows app / mobile app over WIFI or Bluetooth.

## Documentations

- See 'Documentation' folder for a 'user manual' and additional findings and most importantly, the Modbus-RTU registers for the control of the DPS.

## Pin Connections

For XIAO ESP32S3 (default in example code):
- Connect power supply GND to XIAO ESP32S3 GND
- Connect power supply RX to XIAO ESP32S3 D6 (TX)
- Connect power supply TX to XIAO ESP32S3 D7 (RX)

## Installation

1. Clone this repository to a local folder with VS Code and Platform IO installed:
   ```
   git clone https://github.com/csvke/XY-SK120-Modbus-RTU-TTL.git
   ```

2. Choose 'Open Project' from the Platform IO 'PIO Home' page


## Dependencies

- [ModbusMaster](https://github.com/4-20ma/ModbusMaster)

## Usage

### Basic Setup

```cpp
#include <Arduino.h>
#include "XY-SKxxx.h"

// Define hardware serial pins
#define RX_PIN D7 // RX pin
#define TX_PIN D6 // TX pin

// Define Modbus baud rate (XY-SK120 default is 115200)
#define MODBUS_BAUD_RATE 115200

// Create XY_SKxxx instance with the serial pins and slave ID (usually 1)
XY_SKxxx XY_SK120(RX_PIN, TX_PIN, 1);

void setup() {
  Serial.begin(115200);
  
  // Initialize hardware serial
  Serial1.begin(MODBUS_BAUD_RATE, SERIAL_8N1, RX_PIN, TX_PIN);
  
  // Initialize the XY-SK120 library
  XY_SK120.begin(MODBUS_BAUD_RATE);
  
  // Test connection
  if (XY_SK120.testConnection()) {
    Serial.println("Connection successful.");
  } else {
    Serial.println("Connection failed.");
  }
}
```

### Setting Voltage and Current

```cpp
// Set voltage to 5.0V and current to 1.0A
XY_SK120.setVoltageAndCurrent(5.0, 1.0);

// Or set them individually
XY_SK120.setVoltage(5.0);  // Set to 5.0V
XY_SK120.setCurrent(1.0);  // Set to 1.0A
```

### Constant Voltage/Current Modes

```cpp
// Set constant voltage mode to 12V
XY_SK120.setConstantVoltage(12.0);

// Set constant current mode to 0.5A
XY_SK120.setConstantCurrent(0.5);

// Check current operating mode
if (XY_SK120.isInConstantCurrentMode()) {
  Serial.println("Operating in Constant Current (CC) mode");
} else if (XY_SK120.isInConstantVoltageMode()) {
  Serial.println("Operating in Constant Voltage (CV) mode");
}
```

### Turning Output On/Off

```cpp
// Turn output on
XY_SK120.turnOutputOn();

// Turn output off
XY_SK120.turnOutputOff();
```

### Reading Output Status

```cpp
float voltage, current, power;
bool isOn;

if (XY_SK120.getOutputStatus(voltage, current, power, isOn)) {
  Serial.print("Voltage: "); Serial.print(voltage); Serial.println(" V");
  Serial.print("Current: "); Serial.print(current, 3); Serial.println(" A");
  Serial.print("Power: "); Serial.print(power, 3); Serial.println(" W");
  Serial.print("Output: "); Serial.println(isOn ? "ON" : "OFF");
}
```

### Protection Settings

```cpp
// Set over-voltage protection to 30V
XY_SK120.setOverVoltageProtection(30.0);

// Set over-current protection to 5A
XY_SK120.setOverCurrentProtection(5.0);

// Set over-power protection to 150W
XY_SK120.setOverPowerProtection(150.0);

// Set over-temperature protection to 80°C
XY_SK120.setOverTemperatureProtection(80.0);
```

## Serial Command Interface

The included example sketches provide a simple serial command interface to control the XY-SK120:

- `<voltage> <current>` - Set voltage and current limits
- `cv <voltage>` - Set constant voltage mode
- `cc <current>` - Set constant current mode
- `on` - Turn output ON
- `off` - Turn output OFF
- `lock` - Lock keypad
- `unlock` - Unlock keypad
- `status` - Read current status

## Supported Registers

The library supports all major registers of the XY-SK120, including:

- Basic control registers (voltage, current, power)
- Protection settings (OVP, OCP, OPP, OTP)
- System settings (brightness, lock, buzzer)
- Measurement registers (temperature, input voltage)
- Energy meters (amp-hours, watt-hours)

## Implementation Details

### Modbus Register Mapping

The library maps all known Modbus registers from the XY-SK120 documentation. Here's a comprehensive overview of implemented registers and their corresponding library methods:

| Register Address | Description | Data Type | Unit | Library Methods |
|------------------|-------------|-----------|------|----------------|
| 0x0000 (REG_V_SET) | Voltage setting | WORD | V (2 decimal) | `setVoltage()`, `setVoltageAndCurrent()` |
| 0x0001 (REG_I_SET) | Current setting | WORD | A (3 decimal) | `setCurrent()`, `setVoltageAndCurrent()` |
| 0x0002 (REG_VOUT) | Output voltage display | WORD | V (2 decimal) | Read via `readOutput()`, `getOutputStatus()` |
| 0x0003 (REG_IOUT) | Output current display | WORD | A (3 decimal) | Read via `readOutput()`, `getOutputStatus()` |
| 0x0004 (REG_POWER) | Output power display | WORD | W (3 decimal) | Read via `readOutput()`, `getOutputStatus()` |
| 0x0005 (REG_UIN) | Input voltage display | WORD | V (2 decimal) | `readInputVoltage()` |
| 0x0006/0x0007 (REG_AH_LOW/HIGH) | Amp-hour counter | DWORD | mAh | `readAmpHours()` |
| 0x0008/0x0009 (REG_WH_LOW/HIGH) | Watt-hour counter | DWORD | mWh | `readWattHours()` |
| 0x000A/B/C (REG_OUT_H/M/S) | Output time | 3×WORD | h/min/s | `readOutputTime()` |
| 0x000D (REG_T_IN) | Internal temperature | WORD | °C/°F (1 decimal) | `readInternalTemperature()` |
| 0x000E (REG_T_EX) | External temperature | WORD | °C/°F (1 decimal) | `readExternalTemperature()` |
| 0x000F (REG_LOCK) | Key lock status | WORD | 0/1 | `setKeyLock()` |
| 0x0010 (REG_PROTECT) | Protection status | WORD | Bits | `readProtectionStatus()` |
| 0x0011 (REG_CVCC) | CC/CV mode status | WORD | 0/1 | `isInConstantCurrentMode()`, `isInConstantVoltageMode()` |
| 0x0012 (REG_ONOFF) | Output on/off status | WORD | 0/1 | `setOutputState()`, `turnOutputOn()`, `turnOutputOff()` |
| 0x0013 (REG_F_C) | Temperature unit | WORD | 0/1 (°C/°F) | `setTemperatureUnit()`, `getTemperatureUnit()` |
| 0x0014 (REG_B_LED) | Backlight brightness | WORD | 0-5 | `setBacklightBrightness()` |
| 0x0015 (REG_SLEEP) | Sleep timeout | WORD | min | `setSleepTimeout()` |
| 0x0016 (REG_MODEL) | Model number | WORD | - | `readModel()` |
| 0x0017 (REG_VERSION) | Firmware version | WORD | - | `readVersion()` |
| 0x0018 (REG_SLAVE_ADDR) | Modbus slave address | WORD | 1-247 | `setSlaveAddress()` |
| 0x0019 (REG_BAUDRATE_L) | Baud rate setting | WORD | 0-8 | `readBaudRate()`, `setBaudRate()` |
| 0x001A (REG_T_IN_CAL) | Internal temp. calib. | WORD | °C/°F (1 decimal) | `setInternalTempCalibration()` |
| 0x001B (REG_T_EXT_CAL) | External temp. calib. | WORD | °C/°F (1 decimal) | `setExternalTempCalibration()` |
| 0x001C (REG_BUZZER) | Buzzer enable | WORD | 0/1 | `setBuzzer()` |
| 0x001D (REG_EXTRACT_M) | Data group selection | WORD | 0-9 | `selectDataGroup()` |
| 0x001E (REG_SYS_STATUS) | System status | WORD | Bits | `readSystemStatus()` |
| 0x0050 (REG_CV_SET) | Constant voltage setting | WORD | V (2 decimal) | `setConstantVoltage()`, `getConstantVoltage()` |
| 0x0051 (REG_CC_SET) | Constant current setting | WORD | A (3 decimal) | `setConstantCurrent()`, `getConstantCurrent()` |
| 0x0052 (REG_S_VLP) | Under voltage protection | WORD | V (2 decimal) | `setUnderVoltageProtection()`, `getUnderVoltageProtection()` |
| 0x0053 (REG_S_OVP) | Over voltage protection | WORD | V (2 decimal) | `setOverVoltageProtection()`, `getOverVoltageProtection()` |
| 0x0054 (REG_S_OCP) | Over current protection | WORD | A (3 decimal) | `setOverCurrentProtection()`, `getOverCurrentProtection()` |
| 0x0055 (REG_S_OPP) | Over power protection | WORD | W (2 decimal) | `setOverPowerProtection()`, `getOverPowerProtection()` |
| 0x0056/57 (REG_S_OHP_H/M) | High power protection time | 2×WORD | h/min | `setHighPowerProtectionTime()`, `getHighPowerProtectionTime()` |
| 0x0058/59 (REG_S_OAH_L/H) | Over amp-hour protect. | 2×WORD | mAh | `setOverAmpHourProtection()`, `getOverAmpHourProtection()` |
| 0x005A/5B (REG_S_OWH_L/H) | Over watt-hour protect. | 2×WORD | 10mWh | `setOverWattHourProtection()`, `getOverWattHourProtection()` |
| 0x005C (REG_S_OTP) | Over temperature protect. | WORD | °C/°F (1 decimal) | `setOverTemperatureProtection()`, `getOverTemperatureProtection()` |
| 0x005D (REG_S_INI) | Power-on initialization | WORD | 0/1 | `setPowerOnInitialization()`, `getPowerOnInitialization()` |

### OSD Menu Mapping to Library Functions

The XY-SK120 has an On-Screen Display (OSD) with various settings. Here's how these map to library functions:

| OSD Menu Item | Description | Library Method |
|---------------|-------------|----------------|
| SET V | Set voltage | `setVoltage()` |
| SET I | Set current | `setCurrent()` |
| SET | Both V and I at once | `setVoltageAndCurrent()` |
| CV | Constant voltage mode | `setConstantVoltage()` |
| CC | Constant current mode | `setConstantCurrent()` |
| M-SET | Memory preset (data group) | `selectDataGroup()` |
| OVP | Over-voltage protection | `setOverVoltageProtection()` |
| OCP | Over-current protection | `setOverCurrentProtection()` |
| OPP | Over-power protection | `setOverPowerProtection()` |
| UVP | Under-voltage protection | `setUnderVoltageProtection()` |
| OTP | Over-temperature protection | `setOverTemperatureProtection()` |
| OAH | Over amp-hour protection | `setOverAmpHourProtection()` |
| OWH | Over watt-hour protection | `setOverWattHourProtection()` |
| OHP | Over high-power time protection | `setHighPowerProtectionTime()` |
| POW | Power-on state | `setPowerOnInitialization()` |
| KEY | Key lock | `setKeyLock()` |
| BKL | Backlight brightness | `setBacklightBrightness()` |
| BUZ | Buzzer | `setBuzzer()` |
| TUN | Temperature unit (°C/°F) | `setTemperatureUnit()` |
| SLP | Sleep timeout | `setSleepTimeout()` |
| ADR | Modbus address | `setSlaveAddress()` |
| BAD | Baud rate | `setBaudRate()` |

### Unimplemented/Undocumented Features

Some registers and features are not fully implemented because they are:
1. Undocumented in the available Modbus specification
2. Related to specialized hardware add-ons (e.g., WiFi module, RTC)
3. System-level functions requiring additional research

These include:
- Registers 0x0030-0x0034 (related to Sinilink ESP8285H16 module)
- Registers 0x0100-0x0103 (RTC settings)
- Registers 0x0110-0x011D (weather information)
- Calibration functions (Zero, CLU, CLA)
- Factory reset function
- MPPT solar charging settings

## Timing Considerations

The library implements specific timing controls for Modbus RTU communication:
- Silent interval calculations based on baud rate
- Pre-transmission and post-transmission handlers
- Retry mechanisms for improved reliability
- Proper command sequencing with appropriate delays

These timing controls ensure reliable communication with the device following the Modbus RTU specification.

## Limitations

- Only tested with XY-SK120 model. May work with other XY-SK series models.
- Not all registers are fully documented or implemented.
- Some advanced features like data logging, calibration, etc. are not implemented.

## Troubleshooting

- **No communication:** Check baud rate, wiring, and slave ID
- **Erratic behavior:** Ensure proper timing between commands (library handles this internally)
- **Protection trips:** Check your protection settings and load conditions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on ModbusMaster library by Doc Walker
- Inspired by the need for better control of the XY-SK120 module
