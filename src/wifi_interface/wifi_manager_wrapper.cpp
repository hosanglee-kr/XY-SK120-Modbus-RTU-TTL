#include "wifi_manager_wrapper.h"
#include <WiFi.h>
#include <WiFiManager.h>

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
