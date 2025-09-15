#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"
#include "XY-SKxxx-cd-data-group.h"

// Display the CD Data Group menu
void displayCDDataMenu();

// Handle CD Data Group menu commands
void handleCDDataMenu(const String& input, XY_SKxxx* ps);
