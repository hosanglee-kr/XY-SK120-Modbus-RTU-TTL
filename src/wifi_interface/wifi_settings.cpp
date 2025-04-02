#include "wifi_settings.h"
#include "wifi_manager_wrapper.h" // Include wifi_manager_wrapper for resetWiFiSettings
#include <Preferences.h>
#include <ArduinoJson.h>

// NVS namespace for WiFi credentials
#define WIFI_NAMESPACE "wifi_creds"
#define WIFI_CREDENTIALS_KEY "wifi_list"

// Max size of JSON document for WiFi credentials
#define WIFI_CREDENTIALS_JSON_SIZE 2048

// Function to get WiFi status as a JSON string
String getWifiStatus() {
  DynamicJsonDocument doc(512);
  doc["status"] = isWiFiConnected() ? "connected" : "disconnected";
  doc["ssid"] = getWiFiSSID();
  doc["ip"] = getWiFiIP();
  doc["rssi"] = getWiFiRSSI();
  doc["mac"] = getWiFiMAC();

  String jsonString;
  serializeJson(doc, jsonString);
  return jsonString;
}

bool saveWiFiCredentialsToNVS(const String& ssid, const String& password) {
    Preferences prefs;
    prefs.begin(WIFI_NAMESPACE, false); // Read-write mode

    // Load existing credentials
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");

    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(doc, wifiListJson);
    if (error) {
        Serial.println("Failed to parse wifi list: " + String(error.c_str()));
        prefs.end();
        return false;
    }

    JsonArray wifiList = doc.to<JsonArray>();

    // Create a new JSON object for the new credentials
    JsonObject newCreds = wifiList.createNestedObject();
    newCreds["ssid"] = ssid;
    newCreds["password"] = password;

    // Serialize the updated JSON document
    String updatedWifiListJson;
    serializeJson(doc, updatedWifiListJson);

    // Save the updated JSON string to NVS
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedWifiListJson);
    prefs.end();

    if (!success) {
        Serial.println("Failed to save wifi credentials");
    }

    return success;
}

String loadWiFiCredentialsFromNVS() {
    Preferences prefs;
    prefs.begin(WIFI_NAMESPACE, true); // Read-only mode
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();
    return wifiListJson;
}

bool resetWiFi() {
    resetWiFiSettings(); // Call the function from wifi_manager_wrapper
    return true; // Assume success, as there's no return value from resetWiFiSettings
}
