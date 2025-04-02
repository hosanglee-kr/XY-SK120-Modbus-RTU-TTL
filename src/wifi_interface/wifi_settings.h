#ifndef WIFI_SETTINGS_H
#define WIFI_SETTINGS_H

#include <Arduino.h>
#include <String>

// Function to save WiFi credentials to NVS
bool saveWiFiCredentialsToNVS(const String& ssid, const String& password);

// Function to load WiFi credentials from NVS
String loadWiFiCredentialsFromNVS();

// Function to reset WiFi settings
bool resetWiFi();

// Function to get WiFi status as a JSON string
String getWifiStatus();

#endif // WIFI_SETTINGS_H
