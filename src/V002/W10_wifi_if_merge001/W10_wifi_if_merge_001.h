// W10_wifi_if_merge_001.h

// Auto-generated merged header from uploaded components
#pragma once


#include <Arduino.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>

#include <ESPAsyncWebServer.h>
#include <Preferences.h>
#include <algorithm>

#include <vector>

// Declarations merged from original headers


// ==== Begin wifi_manager_wrapper.h ====
// #include <String.h>

// Include wifi_settings.h first to get the shared constants

// Initialize WiFi Manager with AP name
bool initWiFiManager(const char* apName);

// Initialize WiFi Manager with AP name and password
bool initWiFiManager(const char* apName, const char* apPassword);

// Connect to saved networks in priority order
bool connectToSavedNetworks();

// Reset WiFi settings
void resetWiFiSettings();

// Check if WiFi is connected
bool isWiFiConnected();

// Get WiFi SSID
String getWiFiSSID();

// Get WiFi IP address
String getWiFiIP();

// Get WiFi RSSI
int getWiFiRSSI();

// Get WiFi MAC address
String getWiFiMAC();

// Exit the config portal properly
bool exitConfigPortal();

// Process WiFiManager credentials to our storage system
void processWiFiManagerCredentials();

// Sync current WiFi connection to our storage
void syncCurrentWiFiToStorage();

// WiFiManager save credentials callback
void saveWifiCallback();

// Legacy functions that now call the NVS versions
bool saveWiFiCredentials(const String& ssid, const String& password);
String loadWiFiCredentials();
// ==== End wifi_manager_wrapper.h ====


// ==== Begin wifi_settings.h ====
// #include <String>

// Constants
#define WIFI_NAMESPACE "wificonfig"
#define WIFI_CREDENTIALS_KEY "credentials" 
#define WIFI_CREDENTIALS_JSON_SIZE 2048
#define MAX_SAVED_NETWORKS 10

// Function declarations
String loadWiFiCredentialsFromNVS();
//// bool saveWiFiCredentialsToNVS(const String& json);
String sanitizeString(const String& input);
bool repairWiFiCredentials();

// Function to save WiFi credentials to NVS
bool saveWiFiCredentialsToNVS(const String& ssid, const String& password, int priority = -1);

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
// ==== End wifi_settings.h ====


// ==== Begin wifi_manager_helper.h ====
// Forward declare WiFiManager class to avoid header inclusion conflicts
class WiFiManager;

/**
 * Updates the password for the given SSID in NVS storage with the actual password from WiFiManager
 * 
 * @param ssid The SSID to update
 * @param wm Reference to the WiFiManager instance
 * @return true if updated successfully, false otherwise
 */
bool updateSavedWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm);

/**
 * Attempts to retrieve a password for the given SSID from WiFiManager
 * Note: WiFiManager can only directly provide the password for the currently connected network
 * 
 * @param ssid The SSID to get the password for
 * @param wm Reference to the WiFiManager instance
 * @return The password, or empty string if not found/available
 */
String getWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm);
// ==== End wifi_manager_helper.h ====


// ==== Begin wifi_manager_overloads.h ====
// Simplified versions of the helper functions that use the global wifiManager

/**
 * Updates the password for the given SSID in NVS storage with the actual password from WiFiManager
 * Uses the global wifiManager instance
 * 
 * @param ssid The SSID to update
 * @return true if updated successfully, false otherwise
 */
bool updateSavedWiFiPasswordFromWiFiManager(const String& ssid);

/**
 * Attempts to retrieve a password for the given SSID from WiFiManager
 * Uses the global wifiManager instance
 * 
 * @param ssid The SSID to get the password for
 * @return The password, or empty string if not found/available
 */
String getWiFiPasswordFromWiFiManager(const String& ssid);
// ==== End wifi_manager_overloads.h ====


// ==== Begin wifi_websocket_handler.h ====
// Function declarations
void handleAddWifiNetworkCommand(AsyncWebSocketClient* client, DynamicJsonDocument& doc);
void handleRemoveWifiNetworkCommand(AsyncWebSocketClient* client, DynamicJsonDocument& doc);
void handleConnectWifiCommand(AsyncWebSocketClient* client, DynamicJsonDocument& doc);
void sendErrorResponse(AsyncWebSocketClient* client, const String& error);
// ==== End wifi_websocket_handler.h ====


// ==== Begin wifi_manager_instance.h ====
// Declare the WiFiManager instance as external
extern WiFiManager wifiManager;

// Function to get a reference to the WiFiManager instance
WiFiManager& getWiFiManager();

// Initialize the WiFiManager instance with default settings
void initWiFiManagerInstance();
// ==== End wifi_manager_instance.h ====
