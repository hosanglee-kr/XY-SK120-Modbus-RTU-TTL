import os
import sys
import glob
import serial
import platform
from SCons.Script import Import, DefaultEnvironment

env = DefaultEnvironment()

def auto_detect_port():
    """Auto-detect the serial port for the XIAO ESP32S3 device"""
    print("Looking for XIAO ESP32S3 serial port...")
    
    system = platform.system()
    ports = []
    
    # List all available serial ports based on OS
    if system == 'Darwin':  # macOS
        ports = glob.glob('/dev/cu.*')
        # Prioritize these common XIAO ESP32S3 patterns
        xiao_patterns = ['/dev/cu.usbmodem', '/dev/cu.wchusbserial']
    elif system == 'Linux':
        ports = glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*')
        xiao_patterns = ['/dev/ttyACM', '/dev/ttyUSB']
    elif system == 'Windows':
        ports = ['COM%s' % (i + 1) for i in range(256)]
        xiao_patterns = ['COM']
    else:
        print(f"Unsupported platform: {system}")
        return None
    
    # Filter ports that exist and might be Arduino devices
    arduino_ports = []
    for port in ports:
        # Skip non-existent ports on Windows
        if system == 'Windows' and not os.path.exists(f"\\\\.\\{port}"):
            continue
            
        # Check if port matches any XIAO pattern
        for pattern in xiao_patterns:
            if pattern in port:
                arduino_ports.append(port)
                break
    
    if len(arduino_ports) == 0:
        print("No suitable serial ports found")
        return None
    
    # If we have exactly one suitable port, use it
    if len(arduino_ports) == 1:
        print(f"Found XIAO ESP32S3 at {arduino_ports[0]}")
        return arduino_ports[0]
    
    # If we have multiple ports, try to identify the right one
    # Sort ports to prioritize more likely candidates
    # Example: put /dev/cu.usbmodem* ports before others
    arduino_ports.sort(key=lambda x: 0 if 'usbmodem' in x.lower() else 1)
    
    print(f"Multiple possible ports found: {', '.join(arduino_ports)}")
    print(f"Using first available port: {arduino_ports[0]}")
    
    return arduino_ports[0]

# Set the upload port if it can be detected
detected_port = auto_detect_port()
if detected_port:
    print(f"Setting upload_port to {detected_port}")
    env.Replace(UPLOAD_PORT=detected_port)
else:
    print("Could not auto-detect upload port. Please specify manually or connect your device.")

# Also use the same port for monitor
if 'UPLOAD_PORT' in env:
    env.Replace(MONITOR_PORT=env['UPLOAD_PORT'])
