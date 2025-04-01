#!/bin/bash

echo "Starting flash process for XIAO ESP32S3 to XY-SK120 firmware v 0.1..."

# Find the correct port
PORT=$(ls /dev/tty.usbmodem* 2>/dev/null)

if [ -z "$PORT" ]; then
    echo "Error: No USB device found!"
    exit 1
fi

echo "Using port: $PORT"

# Flash LittleFS
echo "Flashing LittleFS..."
esptool.py --chip esp32s3 --port $PORT --baud 921600 --before default_reset --after hard_reset write_flash -z 0x510000 littlefs_webUI_v0.1.bin

# Small delay
sleep 2

# Flash Firmware
echo "Flashing Firmware..."
esptool.py --chip esp32s3 --port $PORT --baud 921600 --before default_reset --after hard_reset write_flash -z 0x10000 firmware_v0.1.bin

echo "Flash complete!"