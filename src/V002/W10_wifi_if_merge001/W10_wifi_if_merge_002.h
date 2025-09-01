// W10_wifi_if_merge_002.h

#pragma once

#include <Arduino.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>
#include <Preferences.h>
#include <vector>
#include <algorithm>

// =============================
// Constants
// =============================
#define WIFI_NAMESPACE "wificonfig"
#define WIFI_CREDENTIALS_KEY "credentials"
#define WIFI_CREDENTIALS_JSON_SIZE 2048
#define MAX_SAVED_NETWORKS 10

// =============================
// WiFi Manager Wrapper
// =============================

// Initialize WiFi Manager with AP name
bool initWiFiManager(const char* apName);
bool initWiFiManager(const char* apName, const char* apPassword);

// Connect to saved networks in priority order
bool connectToSavedNetworks();

// Reset WiFiManager settings
void resetWiFiManager();

// Exit the config portal properly
bool exitConfigPortal();

// Check WiFi connection state
bool isWiFiConnected();
String getWiFiSSID();
String getWiFiIP();
int getWiFiRSSI();
String getWiFiMAC();

// Sync helpers
void processWiFiManagerCredentials();
void syncCurrentWiFiToStorage();

// Legacy wrappers
bool saveWiFiCredentials(const String& ssid, const String& password);
String loadWiFiCredentials();

// =============================
// WiFi Settings (NVS)
// =============================

// Sanitize input string
String sanitizeString(const String& input);

// Repair WiFi credentials in NVS
bool repairWiFiCredentials();

// Save / load / remove / update WiFi credentials
bool saveWiFiCredentialsToNVS(const String& ssid, const String& password, int priority = -1);
String loadWiFiCredentialsFromNVS();
bool removeWiFiCredentialByIndex(int index);
bool updateWiFiNetworkPriority(int index, int newPriority);

// Reset NVS WiFi storage
bool resetWiFiNVS();

// Get WiFi status as JSON string
String getWifiStatus();

// =============================
// WiFi Manager Helper
// =============================
bool updateSavedWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm);
String getWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm);

// Simplified overloads using global wifiManager
bool updateSavedWiFiPasswordFromWiFiManager(const String& ssid);
String getWiFiPasswordFromWiFiManager(const String& ssid);

// =============================
// WiFi WebSocket Handler
// =============================
void handleAddWifiNetworkCommand(AsyncWebSocketClient* client, DynamicJsonDocument& doc);
void handleRemoveWifiNetworkCommand(AsyncWebSocketClient* client, DynamicJsonDocument& doc);
void handleConnectWifiCommand(AsyncWebSocketClient* client, DynamicJsonDocument& doc);
void sendErrorResponse(AsyncWebSocketClient* client, const String& error);

// =============================
// WiFi Connection (single network)
// =============================
bool connectToSingleNetwork(JsonObject network);

// =============================
// WiFi Manager Instance
// =============================
// Global WiFiManager instance
extern WiFiManager wifiManager;
WiFiManager& getWiFiManager();
void initWiFiManagerInstance();
