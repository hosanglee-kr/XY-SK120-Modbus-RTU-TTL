#include "menu_wifi.h"
#include "serial_core.h"
#include "serial_interface.h"
#include <WiFi.h>
#include <Preferences.h>
#include <ArduinoJson.h>  // Add this include for ArduinoJson functionality
#include "../wifi_interface/wifi_settings.h"

// Function declarations for functions defined in this file
void handleSaveCurrentWiFi();
void displayIPInfo();
void syncCurrentWiFi();
void handleAddWifi(const String& input, String ssid, String password, int priority);

// External declarations for functions in other files
extern bool extractQuotedParameters(const String& input, String& command, String& param1, String& param2);
extern bool exitConfigPortal();

void displayWiFiMenu() {
  Serial.println("\n==== WiFi Settings ====");
  Serial.println("scan - Scan for available WiFi networks");
  Serial.println("connect [ssid] [password] - Connect to a WiFi network");
  Serial.println("connect \"ssid with spaces\" \"password\" - Connect to a WiFi with spaces in name");
  Serial.println("disconnect - Disconnect from current WiFi network");
  Serial.println("wifistatus - Display current WiFi status");
  Serial.println("ap [ssid] [password] - Create WiFi Access Point");
  Serial.println("ap \"ssid with spaces\" \"password\" - Create AP with spaces in name");
  Serial.println("sta - Switch to WiFi Station mode");
  Serial.println("exit - Exit AP mode and switch to station mode");
  Serial.println("exitcp - Exit WiFiManager config portal");
  Serial.println("save - Save currently connected WiFi credentials with highest priority");
  Serial.println("syncwifi - Sync current WiFi connection to saved networks");
  Serial.println("addwifi [ssid] [password] [priority] - Add WiFi to saved networks without connecting");
  Serial.println("addwifi \"ssid with spaces\" \"password\" [priority] - Add WiFi with spaces");
  Serial.println("savedwifi - Display saved WiFi networks");
  Serial.println("ip - Display current IP address information");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleWiFiMenu(const String& input, XY_SKxxx* ps) {
  // First try to parse as quoted parameters
  String command, ssid, password;
  bool quoted = extractQuotedParameters(input, command, ssid, password);
  
  if (input == "scan") {
    scanWiFiNetworks();
  } else if (input.startsWith("connect ")) {
    if (quoted && command == "connect") {
      // Handle quoted parameters
      if (ssid.isEmpty()) {
        Serial.println("Invalid format. Use: connect \"ssid\" \"password\"");
        return;
      }
      
      Serial.print("Connecting to WiFi network: ");
      Serial.println(ssid);
      
      if (connectToWiFi(ssid, password)) {
        Serial.println("Successfully connected to WiFi!");
        displayWiFiStatus();
      } else {
        Serial.println("Failed to connect to WiFi. Please check credentials and try again.");
      }
    } else {
      // Legacy space-based parsing
      int firstSpace = input.indexOf(' ');
      int secondSpace = input.indexOf(' ', firstSpace + 1);
      
      if (secondSpace > 0) {
        String ssid = input.substring(firstSpace + 1, secondSpace);
        String password = input.substring(secondSpace + 1);
        
        ssid.trim();
        password.trim();
        
        Serial.print("Connecting to WiFi network: ");
        Serial.println(ssid);
        
        if (connectToWiFi(ssid, password)) {
          Serial.println("Successfully connected to WiFi!");
          displayWiFiStatus();
        } else {
          Serial.println("Failed to connect to WiFi. Please check credentials and try again.");
        }
      } else {
        Serial.println("Invalid format. Use: connect [ssid] [password] or connect \"ssid with spaces\" \"password\"");
      }
    }
  } else if (input == "disconnect") {
    WiFi.disconnect();
    Serial.println("Disconnected from WiFi");
  } else if (input == "wifistatus") {
    displayWiFiStatus();
  } else if (input.startsWith("ap ")) {
    // ... similar code pattern for AP setup with quoted or space-based parameters
    if (quoted && command == "ap") {
      // Handle quoted parameters
      if (ssid.isEmpty()) {
        Serial.println("Invalid format. Use: ap \"ssid\" \"password\"");
        return;
      }
      
      if (password.length() < 8) {
        Serial.println("Password must be at least 8 characters long for AP mode");
        return;
      }
      
      Serial.print("Setting up WiFi Access Point: ");
      Serial.println(ssid);
      
      if (setupWiFiAP(ssid, password)) {
        Serial.println("WiFi Access Point created successfully!");
        displayWiFiStatus();
      } else {
        Serial.println("Failed to create WiFi Access Point");
      }
    } else {
      // Legacy space-based parsing for AP setup
      int firstSpace = input.indexOf(' ');
      int secondSpace = input.indexOf(' ', firstSpace + 1);
      
      if (secondSpace > 0) {
        String ssid = input.substring(firstSpace + 1, secondSpace);
        String password = input.substring(secondSpace + 1);
        
        ssid.trim();
        password.trim();
        
        if (password.length() < 8) {
          Serial.println("Password must be at least 8 characters long for AP mode");
          return;
        }
        
        Serial.print("Setting up WiFi Access Point: ");
        Serial.println(ssid);
        
        if (setupWiFiAP(ssid, password)) {
          Serial.println("WiFi Access Point created successfully!");
          displayWiFiStatus();
        } else {
          Serial.println("Failed to create WiFi Access Point");
        }
      } else {
        Serial.println("Invalid format. Use: ap [ssid] [password] or ap \"ssid with spaces\" \"password\"");
      }
    }
  } else if (input.startsWith("addwifi ")) {
    // New command to add WiFi without connecting
    if (quoted && command == "addwifi") {
      // Handle quoted parameters
      if (ssid.isEmpty()) {
        Serial.println("Invalid format. Use: addwifi \"ssid\" \"password\" [priority]");
        return;
      }
      
      // Check for priority (optional parameter)
      int priority = 1; // Default priority
      
      // Extract priority if present - it would be after the second quote
      int lastSpace = input.lastIndexOf(' ');
      int lastQuote = input.lastIndexOf('"');
      
      if (lastSpace > lastQuote) {
        // There's text after the last quote, likely the priority
        String priorityStr = input.substring(lastSpace + 1);
        priorityStr.trim();
        
        if (priorityStr.length() > 0 && isDigit(priorityStr.charAt(0))) {
          priority = priorityStr.toInt();
        }
      }
      
      // Use the common handler
      handleAddWifi(input, ssid, password, priority);
    } else {
      // Legacy space-based parsing
      int firstSpace = input.indexOf(' ');
      int secondSpace = input.indexOf(' ', firstSpace + 1);
      
      if (secondSpace <= 0) {
        Serial.println("Invalid format. Use: addwifi [ssid] [password] [priority]");
        return;
      }
      
      String ssid = input.substring(firstSpace + 1, secondSpace);
      String password = "";
      int priority = 1; // Default priority
      
      // Check if there's a third parameter (priority)
      int thirdSpace = input.indexOf(' ', secondSpace + 1);
      
      if (thirdSpace > 0) {
        // We have all three parameters: ssid, password, priority
        password = input.substring(secondSpace + 1, thirdSpace);
        String priorityStr = input.substring(thirdSpace + 1);
        priorityStr.trim();
        
        if (priorityStr.length() > 0 && isDigit(priorityStr.charAt(0))) {
          priority = priorityStr.toInt();
        }
      } else {
        // Just ssid and password
        password = input.substring(secondSpace + 1);
      }
      
      ssid.trim();
      password.trim();
      
      // Use the common handler
      handleAddWifi(input, ssid, password, priority);
    }
  } else if (input == "sta" || input == "exit") {
    if (exitAPMode()) {
      Serial.println("Exited AP mode and switched to station mode");
    } else {
      Serial.println("Switched to WiFi Station mode");
    }
  } else if (input == "exitcp") {
    // Call our properly implemented exit function
    Serial.println("Attempting to exit WiFiManager config portal...");
    
    if (exitConfigPortal()) {
      Serial.println("Config portal stopped. WiFi credentials saved if entered.");
    } else {
      Serial.println("Failed to stop config portal. You may need to reset the device.");
    }
  } else if (input == "syncwifi") {
    syncCurrentWiFi();
  } else if (input == "save") {
    handleSaveCurrentWiFi();
  } else if (input == "savedwifi") {
    displaySavedWiFiNetworks();
  } else if (input == "ip") {
    displayIPInfo();
  } else if (input == "help") {
    displayWiFiMenu();
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

// Helper function to handle saving current WiFi
void handleSaveCurrentWiFi() {
  // Check if connected to WiFi
  if (WiFi.status() == WL_CONNECTED) {
    String currentSSID = WiFi.SSID();
    
    Serial.print("Currently connected to: ");
    Serial.println(currentSSID);
    Serial.println("Saving this network to saved networks...");
    
    // Ask for password
    Serial.println("Current password cannot be retrieved from the ESP32.");
    Serial.println("Please enter the password for this network: ");
    
    // Wait for user to input password
    String userPassword = "";
    unsigned long startTime = millis();
    while ((millis() - startTime) < 30000) { // 30 second timeout
      if (Serial.available()) {
        userPassword = Serial.readStringUntil('\n');
        userPassword.trim();
        break;
      }
      delay(100);
    }
    
    if (userPassword.length() == 0) {
      Serial.println("No password entered or timeout occurred. Aborting save operation.");
      return;
    }
    
    // Save to NVS with highest priority (1)
    if (saveWiFiCredentialsToNVS(currentSSID, userPassword, 1)) {
      Serial.println("WiFi credentials saved successfully!");
      Serial.println("Network will be used with priority 1 (highest) for future connections.");
    } else {
      Serial.println("Failed to save WiFi credentials.");
    }
  } else {
    Serial.println("Not connected to any WiFi network. Cannot save.");
  }
}

// Display IP information
void displayIPInfo() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Subnet Mask: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("DNS: ");
    Serial.println(WiFi.dnsIP());
  } else if (WiFi.getMode() == WIFI_AP) {
    Serial.print("AP IP Address: ");
    Serial.println(WiFi.softAPIP());
  } else {
    Serial.println("Not connected to WiFi or AP mode not active");
  }
}

// Enhanced syncCurrentWiFi function
void syncCurrentWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    String currentSSID = WiFi.SSID();
    
    Serial.print("Force syncing current WiFi (");
    Serial.print(currentSSID);
    Serial.println(") to saved networks...");
    
    // Get password from user
    Serial.println("Please enter the password for this network:");
    String password = "";
    unsigned long startTime = millis();
    while ((millis() - startTime) < 30000) { // 30 second timeout
      if (Serial.available()) {
        password = Serial.readStringUntil('\n');
        password.trim();
        break;
      }
      delay(100);
    }
    
    if (password.isEmpty()) {
      Serial.println("No password entered, aborting sync.");
      return;
    }
    
    // First, check if we have valid JSON in WiFi credentials
    Preferences prefs;
    bool needsReset = false;
    
    if (prefs.begin(WIFI_NAMESPACE, true)) {
      String existingJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
      prefs.end();
      
      // Test if it's valid JSON
      DynamicJsonDocument testDoc(WIFI_CREDENTIALS_JSON_SIZE);
      DeserializationError error = deserializeJson(testDoc, existingJson);
      
      if (error) {
        Serial.println("Found invalid JSON in saved WiFi credentials. Resetting.");
        needsReset = true;
      }
    }
    
    // If JSON is invalid, reset it
    if (needsReset) {
      if (prefs.begin(WIFI_NAMESPACE, false)) {
        prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
        Serial.println("Reset WiFi credentials storage to empty array.");
      }
    }
    
    // Now explicitly create the proper JSON structure and save
    String wifiListJson = loadWiFiCredentialsFromNVS();
    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    
    if (wifiListJson == "[]") {
      // Create a new array
      JsonArray networks = doc.to<JsonArray>();
      
      // Add the network with priority 1
      JsonObject network = networks.createNestedObject();
      network["ssid"] = currentSSID;
      network["password"] = password;
      network["priority"] = 1;
    } else {
      // Parse existing JSON
      DeserializationError error = deserializeJson(doc, wifiListJson);
      if (!error) {
        // Get networks array
        JsonArray networks = doc.as<JsonArray>();
        
        // Check if this network already exists
        bool networkExists = false;
        for (JsonObject network : networks) {
          String savedSSID = network["ssid"].as<String>();
          if (savedSSID == currentSSID) {
            // Update the password and priority
            network["password"] = password;
            network["priority"] = 1;
            networkExists = true;
            break;
          }
        }
        
        // If network doesn't exist, add it with priority 1
        if (!networkExists) {
          // First increment all priorities
          for (JsonObject network : networks) {
            int priority = network["priority"];
            network["priority"] = priority + 1;
          }
          
          // Add the new network
          JsonObject network = networks.createNestedObject();
          network["ssid"] = currentSSID;
          network["password"] = password;
          network["priority"] = 1;
        }
      }
    }
    
    // Serialize and save
    String jsonOutput;
    serializeJson(doc, jsonOutput);
    
    // Log the JSON for debugging
    Serial.print("New JSON to save: ");
    Serial.println(jsonOutput);
    
    // Save to NVS
    if (prefs.begin(WIFI_NAMESPACE, false)) {
      bool success = prefs.putString(WIFI_CREDENTIALS_KEY, jsonOutput);
      prefs.end();
      
      if (success) {
        Serial.println("Successfully saved WiFi to NVS with proper format!");
      } else {
        Serial.println("Failed to save WiFi credentials. Check NVS storage.");
      }
    }
    
    // Verify save
    if (prefs.begin(WIFI_NAMESPACE, true)) {
      String jsonAfter = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
      prefs.end();
      
      Serial.println("Current saved WiFi data: " + jsonAfter);
    }
  } else {
    Serial.println("Not connected to WiFi. Cannot sync.");
  }
}

