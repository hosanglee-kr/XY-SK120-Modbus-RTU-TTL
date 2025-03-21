#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"

// Display the protection menu
void displayProtectionMenu();

// Handle protection menu commands
void handleProtectionMenu(const String& input, XY_SKxxx* ps);
