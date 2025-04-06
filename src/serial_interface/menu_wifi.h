#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"

// Display the WiFi settings menu
void displayWiFiMenu();

// Handle WiFi menu commands
void handleWiFiMenu(const String& input, XY_SKxxx* ps);

// Scan and display available WiFi networks
void scanWiFiNetworks();

// Display current WiFi status and settings
void displayWiFiStatus();

// Connect to a WiFi network
bool connectToWiFi(const String& ssid, const String& password);

// Set up WiFi in AP mode
bool setupWiFiAP(const String& ssid, const String& password);

// Display saved WiFi networks
void displaySavedWiFiNetworks();

// Helper function to extract quoted parameters from a command
bool extractQuotedParameters(const String& input, String& command, String& param1, String& param2);

// Exit AP mode and return to station mode
bool exitAPMode();

// Helper function to handle saving current WiFi
void handleSaveCurrentWiFi();

// Display IP information
void displayIPInfo();

// Helper function to manually sync current WiFi to NVS storage
void syncCurrentWiFi();

// Dedicated function to handle adding WiFi networks
void handleAddWifi(const String& input, String ssid, String password, int priority);

// External declaration of the function from wifi_settings.cpp
// This prevents us from redefining it in menu_wifi_core.cpp
extern String loadWiFiCredentialsFromNVS();
