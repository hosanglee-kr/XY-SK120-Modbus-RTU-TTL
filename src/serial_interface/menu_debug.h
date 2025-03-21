#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"

// Display the debug menu
void displayDebugMenu();

// Handle debug menu commands
void handleDebugMenu(const String& input, XY_SKxxx* ps);
