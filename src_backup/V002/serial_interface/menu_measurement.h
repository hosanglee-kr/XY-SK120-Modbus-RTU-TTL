#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"

// Display the measurement menu
void displayMeasurementMenu();

// Handle measurement menu commands
void handleMeasurementMenu(const String& input, XY_SKxxx* ps);
