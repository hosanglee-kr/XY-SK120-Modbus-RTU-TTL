#include "menu_wifi.h"
#include <WiFi.h>

bool exitAPMode() {
  if (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA) {
    // Stop the AP
    bool success = WiFi.softAPdisconnect(true);
    // Set to station mode
    WiFi.mode(WIFI_STA);
    // Ensure any ongoing scans are stopped
    WiFi.scanDelete();
    delay(100);
    return success;
  }
  // Already in station mode or off
  WiFi.mode(WIFI_STA);
  return false;
}

bool connectToWiFi(const String& ssid, const String& password) {
  // Disconnect if already connected
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect();
    delay(100);
  }
  
  // Set to station mode
  WiFi.mode(WIFI_STA);
  delay(100);
  
  // Connect to WiFi network
  WiFi.begin(ssid.c_str(), password.c_str());
  
  // Wait up to 20 seconds for connection
  Serial.print("Connecting to WiFi");
  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 40) {
    delay(500);
    Serial.print(".");
    attempt++;
  }
  Serial.println();
  
  // Return true if connected
  return WiFi.status() == WL_CONNECTED;
}

bool setupWiFiAP(const String& ssid, const String& password) {
  // Disconnect if in station mode
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect();
    delay(100);
  }
  
  // Set to AP mode
  WiFi.mode(WIFI_AP);
  delay(100);
  
  // Configure and start the AP
  return WiFi.softAP(ssid.c_str(), password.c_str());
}

// Helper function to extract quoted strings from a command
bool extractQuotedParameters(const String& input, String& command, String& param1, String& param2) {
  command = "";
  param1 = "";
  param2 = "";
  
  // Extract the command part (everything before the first space)
  int firstSpace = input.indexOf(' ');
  if (firstSpace <= 0) {
    command = input;
    return false; // No parameters found
  }
  
  command = input.substring(0, firstSpace);
  
  // Look for quoted parameters
  int firstQuote = input.indexOf('"', firstSpace);
  if (firstQuote < 0) {
    // No quotes found, fall back to space-based parsing
    return false;
  }
  
  int secondQuote = input.indexOf('"', firstQuote + 1);
  if (secondQuote < 0) {
    // Incomplete quotes
    return false;
  }
  
  // Extract first parameter
  param1 = input.substring(firstQuote + 1, secondQuote);
  
  // Look for second parameter
  int thirdQuote = input.indexOf('"', secondQuote + 1);
  if (thirdQuote < 0) {
    // No second parameter
    return true;
  }
  
  int fourthQuote = input.indexOf('"', thirdQuote + 1);
  if (fourthQuote < 0) {
    // Incomplete quotes for second parameter
    return true;
  }
  
  // Extract second parameter
  param2 = input.substring(thirdQuote + 1, fourthQuote);
  return true;
}
