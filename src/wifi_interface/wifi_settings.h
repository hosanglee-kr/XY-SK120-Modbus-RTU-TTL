#ifndef WIFI_SETTINGS_H
#define WIFI_SETTINGS_H

#include <Arduino.h>
#include <String>
#include <vector>
#include <algorithm>

// Shared WiFi constants - now centralized in this header
#define WIFI_NAMESPACE "wifi_creds"
#define WIFI_CREDENTIALS_KEY "wifi_list"
#define WIFI_CREDENTIALS_JSON_SIZE 4096
#define WIFI_CREDENTIALS_MAX_SIZE 3072

// Function to save WiFi credentials to NVS
bool saveWiFiCredentialsToNVS(const String& ssid, const String& password, int priority = -1);

// Function to load WiFi credentials from NVS
String loadWiFiCredentialsFromNVS();

// Function to remove a WiFi credential by index
bool removeWiFiCredentialByIndex(int index);

// Function to update priority of a WiFi network
bool updateWiFiNetworkPriority(int index, int newPriority);

// Function to reset WiFi settings
bool resetWiFi();

// Function to get WiFi status as a JSON string
String getWifiStatus();

// Forward declaration of function in wifi_manager_wrapper.cpp
bool connectToSavedNetworks();

#endif // WIFI_SETTINGS_H
