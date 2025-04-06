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

// Add a new function to handle network deletion
void handleRemoveWifiNetworkCommand(AsyncWebSocketClient* client, DynamicJsonDocument& inputDoc) {
    // Check if required parameters are provided
    if (!inputDoc.containsKey("index")) {
        sendErrorResponse(client, "Missing index parameter");
        return;
    }
    
    int index = inputDoc["index"];
    String targetSsid = inputDoc.containsKey("ssid") ? inputDoc["ssid"].as<String>() : "";
    bool singleMode = inputDoc.containsKey("deleteMode") && inputDoc["deleteMode"] == "single";
    
    Serial.print("Removing WiFi network at index ");
    Serial.print(index);
    if (targetSsid.length() > 0) {
        Serial.print(" with SSID: ");
        Serial.print(targetSsid);
    }
    if (singleMode) {
        Serial.println(" (single mode)");
    } else {
        Serial.println();
    }
    
    // Get saved networks JSON
    Preferences prefs;
    String wifiListJson;
    
    if (prefs.begin(WIFI_NAMESPACE, true)) { // Read-only mode first
        wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
    } else {
        sendErrorResponse(client, "Failed to access saved WiFi information");
        return;
    }
    
    // Parse existing JSON
    DynamicJsonDocument wifiDoc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(wifiDoc, wifiListJson);
    
    if (error) {
        sendErrorResponse(client, "Error parsing saved WiFi networks");
        return;
    }
    
    // Ensure it's an array
    if (!wifiDoc.is<JsonArray>()) {
        sendErrorResponse(client, "Saved WiFi data is not in the expected format");
        return;
    }
    
    JsonArray networks = wifiDoc.as<JsonArray>();
    
    // Validate index
    if (index < 0 || index >= networks.size()) {
        sendErrorResponse(client, "Invalid network index");
        return;
    }
    
    // If SSID is provided, verify it matches
    if (targetSsid.length() > 0) {
        String storedSsid = networks[index]["ssid"];
        if (storedSsid != targetSsid) {
            sendErrorResponse(client, "SSID mismatch for the specified index");
            return;
        }
    }
    
    // Remove the network at the specified index
    networks.remove(index);
    
    // Serialize back to string
    String updatedJson;
    serializeJson(wifiDoc, updatedJson);
    
    // Save back to NVS
    bool success = false;
    if (prefs.begin(WIFI_NAMESPACE, false)) { // Write mode
        success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedJson);
        prefs.end();
    }
    
    // Send response
    DynamicJsonDocument responseDoc(128);
    responseDoc["action"] = "removeWifiNetworkResponse";
    responseDoc["success"] = success;
    responseDoc["index"] = index;
    if (targetSsid.length() > 0) {
        responseDoc["ssid"] = targetSsid;
    }
    
    String response;
    serializeJson(responseDoc, response);
    
    client->text(response);
    
    // Log success/failure
    if (success) {
        Serial.println("WiFi network removed successfully");
    } else {
        Serial.println("Failed to remove WiFi network");
    }
}
