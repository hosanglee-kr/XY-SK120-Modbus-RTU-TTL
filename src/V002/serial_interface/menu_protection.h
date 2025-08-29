#ifndef MENU_PROTECTION_H
#define MENU_PROTECTION_H

#include "XY-SKxxx.h"
#include <Arduino.h>

// Display the protection menu
void displayProtectionMenu();

// Handle protection menu commands
void handleProtectionMenu(const String& input, XY_SKxxx* ps);

// Remove this commented out declaration as it's properly declared in serial_core.h
// extern void displayDeviceProtectionStatus(XY_SKxxx* ps);

#endif // MENU_PROTECTION_H
