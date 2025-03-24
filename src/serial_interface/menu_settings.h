#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"
#include "XY-SKxxx_Config.h"

// Display the settings menu
void displaySettingsMenu();

// Handle settings menu commands
void handleSettingsMenu(const String& input, XY_SKxxx* ps, XYModbusConfig& config);

// Display basic device settings
void displayDeviceSettings(XY_SKxxx* ps);

// Display all device settings
void displayAllDeviceSettings(XY_SKxxx* ps);