// New command to add WiFi without connecting
void handleAddWifi(const String& input, String ssid, String password, int priority) {
  Serial.print("Adding WiFi network to saved list: ");
  Serial.print(ssid);
  Serial.print(" with priority: ");
  Serial.println(priority);
  
  // Get saved networks JSON
  Preferences prefs;
  String wifiListJson;
  
  if (prefs.begin(WIFI_NAMESPACE, true)) { // Read-only mode first
    wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();
  } else {
    Serial.println("Failed to access saved WiFi information.");
    return;
  }
  
  // Parse existing JSON
  DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
  DeserializationError error = deserializeJson(doc, wifiListJson);
  
  if (error) {
    Serial.println("Error parsing saved WiFi networks. Creating new list.");
    doc.clear();
    doc = JsonArray(); // Ensure it's initialized as an array
  }
  
  // Check if this network already exists
  JsonArray networks = doc.as<JsonArray>();
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
  serializeJson(doc, updatedJson);
  
  // Debug output
  Serial.print("WiFi credentials JSON size: ");
  Serial.println(updatedJson.length());
  Serial.print("WiFi credentials JSON content: ");
  Serial.println(updatedJson);
  
  // Save back to NVS
  if (prefs.begin(WIFI_NAMESPACE, false)) { // Write mode
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedJson);
    prefs.end();
    
    if (success) {
      Serial.println("WiFi credentials saved successfully!");
      Serial.println("Network will be automatically tried when in range.");
    } else {
      Serial.println("Failed to save WiFi credentials.");
    }
  } else {
    Serial.println("Failed to access WiFi storage for writing.");
  }
}
