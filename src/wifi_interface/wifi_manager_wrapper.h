#ifndef WIFI_MANAGER_WRAPPER_H
#define WIFI_MANAGER_WRAPPER_H

#include <Arduino.h>
#include <IPAddress.h>

// WiFi manager wrapper functions to prevent include conflicts
bool initWiFiManager(const char* apName, const char* apPassword = NULL);
void resetWiFiSettings();
bool isWiFiConnected();
String getWiFiSSID();
String getWiFiIP();
int getWiFiRSSI();
String getWiFiMAC();

#endif // WIFI_MANAGER_WRAPPER_H
