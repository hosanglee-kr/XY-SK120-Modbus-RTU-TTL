# XY-SK120 Web Interface Documentation

This document covers the setup, usage, debugging, and development aspects of the web interface for controlling the XY-SK120 power supply.

## Table of Contents
- [Setup](#setup)
- [Usage](#usage)
- [Debugging & Logging](#debugging--logging)
- [Developer Guide](#developer-guide)
- [TODO List](#todo-list)

## Setup

### Requirements
- ESP32 board with the firmware uploaded
- Device accessible via WiFi
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Initial Connection
1. Power on the device
2. On first boot, the device creates an access point named "XY-SK120-Setup"
3. Connect to this access point using a phone, tablet, or computer
4. A configuration portal should open automatically (or navigate to http://192.168.4.1)
5. Configure your WiFi credentials
6. Once connected to your network, the device's IP address will be displayed on the serial monitor
7. Access the web interface by navigating to that IP address in your browser

### Connection Troubleshooting
- If the device cannot connect to the configured WiFi, it will revert to AP mode
- Hold the reset button (GPIO0) during boot for 3 seconds to reset WiFi settings
- Check the serial monitor output (115200 baud) for diagnostic information

## Usage

### Main Interface
The web interface provides a user-friendly way to control and monitor the XY-SK120 power supply:

1. **Status Display** - Shows real-time readings:
   - Output voltage (V)
   - Output current (A)
   - Output power (W)
   - Operating mode (CV/CC/CP)
   - Output status (ON/OFF)
   - Key lock status

2. **Basic Controls**
   - Power ON/OFF toggle
   - Key lock toggle
   - Quick voltage/current setting

3. **Operating Mode Controls**
   - Constant Voltage (CV) mode settings
   - Constant Current (CC) mode settings
   - Constant Power (CP) mode settings
   - Enable/disable CP mode

4. **Settings**
   - WiFi configuration
   - Device settings
   - UI preferences
   - Device management

### Settings Panel
The Settings panel provides access to:

1. **WiFi Settings**:
   - View current WiFi status, SSID, and IP
   - Refresh WiFi status
   - Reset WiFi settings (requires device restart)

2. **Device Settings**:
   - Device name configuration
   - Modbus configuration
   - Update interval settings

3. **UI Settings**:
   - Dark/light mode toggle
   - Auto-refresh toggle and interval
   - WebSocket logs access

4. **Device Manager**:
   - Save and manage connections to multiple devices
   - Quick connection to saved devices

## Debugging & Logging

### WebSocket Logs
The interface provides a built-in WebSocket communication logger for debugging:

1. Access via: **Settings > Web UI > Open WebSocket Logs**
2. The log viewer shows:
   - Messages sent from browser to device (blue)
   - Messages received from device (green)
   - Timestamps are automatically included
   
3. Controls:
   - Pause/Resume: Temporarily halt logging
   - Clear: Remove all current logs
   - Close: Hide the log viewer

### Browser Console Debugging
Advanced debugging information is available in the browser console:

1. Open browser developer tools (F12 or Ctrl+Shift+I)
2. Navigate to the Console tab
3. Look for messages prefixed with:
   - Standard logs: Normal information
   - Warnings: Potential issues (yellow)
   - Errors: Critical problems (red)

4. Available debug functions:
   - `window.debugSettingsTabs()`: Check and fix settings tab issues
   - `updateAllStatus()`: Force a full status update
   - `requestKeyLockStatus()`: Check key lock status

### Firmware Logging
The firmware logs diagnostic information to the serial port:

1. Connect to serial port at 115200 baud
2. Messages are timestamped with [HH:MM:SS.mmm] format
3. Message types:
   - `[INFO]`: Normal operation messages
   - `[ERROR]`: Critical errors
   - `[DEBUG]`: Detailed debug information
   - `[WARNING]`: Potential issues
   
4. WebSocket communication is logged with `(src_ip) > (dst_ip)` format

## Developer Guide

### Architecture Overview
The web interface uses a client-server architecture:

1. **Server (ESP32)**:
   - Handles WebSocket communication via AsyncWebServer
   - Serves static files from LittleFS
   - Provides REST API endpoints
   - Interfaces with the XY-SKxxx library

2. **Client (Browser)**:
   - HTML/CSS interface using Tailwind CSS
   - Vanilla JavaScript with modular design
   - WebSocket for real-time updates
   - Responsive design for desktop/mobile

### WebSocket Communication
The WebSocket connection (`ws://device-ip/ws`) is used for bidirectional communication:

1. **Connection Lifecycle**:
   - Client connects on page load
   - Server logs connection events
   - Automatic reconnection on disconnect
   - Ping/pong messages maintain connection

2. **Message Format** (JSON):
   ```json
   {
     "action": "commandName",
     "param1": "value1",
     "param2": "value2"
   }
   ```

3. **Response Format** (JSON):
   ```json
   {
     "action": "commandNameResponse",
     "success": true,
     "param1": "value1"
   }
   ```

4. **Common Actions**:
   - `getStatus`: Request complete device status
   - `powerOutput`: Toggle output state
   - `setVoltage`, `setCurrent`: Set basic parameters
   - `setConstantVoltage`, `setConstantCurrent`, `setConstantPower`: Set operating mode
   - `setKeyLock`: Control front panel lock
   - `ping`: Keep connection alive

5. **Implementation**:
   - Server: `web_interface.cpp` -> `handleWebSocketMessage()`
   - Client: `core.js` -> `sendCommand()` and `handleMessage()`

### REST API Endpoints
In addition to WebSocket, the following REST API endpoints are available:

1. `/api/data` - GET
   - Returns current power supply readings

2. `/api/config` - GET/POST
   - GET: Retrieve device configuration
   - POST: Update device configuration

3. `/api/wifi/status` - GET
   - Returns WiFi connection information

4. `/api/wifi/reset` - POST
   - Resets WiFi settings and restarts device

5. `/api/timezone` - GET/POST
   - GET: List available time zones
   - POST: Set current time zone

6. `/health` and `/ping`
   - Simple health check endpoints

### Front-end JavaScript Architecture
The front-end uses a modular JavaScript architecture:

1. **Core Module** (`core.js`):
   - WebSocket initialization and management
   - Command sending framework
   - Module loading and dependency injection

2. **Status Module** (`status.js`):
   - UI update functions for device readings
   - Heartbeat indicator management
   - Feedback animations

3. **Basic Control Module** (`basic_control.js`):
   - Power and key lock toggles
   - Status refresh handling
   - Auto-refresh mechanism

4. **Settings Module** (`settings_tabs.js`):
   - Settings panel tab management
   - Theme switching
   - Debug utilities

5. **Log Viewer Module** (`log_viewer.js`):
   - WebSocket message logging
   - Log filtering and display
   - Copy and export functionality

### Update Implementation
Status updates flow through the system as follows:

1. **Automatic Updates**:
   - Client initializes auto-refresh timer
   - Timer sends `getStatus` commands at regular intervals
   - Configurable interval (1-30 seconds)
   - Visual heartbeat indicator shows status

2. **Manual Updates**:
   - User can click refresh buttons
   - Settings changes trigger targeted updates
   - Mode switching updates relevant parameters

3. **Data Flow**:
   1. Browser requests update via WebSocket
   2. Firmware queries XY-SKxxx library
   3. Power supply responds via Modbus RTU
   4. Firmware formats and returns data
   5. Browser updates UI with new values

4. **Optimizations**:
   - Caching prevents excessive device queries
   - Targeted updates for specific parameters
   - Event-based updates for user actions

## TODO List

The following features exist in the serial monitor interface but need to be implemented or improved in the web interface:

### Already Implemented:
- [x] Basic output control (power on/off)
- [x] Voltage, current, and power reading
- [x] Operating mode display (CV/CC/CP)
- [x] Constant voltage/current/power setting
- [x] Key lock control
- [x] Stored settings across reboots
- [x] Real-time status updates

### Pending Implementation:
- [ ] Protection settings (OVP, OCP, OPP, UVP)
- [ ] Energy metering display
- [ ] Temperature monitoring
- [ ] Presets/profile saving and loading
- [ ] Data logging to file
- [ ] Graph visualization of readings over time
- [ ] Sequential operation (programming sequences)
- [ ] Calibration interface
- [ ] Firmware update via web interface
- [ ] MQTT integration
- [ ] REST API documentation page

### Improvements Needed:
- [ ] Better error handling and user feedback
- [ ] More robust reconnection logic
- [ ] UI responsiveness on very small screens
- [ ] Offline mode with reconnection
- [ ] Multi-language support
- [ ] Enhanced security options
- [ ] Client-side parameter validation

## Contributing

Contributions to the web interface are welcome! Please follow these guidelines:

1. Keep the modular architecture intact
2. Test on multiple browsers and devices
3. Document new features in this README
4. Follow the existing code style
5. Add appropriate logging for debugging

## License

This project is licensed under the MIT License - see the LICENSE file for details.
