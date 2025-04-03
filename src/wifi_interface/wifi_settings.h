#ifndef WIFI_SETTINGS_H
#define WIFI_SETTINGS_H

#include <Arduino.h>
#include <String>

// Function to save WiFi credentials to NVS
bool saveWiFiCredentialsToNVS(const String& ssid, const String& password);

// Function to load WiFi credentials from NVS
String loadWiFiCredentialsFromNVS();

// Function to remove a WiFi credential by index
bool removeWiFiCredentialByIndex(int index);

// Function to reset WiFi settings
bool resetWiFi();

// Function to get WiFi status as a JSON string
String getWifiStatus();

// Define the maximum size for WiFi credentials JSON document
#define WIFI_CREDENTIALS_JSON_SIZE 2048

#endif // WIFI_SETTINGS_H
