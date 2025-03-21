#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"
#include "serial_interface.h"

// Initialize the serial interface
void initializeSerialInterface();

// Process commands
void processSerialCommand(const String& input, XY_SKxxx* ps, XYModbusConfig& config);

// Get current menu state
MenuState getCurrentMenuState();

// Set current menu state
void setMenuState(MenuState state);

// Display device info
void displayDeviceInfo(XY_SKxxx* ps);

// Display power supply status
void displayStatus(XY_SKxxx* ps);
