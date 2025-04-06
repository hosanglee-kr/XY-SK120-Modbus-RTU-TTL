#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "wifi_settings.h"

// Define constants if not already defined elsewhere
#ifndef WIFI_NAMESPACE
#define WIFI_NAMESPACE "wificonfig"
#endif

#ifndef WIFI_CREDENTIALS_KEY
#define WIFI_CREDENTIALS_KEY "credentials"
#endif

#ifndef WIFI_CREDENTIALS_JSON_SIZE
#define WIFI_CREDENTIALS_JSON_SIZE 2048
#endif

// Helper function to send error response
void sendErrorResponse(AsyncWebSocketClient* client, const String& error) {
    DynamicJsonDocument responseDoc(128);
    responseDoc["action"] = "error";
    responseDoc["error"] = error;
    
    String response;
    serializeJson(responseDoc, response);
    client->text(response);
}

// Make sure to include our sanitization function
extern String sanitizeString(const String& input);

// Handle adding a new WiFi network
void handleAddWifiNetworkCommand(AsyncWebSocketClient* client, DynamicJsonDocument& doc) {
    if (!doc.containsKey("ssid") || !doc.containsKey("password")) {
        sendErrorResponse(client, "Missing SSID or password");
        return;
    }
    
    // Get and sanitize the SSID and password
    String originalSsid = doc["ssid"].as<String>();
    String originalPassword = doc["password"].as<String>();
    
    String ssid = sanitizeString(originalSsid);
    String password = sanitizeString(originalPassword);
    
    // Alert if there was sanitization
    if (originalSsid != ssid || originalPassword != password) {
        Serial.println("Input sanitized: Control characters removed from WiFi credentials");
    }
    
    int priority = doc.containsKey("priority") ? doc["priority"].as<int>() : 1;
    
    // Get saved networks JSON - use the same logic as the serial interface
    Preferences prefs;
    String wifiListJson;
    
    if (prefs.begin(WIFI_NAMESPACE, true)) { // Read-only mode first
        wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
    } else {
        sendErrorResponse(client, "Failed to access saved WiFi information.");
        return;
    }
    
    // Parse existing JSON
    DynamicJsonDocument wifiDoc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(wifiDoc, wifiListJson);
    
    if (error) {
        Serial.println("Error parsing saved WiFi networks. Creating new list.");
        wifiDoc.clear();
        wifiDoc = JsonArray(); // Ensure it's initialized as an array
    }
    
    // Check if this network already exists
    JsonArray networks = wifiDoc.as<JsonArray>();
    bool networkExists = false;
    
    for (JsonObject network : networks) {
        String savedSSID = network["ssid"].as<String>();
        if (savedSSID == ssid) {
            // Update existing network
            network["password"] = password;
            network["priority"] = priority;
            networkExists = true;
            break;
        }
    }
    
    // If network doesn't exist, add it
    if (!networkExists) {
        JsonObject network = networks.createNestedObject();
        network["ssid"] = ssid;
        network["password"] = password;
        network["priority"] = priority;
    }
    
    // Serialize back to string
    String updatedJson;
    serializeJson(wifiDoc, updatedJson);
    
    // Debug output
    Serial.print("WiFi credentials JSON size: ");
    Serial.println(updatedJson.length());
    Serial.print("WiFi credentials JSON content: ");
    Serial.println(updatedJson);
    
    // Save back to NVS
    bool success = false;
    if (prefs.begin(WIFI_NAMESPACE, false)) { // Write mode
        success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedJson);
        prefs.end();
    }
    
    // Send response
    DynamicJsonDocument responseDoc(128);
    responseDoc["action"] = "addWifiNetworkResponse";
    responseDoc["success"] = success;
    responseDoc["ssid"] = ssid;
    
    String response;
    serializeJson(responseDoc, response);
    
    client->text(response);
    
    // Log success/failure
    if (success) {
        Serial.println("WiFi credentials saved successfully from WebSocket request");
    } else {
        Serial.println("Failed to save WiFi credentials from WebSocket request");
    }
}
