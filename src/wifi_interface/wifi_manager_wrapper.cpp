#include "wifi_manager_wrapper.h"
#include <Preferences.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiManager.h>

// WiFi manager instance
WiFiManager wifiManager;

bool initWiFiManager(const char* apName) {
    // Initialize WiFi
    WiFi.mode(WIFI_STA);

    // Set custom AP name
    wifiManager.setConfigPortalTimeout(180); // 3 minutes timeout for the config portal
    
    // Add custom parameter for device name
    WiFiManagerParameter custom_device_name("deviceName", "Device Name", "XY-SK120", 40);
    wifiManager.addParameter(&custom_device_name);
    
    // Attempt to connect to WiFi using saved credentials
    if (!connectToSavedNetworks()) {
        // If all saved networks fail, start the AP
        return wifiManager.autoConnect(apName);
    }
    
    return true;
}

bool connectToSavedNetworks() {
    // Load saved WiFi credentials from NVS
    String wifiListJson = loadWiFiCredentialsFromNVS();
    
    // If no saved credentials, return false and let WiFiManager handle it
    if (wifiListJson == "[]") {
        Serial.println("No saved WiFi credentials found");
        return false;
    }
    
    // Parse the saved credentials
    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(doc, wifiListJson);
    if (error) {
        Serial.println("Failed to parse WiFi credentials JSON");
        return false;
    }
    
    // Get the networks array
    JsonArray networks = doc.as<JsonArray>();
    if (networks.size() == 0) {
        Serial.println("No networks found in saved credentials");
        return false;
    }
    
    // Sort networks by priority
    // Create a temporary vector for sorting
    struct NetworkInfo {
        String ssid;
        String password;
        int priority;
    };
    
    std::vector<NetworkInfo> sortedNetworks;
    
    for (JsonObject network : networks) {
        NetworkInfo info;
        info.ssid = network["ssid"].as<String>();
        info.password = network["password"].as<String>();
        info.priority = network["priority"] | sortedNetworks.size() + 1;
        sortedNetworks.push_back(info);
    }
    
    // Sort by priority (lower number = higher priority)
    std::sort(sortedNetworks.begin(), sortedNetworks.end(), 
        [](const NetworkInfo& a, const NetworkInfo& b) {
            return a.priority < b.priority;
        }
    );
    
    // Try to connect to each network in priority order
    for (const NetworkInfo& network : sortedNetworks) {
        Serial.print("Attempting to connect to network: ");
        Serial.print(network.ssid);
        Serial.print(" (Priority: ");
        Serial.print(network.priority);
        Serial.println(")");
        
        // Attempt to connect with a timeout
        WiFi.begin(network.ssid.c_str(), network.password.c_str());
        
        // Wait for connection (with timeout)
        int connectAttempts = 0;
        while (WiFi.status() != WL_CONNECTED && connectAttempts < 20) {
            delay(500);
            Serial.print(".");
            connectAttempts++;
        }
        
        // If connected, return success
        if (WiFi.status() == WL_CONNECTED) {
            Serial.println();
            Serial.print("Connected to ");
            Serial.println(network.ssid);
            Serial.print("IP address: ");
            Serial.println(WiFi.localIP());
            return true;
        }
        
        Serial.println();
        Serial.print("Failed to connect to ");
        Serial.println(network.ssid);
    }
    
    // If we get here, all saved networks failed
    Serial.println("All saved networks failed to connect");
    return false;
}

bool initWiFiManager(const char* apName, const char* apPassword) {
    WiFiManager wifiManager;
    
    // Set debug output to true for more information
    wifiManager.setDebugOutput(true);
    
    // Configure access point
    wifiManager.setAPStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
    
    // Set access point channel - channel 1 is often less crowded
    WiFi.setTxPower(WIFI_POWER_19_5dBm);
    
    // Extend timeout to 5 minutes to give more time for configuration
    wifiManager.setConfigPortalTimeout(300);
    
    // Lower the signal quality threshold to see more networks
    wifiManager.setMinimumSignalQuality(10);
    
    // Set a custom header to make the portal more user-friendly
    wifiManager.setCustomHeadElement("<style>body{background-color:#f8f9fa;font-family:Arial,sans-serif;}</style>");
    
    // Make the network scan refresh more frequently (every 10 seconds)
    wifiManager.setWiFiAPChannel(1);
    wifiManager.setScanDispPerc(true);
    
    // Normal connection attempt
    Serial.print("Attempting to connect to WiFi or starting AP named: ");
    Serial.println(apName);
    
    // Run the autoConnect with or without password as needed
    bool result;
    if (apPassword == NULL || strlen(apPassword) == 0) {
        result = wifiManager.autoConnect(apName);
    } else {
        result = wifiManager.autoConnect(apName, apPassword);
    }
    
    // Give network time to stabilize after connection
    if (result) {
        delay(1000);
    }
    
    return result;
}

void resetWiFiSettings() {
    WiFiManager wifiManager;
    wifiManager.resetSettings();
}

bool isWiFiConnected() {
    return WiFi.status() == WL_CONNECTED;
}

String getWiFiSSID() {
    return WiFi.SSID();
}

String getWiFiIP() {
    return WiFi.localIP().toString();
}

int getWiFiRSSI() {
    return WiFi.RSSI();
}

String getWiFiMAC() {
    return WiFi.macAddress();
}

// Legacy function that now calls the NVS version
bool saveWiFiCredentials(const String& ssid, const String& password) {
    return saveWiFiCredentialsToNVS(ssid, password);
}

// Legacy function that now calls the NVS version
String loadWiFiCredentials() {
    return loadWiFiCredentialsFromNVS();
}
