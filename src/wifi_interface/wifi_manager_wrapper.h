#ifndef WIFI_MANAGER_WRAPPER_H
#define WIFI_MANAGER_WRAPPER_H

#include <Arduino.h>
#include <IPAddress.h>
#include <String>

// Max size of JSON document for WiFi credentials
#define WIFI_CREDENTIALS_JSON_SIZE 2048

// WiFi manager wrapper functions to prevent include conflicts
bool initWiFiManager(const char* apName, const char* apPassword = NULL);
void resetWiFiSettings();
bool isWiFiConnected();
String getWiFiSSID();
String getWiFiIP();
int getWiFiRSSI();
String getWiFiMAC();

// New functions for managing multiple WiFi credentials
bool saveWiFiCredentials(const String& ssid, const String& password);
String loadWiFiCredentials();

#endif // WIFI_MANAGER_WRAPPER_H
