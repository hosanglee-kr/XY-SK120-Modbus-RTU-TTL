// This file is now just a stub that includes the functionality 
// from the refactored modules.

#include "menu_wifi.h"
#include "serial_core.h"
#include "serial_interface.h"
#include <WiFi.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <vector>
#include "../wifi_interface/wifi_settings.h"
#include <WiFiManager.h>

// Note: The implementation of these functions 
// is now in menu_wifi_core.cpp, menu_wifi_connect.cpp, and menu_wifi_display.cpp
