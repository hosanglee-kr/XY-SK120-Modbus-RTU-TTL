#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"

// Display the basic control menu
void displayBasicControlMenu();

// Handle basic control commands
void handleBasicControl(const String& input, XY_SKxxx* ps);
