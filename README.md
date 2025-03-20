# XY-SK120 Modbus RTU Control

This project allows you to control an XY-SK120 power supply (and compatible models) over Modbus RTU using a Seeed XIAO ESP32S3.

## Features

- Serial monitor control interface
- Memory group management
- Direct register access for debugging
- Web interface (coming soon)

## Hardware Setup

- Connect the XIAO ESP32S3 to the XY-SK120 using the TTL interface:
  - XIAO TX pin → XY-SK120 RX pin
  - XIAO RX pin → XY-SK120 TX pin
  - XIAO GND → XY-SK120 GND

## Serial Monitor Commands

### Basic Commands

- `on` - Turn output ON
- `off` - Turn output OFF
- `set V I` - Set voltage (V) and current (I)
- `status` - Display current status
- `info` - Display device information
- `config` - Display current configuration
- `save` - Save current config to NVS
- `reset` - Reset config to defaults
- `help` - Show help message

### Memory Group Commands

- `mem N` - Display memory group N (0-9)
- `call N` - Call memory group N (1-9) to active memory
- `save2mem N` - Save current settings to memory group N (1-9)
- `setmem N param value` - Set specific parameter in memory group N
  - Parameters: v(voltage), i(current), p(power), ovp, ocp, opp, oah, owh, uvp, ucp

### Debug Commands

The project supports direct register access for debugging and advanced usage:

- `read addr count` - Read 'count' registers starting at address 'addr'
- `write addr value` - Write 'value' to register at address 'addr'
- `writes addr v1 v2 ...` - Write multiple values to consecutive registers

Examples:
- `read 0x0000 1` - Read the voltage setting register (result shows different scaling factors)
- `write 0x0000 1250` - Set voltage to 12.50V (1250/100)
- `read 0x0002 3` - Read output voltage, current, and power

Addresses can be provided in decimal or hexadecimal (with 0x prefix).

## Register Map

The power supply uses the following register map (partial list):

| Address | Description | Unit | Scaling | R/W |
|---------|-------------|------|---------|-----|
| 0x0000  | Voltage setting | V | /100 | R/W |
| 0x0001  | Current setting | A | /1000 | R/W |
| 0x0002  | Output voltage | V | /100 | R |
| 0x0003  | Output current | A | /1000 | R |
| 0x0004  | Output power | W | /100 | R |
| 0x0012  | Output on/off | 0/1 | - | R/W |

For a more complete register map, see the XY-SKxxx library documentation.

## Building

This project uses PlatformIO. To build and upload:

```
pio run -t upload
```

## License

[MIT License](LICENSE)
