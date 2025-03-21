#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"
#include "XY-SKxxx_Config.h"
#include "serial_core.h" // Add this to access displayDeviceStatus

// Display the main menu
void displayMainMenu();

// Handle main menu commands
void handleMainMenu(const String& input, XY_SKxxx* ps, XYModbusConfig& config);
