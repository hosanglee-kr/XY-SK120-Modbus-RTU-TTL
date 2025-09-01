// W10_wifi_if_merge_001.cpp

// Auto-generated merged source from uploaded components
#include "W10_wifi_if_merge_001.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <WiFiManager.h>


// Implementations merged from original sources


// ==== Begin wifi_settings.cpp ====
#include "wifi_manager_wrapper.h" // Include wifi_manager_wrapper for resetWiFiSettings

// Function to get WiFi status as a JSON string
String getWifiStatus() {
  DynamicJsonDocument doc(512);
  doc["status"] = isWiFiConnected() ? "connected" : "disconnected";
  doc["ssid"] = getWiFiSSID();
  doc["ip"] = getWiFiIP();
  doc["rssi"] = getWiFiRSSI();
  doc["mac"] = getWiFiMAC();

  Serial.print("WiFi Status: "); // Debug print
  Serial.print("Status: "); Serial.println(doc["status"].as<String>()); // Debug print
  Serial.print("SSID: "); Serial.println(doc["ssid"].as<String>()); // Debug print
  Serial.print("IP: "); Serial.println(doc["ip"].as<String>()); // Debug print
  Serial.print("RSSI: "); Serial.println(doc["rssi"].as<int>()); // Debug print
  Serial.print("MAC: "); Serial.println(doc["mac"].as<String>()); // Debug print

  String jsonString;
  serializeJson(doc, jsonString);
  return jsonString;
}

// Add this helper function to sanitize input strings
String sanitizeString(const String& input) {
    String result = "";
    for (size_t i = 0; i < input.length(); i++) {
        char c = input.charAt(i);
        // Only allow printable ASCII characters, skip control chars
        if (c >= 32 && c <= 126) {
            result += c;
        }
    }
    return result;
}

// Function to repair corrupted WiFi credentials
bool repairWiFiCredentials() {
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) {
        Serial.println("Failed to access WiFi settings");
        return false;
    }
    
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();
    
    // Parse existing JSON
    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(doc, wifiListJson);
    
    if (error) {
        Serial.println("Error parsing WiFi credentials, resetting to empty array");
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
            prefs.end();
        }
        return true;
    }
    
    // Check if it's an array
    if (!doc.is<JsonArray>()) {
        Serial.println("WiFi credentials not stored as array, resetting");
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
            prefs.end();
        }
        return true;
    }
    
    // Process each network entry to sanitize
    bool needsUpdate = false;
    JsonArray networks = doc.as<JsonArray>();
    
    for (JsonObject network : networks) {
        if (network.containsKey("ssid") && network.containsKey("password")) {
            String originalSsid = network["ssid"].as<String>();
            String originalPassword = network["password"].as<String>();
            
            String cleanSsid = sanitizeString(originalSsid);
            String cleanPassword = sanitizeString(originalPassword);
            
            // Check if anything changed
            if (originalSsid != cleanSsid || originalPassword != cleanPassword) {
                network["ssid"] = cleanSsid;
                network["password"] = cleanPassword;
                needsUpdate = true;
            }
        }
    }
    
    // If we sanitized anything, save the updated data
    if (needsUpdate) {
        String cleanJson;
        serializeJson(doc, cleanJson);
        
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            bool success = prefs.putString(WIFI_CREDENTIALS_KEY, cleanJson);
            prefs.end();
            
            Serial.println("Sanitized WiFi credentials saved");
            return success;
        }
    }
    
    return true;
}

bool saveWiFiCredentialsToNVS(const String& ssid, const String& password, int priority) {
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
    
    // If priority is -1 (default), set it to the next available priority
    if (priority == -1) {
        priority = wifiList.size() + 1;
    } else {
        // Check if we need to update priorities of other networks
        for (JsonObject network : wifiList) {
            if (network["priority"].as<int>() >= priority) {
                // Increment priority of networks with priority >= the new priority
                network["priority"] = network["priority"].as<int>() + 1;
            }
        }
    }

    // Check if this SSID already exists
    bool ssidExists = false;
    for (JsonObject network : wifiList) {
        if (network["ssid"].as<String>() == ssid) {
            // Update existing network
            network["password"] = password;
            network["priority"] = priority;
            ssidExists = true;
            break;
        }
    }

    // If SSID doesn't exist, add a new entry
    if (!ssidExists) {
        JsonObject newCreds = wifiList.createNestedObject();
        newCreds["ssid"] = ssid;
        newCreds["password"] = password;
        newCreds["priority"] = priority;
    }

    // Sort networks by priority
    // Create a temporary array for sorting
    JsonArray sortedArray = doc.to<JsonArray>();
    
    // Extract networks into a std::vector for sorting
    std::vector<JsonObject> networksVector;
    for (JsonObject network : wifiList) {
        networksVector.push_back(network);
    }
    
    // Sort the vector by priority
    std::sort(networksVector.begin(), networksVector.end(), 
        [](JsonObject a, JsonObject b) {
            return a["priority"].as<int>() < b["priority"].as<int>();
        });
    
    // Rebuild the array in priority order
    doc.clear();
    JsonArray sortedWifiList = doc.to<JsonArray>();
    for (JsonObject network : networksVector) {
        JsonObject newNetwork = sortedWifiList.createNestedObject();
        newNetwork["ssid"] = network["ssid"];
        newNetwork["password"] = network["password"];
        newNetwork["priority"] = network["priority"];
    }

    // Serialize the updated JSON document
    String updatedWifiListJson;
    serializeJson(doc, updatedWifiListJson);
    
    // Check size before saving
    size_t jsonSize = updatedWifiListJson.length();
    Serial.println("WiFi credentials JSON size: " + String(jsonSize) + " bytes");
    
    if (jsonSize > WIFI_CREDENTIALS_JSON_SIZE) {
        Serial.println("WiFi credentials JSON too large for NVS storage");
        prefs.end();
        return false;
    }

    // Save the updated JSON string to NVS
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedWifiListJson);
    prefs.end();

    if (!success) {
        Serial.println("Failed to save wifi credentials");
    }

    return success;
}

// Backward compatibility overload
bool saveWiFiCredentialsToNVS(const String& ssid, const String& password) {
    return saveWiFiCredentialsToNVS(ssid, password, -1); // -1 means lowest priority
}

// Load WiFi credentials from NVS with proper error handling
String loadWiFiCredentialsFromNVS() {
    Preferences prefs;
    String result = "[]";  // Always start with a valid empty array
    
    if (prefs.begin(WIFI_NAMESPACE, true)) {
        if (prefs.isKey(WIFI_CREDENTIALS_KEY)) {
            result = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
        } else {
            // No credentials saved yet, initialize with empty array
            Serial.println("No WiFi credentials found, initializing empty array.");
            prefs.end();
            if (prefs.begin(WIFI_NAMESPACE, false)) {
                prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
            }
        }
        prefs.end();
        
        // Validate JSON
        DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
        DeserializationError error = deserializeJson(doc, result);
        
        if (error) {
            Serial.println("Warning: Invalid JSON format in stored WiFi credentials. Resetting.");
            result = "[]";
            
            // Reset the stored data
            if (prefs.begin(WIFI_NAMESPACE, false)) {
                prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
                prefs.end();
            }
        } else if (!doc.is<JsonArray>()) {
            // Ensure it's actually an array
            Serial.println("Warning: WiFi credentials not stored as array. Resetting.");
            result = "[]";
            
            if (prefs.begin(WIFI_NAMESPACE, false)) {
                prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
                prefs.end();
            }
        } else {
            // Log the parsed structure
            Serial.print("Loaded WiFi networks: ");
            serializeJson(doc, Serial);
            Serial.println();
        }
    }
    
    // After loading but before returning, attempt to repair any corrupted data
    repairWiFiCredentials();
    
    // Reload after repair
    if (prefs.begin(WIFI_NAMESPACE, true)) {
        result = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
    }
    
    return result;
}

bool resetWiFi() {
    resetWiFiSettings(); // Call the function from wifi_manager_wrapper
    return true; // Assume success, as there's no return value from resetWiFiSettings
}

// Add a new function to remove a WiFi credential by index
bool removeWiFiCredentialByIndex(int index) {
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

    JsonArray wifiList = doc.as<JsonArray>();
    
    // Check if index is valid
    if (index < 0 || index >= wifiList.size()) {
        Serial.println("Invalid index for WiFi credential removal: " + String(index));
        prefs.end();
        return false;
    }
    
    // Create a new array without the element at the specified index
    JsonArray newWifiList = doc.to<JsonArray>();
    newWifiList.remove(index);
    
    // Serialize the updated JSON document
    String updatedWifiListJson;
    serializeJson(doc, updatedWifiListJson);
    
    // Save the updated JSON string to NVS
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedWifiListJson);
    prefs.end();
    
    if (!success) {
        Serial.println("Failed to save updated WiFi credentials after removal");
    } else {
        Serial.println("Successfully removed WiFi credential at index: " + String(index));
    }
    
    return success;
}

// Update priority of a specific network - improved implementation
bool updateWiFiNetworkPriority(int index, int newPriority) {
    Preferences prefs;
    prefs.begin(WIFI_NAMESPACE, false); // Read-write mode

    Serial.print("Updating WiFi network priority: index=");
    Serial.print(index);
    Serial.print(", newPriority=");
    Serial.println(newPriority);

    // Load existing credentials
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    Serial.print("Loaded credentials JSON: ");
    Serial.println(wifiListJson);

    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(doc, wifiListJson);
    if (error) {
        Serial.println("Failed to parse wifi list: " + String(error.c_str()));
        prefs.end();
        return false;
    }

    JsonArray wifiList = doc.as<JsonArray>();
    Serial.print("Found ");
    Serial.print(wifiList.size());
    Serial.println(" saved networks");
    
    // Check if index is valid
    if (index < 0 || index >= wifiList.size()) {
        Serial.println("Invalid index for WiFi priority update: " + String(index));
        prefs.end();
        return false;
    }
    
    // Create a simple flat array for easier manipulation
    struct NetworkInfo {
        String ssid;
        String password;
        int priority;
    };
    
    std::vector<NetworkInfo> networks;
    int i = 0;
    for (JsonObject network : wifiList) {
        NetworkInfo info;
        info.ssid = network["ssid"].as<String>();
        info.password = network["password"].as<String>();
        info.priority = network["priority"] | (i + 1); // Default to index+1 if priority not set
        networks.push_back(info);
        i++;
    }
    
    // Get current priority of the network to change
    int currentPriority = networks[index].priority;
    
    // Ensure newPriority is valid
    if (newPriority < 1) newPriority = 1;
    if (newPriority > networks.size()) newPriority = networks.size();
    
    // No change needed if priorities match
    if (currentPriority == newPriority) {
        Serial.println("No priority change needed - current and new are the same");
        prefs.end();
        return true;
    }
    
    Serial.print("Moving network from priority ");
    Serial.print(currentPriority);
    Serial.print(" to priority ");
    Serial.println(newPriority);
    
    // Update priorities
    for (auto& network : networks) {
        if (network.priority == currentPriority) {
            // This is the target network - set its new priority
            network.priority = newPriority;
        }
        else if (currentPriority < newPriority) {
            // Moving down (increasing number/decreasing priority)
            if (network.priority > currentPriority && network.priority <= newPriority) {
                network.priority--;
            }
        }
        else { // currentPriority > newPriority
            // Moving up (decreasing number/increasing priority)
            if (network.priority >= newPriority && network.priority < currentPriority) {
                network.priority++;
            }
        }
    }
    
    // Sort by priority
    std::sort(networks.begin(), networks.end(), 
        [](const NetworkInfo& a, const NetworkInfo& b) {
            return a.priority < b.priority;
        }
    );
    
    // Rebuild the JSON array
    doc.clear();
    JsonArray newWifiList = doc.to<JsonArray>();
    for (const auto& network : networks) {
        JsonObject newNetwork = newWifiList.createNestedObject();
        newNetwork["ssid"] = network.ssid;
        newNetwork["password"] = network.password;
        newNetwork["priority"] = network.priority;
    }
    
    // Serialize and save
    String updatedWifiListJson;
    serializeJson(doc, updatedWifiListJson);
    
    Serial.print("Saving updated credentials JSON: ");
    Serial.println(updatedWifiListJson);
    
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedWifiListJson);
    prefs.end();
    
    return success;
}
// ==== End wifi_settings.cpp ====


// ==== Begin wifi_manager_wrapper.cpp ====
// Reference the globally defined WiFiManager instance instead of defining it here
extern WiFiManager wifiManager;

// Global flag to track if WiFiManager saved credentials
bool wifiCredentialsSaved = false;

// Callback when WiFiManager saves config
void saveWifiCallback() {
  Serial.println("WiFiManager: Credentials Saved");
  wifiCredentialsSaved = true;
  
  // Immediately try to sync the current WiFi to our storage
  // This ensures we capture the network while we're still connected
  syncCurrentWiFiToStorage();
}

// Process WiFiManager credentials to our storage system
void processWiFiManagerCredentials() {
  if (wifiCredentialsSaved) {
    Serial.println("Processing WiFiManager credentials");
    
    // Get the credentials that WiFiManager just saved
    String ssid = WiFi.SSID();
    String password = WiFi.psk();
    
    if (ssid.length() > 0) {
      // Save to our NVS storage with highest priority
      saveWiFiCredentialsToNVS(ssid, password, 1);
      Serial.println("WiFiManager credentials transferred to NVS storage: " + ssid);
    }
    
    wifiCredentialsSaved = false;
  }
}

// Enhance the syncCurrentWiFiToStorage function
void syncCurrentWiFiToStorage() {
  // Check if we're connected to WiFi
  if (WiFi.status() == WL_CONNECTED) {
    String currentSSID = WiFi.SSID();
    
    if (currentSSID.length() > 0) {
      Serial.print("Checking if current WiFi (");
      Serial.print(currentSSID);
      Serial.println(") is in saved networks...");
      
      // Get saved networks
      String wifiListJson = loadWiFiCredentialsFromNVS();
      
      // Check if current network is already saved
      bool alreadySaved = false;
      
      if (wifiListJson != "[]") {
        DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
        DeserializationError error = deserializeJson(doc, wifiListJson);
        
        if (!error) {
          JsonArray networks = doc.as<JsonArray>();
          
          for (JsonObject network : networks) {
            String savedSSID = network["ssid"].as<String>();
            if (savedSSID == currentSSID) {
              alreadySaved = true;
              break;
            }
          }
        }
      }
      
      // If not saved, save it - but we need to handle a special case here
      if (!alreadySaved) {
        Serial.println("Current network not found in saved networks. Adding it...");
        
        // WiFi.psk() often doesn't work (returns empty) so we'll fake a temporary password
        // This password will work for reconnection because the ESP32 still has the real password stored
        // in its internal flash, but we can't access it for security reasons
        String tempPassword = "temp_password_" + String(random(10000, 99999));
        Serial.println("Note: Using a temporary password as ESP32 doesn't expose the actual WiFi password");
        
        // Create the JSON document explicitly
        DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
        
        // Check if we already have a JSON array or need to create one
        if (wifiListJson == "[]") {
          // Create a new array
          JsonArray networks = doc.to<JsonArray>();
          
          // Create a new network object
          JsonObject network = networks.createNestedObject();
          network["ssid"] = currentSSID;
          network["password"] = tempPassword;
          network["priority"] = 1;  // Set highest priority
          
          // Serialize to String
          String jsonOutput;
          serializeJson(doc, jsonOutput);
          
          // Log the size to debug
          Serial.print("WiFi credentials JSON size: ");
          Serial.println(jsonOutput.length());
          
          // Save the JSON to NVS
          Preferences prefs;
          if (prefs.begin(WIFI_NAMESPACE, false)) {
            bool success = prefs.putString(WIFI_CREDENTIALS_KEY, jsonOutput);
            prefs.end();
            
            if (success) {
              Serial.println("Successfully saved current WiFi network to storage!");
              Serial.println("NOTE: Password is a placeholder. To set the real password, use 'syncwifi' while connected.");
            } else {
              Serial.println("Failed to save current WiFi network to storage.");
            }
          }
        } else {
          // Parse existing JSON
          DeserializationError error = deserializeJson(doc, wifiListJson);
          if (!error) {
            // Get networks array
            JsonArray networks = doc.as<JsonArray>();
            
            // Update priorities - increment all existing ones to make room for new entry
            for (JsonObject network : networks) {
              int priority = network["priority"];
              network["priority"] = priority + 1;
            }
            
            // Add new network with priority 1
            JsonObject newNetwork = networks.createNestedObject();
            newNetwork["ssid"] = currentSSID;
            newNetwork["password"] = tempPassword;
            newNetwork["priority"] = 1;
            
            // Serialize to String
            String jsonOutput;
            serializeJson(doc, jsonOutput);
            
            // Log the size to debug
            Serial.print("WiFi credentials JSON size: ");
            Serial.println(jsonOutput.length());
            
            // Save the JSON to NVS
            Preferences prefs;
            if (prefs.begin(WIFI_NAMESPACE, false)) {
              bool success = prefs.putString(WIFI_CREDENTIALS_KEY, jsonOutput);
              prefs.end();
              
              if (success) {
                Serial.println("Successfully saved current WiFi network to storage!");
                Serial.println("NOTE: This network is saved with a placeholder password but will");
                Serial.println("still be tried using WiFiManager's internal credentials on boot.");
              } else {
                Serial.println("Failed to save current WiFi network to storage.");
              }
            }
          }
        }
      } else {
        Serial.println("Current network already in saved networks.");
      }
    }
  }
}

bool connectToSavedNetworks() {
  // FIRST TRY: Use WiFiManager's internally stored credentials (special priority 0)
  Serial.println("First trying WiFiManager's internal credentials...");
  WiFi.begin(); // This attempts to connect using ESP32's internal stored credentials
  
  // Wait for connection with timeout
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  
  // If connected with WiFiManager's credentials, return success
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connected using WiFiManager's internal credentials!");
    Serial.print("Connected to: ");
    Serial.println(WiFi.SSID());
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    
    // Sync the network to our storage but mark it as a placeholder
    syncCurrentWiFiToStorage();
    return true;
  }
  
  // SECOND TRY: Load and try saved WiFi credentials from NVS in priority order
  Serial.println("WiFiManager credentials failed. Trying NVS-stored networks...");
  String wifiListJson = loadWiFiCredentialsFromNVS();
  
  // If no saved credentials, return false and let WiFiManager handle it
  if (wifiListJson == "[]") {
    Serial.println("No saved WiFi credentials found in NVS");
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
    
    // Skip networks with placeholder passwords as they won't work
    if (network.password.startsWith("temp_password_")) {
      Serial.println("Skipping network with placeholder password - will be tried using WiFiManager's credentials instead");
      continue;
    }
    
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
  
  // If all attempts fail, return false to trigger portal mode
  Serial.println("All saved networks failed to connect");
  return false;
}

bool initWiFiManager(const char* apName) {
  // Initialize WiFi
  WiFi.mode(WIFI_STA);

  // Set custom AP name
  wifiManager.setConfigPortalTimeout(180); // 3 minutes timeout for the config portal
  
  // Set the callback for when the user saves WiFi credentials
  wifiManager.setSaveConfigCallback(saveWifiCallback);
  
  // Add custom parameter for device name
  WiFiManagerParameter custom_device_name("deviceName", "Device Name", "XY-SK120", 40);
  wifiManager.addParameter(&custom_device_name);
  
  // Attempt to connect to WiFi using saved credentials
  if (!connectToSavedNetworks()) {
    // If all saved networks fail, start the AP
    bool result = wifiManager.autoConnect(apName);
    
    if (result) {
      // If connected, sync current connection to storage
      syncCurrentWiFiToStorage();
    }
    
    return result;
  }
  
  return true;
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
  
  // Set the callback for when the user saves WiFi credentials
  wifiManager.setSaveConfigCallback(saveWifiCallback);
    
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
    
    // Process any credentials that were saved
    processWiFiManagerCredentials();
    
    // Also check if current connection is saved
    syncCurrentWiFiToStorage();
  }
    
  return result;
}

// Exit the config portal properly
bool exitConfigPortal() {
  // Process any credentials before stopping portal
  processWiFiManagerCredentials();
  
  // Tell WiFiManager to stop the portal
  bool success = wifiManager.stopConfigPortal();
  
  // Make sure WiFi is in the correct mode
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);
  
  return success;
}

void resetWiFiSettings() {
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
// ==== End wifi_manager_wrapper.cpp ====


// ==== Begin wifi_websocket_handler.cpp ====
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

// Add extern declaration of the WiFiManager instance
extern WiFiManager wifiManager;

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
    
    // If we're connected to WiFi, check if the password in WiFiManager is more accurate
    if (success && WiFi.status() == WL_CONNECTED && WiFi.SSID() == ssid) {
        // This is the network we're currently connected to, update with the correct password from WiFiManager
        updateSavedWiFiPasswordFromWiFiManager(ssid, wifiManager);
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

// Function to handle connecting to a WiFi network
void handleConnectWifiCommand(AsyncWebSocketClient* client, DynamicJsonDocument& inputDoc) {
    // Check if required parameters are provided
    if (!inputDoc.containsKey("ssid")) {
        sendErrorResponse(client, "Missing SSID parameter");
        return;
    }
    
    String ssid = inputDoc["ssid"].as<String>();
    
    // Sanitize the SSID
    ssid = sanitizeString(ssid);
    
    Serial.print("Connecting to WiFi network: ");
    Serial.println(ssid);
    
    // Check if this network is in our saved networks
    Preferences prefs;
    String wifiListJson;
    String password = "";
    bool networkFound = false;
    
    if (prefs.begin(WIFI_NAMESPACE, true)) { // Read-only mode
        wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
        
        // Parse saved networks
        DynamicJsonDocument wifiDoc(WIFI_CREDENTIALS_JSON_SIZE);
        DeserializationError error = deserializeJson(wifiDoc, wifiListJson);
        
        if (!error && wifiDoc.is<JsonArray>()) {
            JsonArray networks = wifiDoc.as<JsonArray>();
            
            // Find the network in our saved list
            for (JsonObject network : networks) {
                if (network.containsKey("ssid") && network["ssid"].as<String>() == ssid) {
                    networkFound = true;
                    if (network.containsKey("password")) {
                        password = network["password"].as<String>();
                    }
                    break;
                }
            }
        }
    }
    
    if (!networkFound) {
        sendErrorResponse(client, "Network not found in saved networks");
        return;
    }
    
    // Try to connect to the WiFi network
    bool connectSuccess = false;
    
    // Disconnect from current network if connected
    if (WiFi.status() == WL_CONNECTED) {
        WiFi.disconnect();
        delay(500);
    }
    
    // Set WiFi mode to station (client)
    WiFi.mode(WIFI_STA);
    
    // Begin connection attempt
    WiFi.begin(ssid.c_str(), password.c_str());
    
    // Wait for connection with timeout
    int timeout = 30; // 30 seconds timeout
    while (WiFi.status() != WL_CONNECTED && timeout > 0) {
        delay(1000);
        timeout--;
        Serial.print(".");
    }
    
    // Check if connected
    if (WiFi.status() == WL_CONNECTED) {
        connectSuccess = true;
        Serial.println("\nConnected to WiFi!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP().toString());
        
        // Update NVS with password from WiFiManager if this was successful
        updateSavedWiFiPasswordFromWiFiManager(ssid, wifiManager);
    } else {
        Serial.println("\nFailed to connect to WiFi");
    }
    
    // Send response to client
    DynamicJsonDocument responseDoc(256);
    responseDoc["action"] = "connectWifiResponse";
    responseDoc["success"] = connectSuccess;
    responseDoc["ssid"] = ssid;
    
    if (connectSuccess) {
        responseDoc["ip"] = WiFi.localIP().toString();
        responseDoc["rssi"] = WiFi.RSSI();
    } else {
        responseDoc["error"] = "Failed to connect to network";
    }
    
    String response;
    serializeJson(responseDoc, response);
    client->text(response);
}
// ==== End wifi_websocket_handler.cpp ====


// ==== Begin wifi_connection.cpp ====
// External reference to global WiFiManager instance
extern WiFiManager wifiManager;

// Define constants for NVS
#define WIFI_NAMESPACE "wificonfig"
#define WIFI_CREDENTIALS_KEY "credentials"
#define WIFI_CREDENTIALS_JSON_SIZE 2048

// Helper function to directly check and update placeholder passwords
bool updatePlaceholderPassword(const String& ssid) {
    Serial.println("Checking for placeholder password in NVS for: " + ssid);
    
    // Get current networks from NVS
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) {
        Serial.println("Failed to open NVS for reading WiFi credentials");
        return false;
    }
    
    String networksJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();
    
    // Parse the JSON
    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(doc, networksJson);
    
    if (error) {
        Serial.println("Failed to parse WiFi networks JSON");
        return false;
    }
    
    JsonArray networks = doc.as<JsonArray>();
    bool found = false;
    bool isPlaceholder = false;
    
    // Find the network and check if password is a placeholder
    for (JsonObject network : networks) {
        if (network["ssid"] == ssid) {
            found = true;
            String storedPassword = network["password"].as<String>();
            
            // Check if this is a placeholder password
            if (storedPassword.startsWith("temp_password_") || 
                storedPassword.startsWith("placeholder_") ||
                storedPassword == "temp_password" ||
                storedPassword.length() < 1) {
                
                isPlaceholder = true;
                
                // Try to get the real password from WiFiManager
                Serial.println("Found placeholder password for " + ssid + ", checking WiFiManager");
                String wifiManagerPassword = wifiManager.getWiFiPass(true);
                String wifiManagerSSID = wifiManager.getWiFiSSID(true);
                
                if (wifiManagerSSID == ssid && wifiManagerPassword.length() > 0) {
                    // Update with WiFiManager password
                    Serial.println("Found valid password in WiFiManager, updating NVS");
                    network["password"] = wifiManagerPassword;
                }
            }
            break;
        }
    }
    
    // If we found a placeholder and potentially updated it, save back to NVS
    if (found && isPlaceholder) {
        String updatedJson;
        serializeJson(doc, updatedJson);
        
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedJson);
            prefs.end();
            
            if (success) {
                Serial.println("Successfully updated placeholder password in NVS");
                return true;
            } else {
                Serial.println("Failed to save updated WiFi credentials to NVS");
            }
        } else {
            Serial.println("Failed to open NVS for writing");
        }
    } else if (!found) {
        Serial.println("Network not found in NVS: " + ssid);
    } else {
        Serial.println("Network already has a valid password in NVS");
    }
    
    return false;
}

// Connect to a saved WiFi network with better placeholder handling
bool connectToSavedWifiNetwork(JsonObject network) {
    String ssid = network["ssid"].as<String>();
    String password = network["password"].as<String>();
    
    // Immediately check if this is a placeholder password and update if needed
    bool isPlaceholder = password.startsWith("temp_password_") || 
                        password.startsWith("placeholder_") ||
                        password == "temp_password" ||
                        password.length() < 1;
    
    if (isPlaceholder) {
        Serial.print("Found placeholder password for: ");
        Serial.println(ssid);
        
        // First try to update it directly using the helper function
        if (updatePlaceholderPassword(ssid)) {
            // If we updated it, reload the password
            Preferences prefs;
            if (prefs.begin(WIFI_NAMESPACE, true)) {
                String updatedJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
                prefs.end();
                
                DynamicJsonDocument updatedDoc(WIFI_CREDENTIALS_JSON_SIZE);
                if (deserializeJson(updatedDoc, updatedJson) == DeserializationError::Ok) {
                    JsonArray updatedNetworks = updatedDoc.as<JsonArray>();
                    
                    for (JsonObject updatedNetwork : updatedNetworks) {
                        if (updatedNetwork["ssid"] == ssid) {
                            password = updatedNetwork["password"].as<String>();
                            
                            if (!password.startsWith("temp_password_") && 
                                !password.startsWith("placeholder_") &&
                                password != "temp_password" &&
                                password.length() > 0) {
                                
                                Serial.println("Using updated password from NVS");
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // If we still have a placeholder, try a direct attempt using WiFiManager
        if (password.startsWith("temp_password_") || 
            password.startsWith("placeholder_") ||
            password == "temp_password" ||
            password.length() < 1) {
            
            Serial.println("Still have placeholder password, trying WiFiManager's internal credentials");
            
            // Let WiFiManager try to connect using its stored credentials
            wifiManager.setConfigPortalTimeout(0);  // Don't launch the portal
            bool connected = wifiManager.autoConnect();
            
            if (connected && WiFi.SSID() == ssid) {
                Serial.println("Successfully connected using WiFiManager's credentials");
                
                // Try to update our NVS with the correct password
                updateSavedWiFiPasswordFromWiFiManager(ssid, wifiManager);
                return true;
            }
            
            // If we're here, WiFiManager didn't connect to this network
            Serial.println("WiFiManager couldn't connect to network");
            return false;
        }
    }
    
    // Normal connection with the password we have
    Serial.print("Attempting to connect to network: ");
    Serial.print(ssid);
    Serial.print(" with password length: ");
    Serial.println(password.length());
    
    WiFi.begin(ssid.c_str(), password.c_str());
    
    // Wait for connection with timeout
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConnected successfully!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
        
        // If this was a connection with a placeholder that worked, update NVS
        if (isPlaceholder) {
            updateSavedWiFiPasswordFromWiFiManager(ssid, wifiManager);
        }
        
        return true;
    } else {
        Serial.println("\nFailed to connect to " + ssid);
        return false;
    }
}
// ==== End wifi_connection.cpp ====


// ==== Begin wifi_manager_setup.cpp ====
// Define necessary constants if not already defined
#define WIFI_NAMESPACE "wificonfig"
#define WIFI_CREDENTIALS_KEY "credentials"
#define WIFI_CREDENTIALS_JSON_SIZE 2048

// Reference the global wifiManager instance
extern WiFiManager wifiManager;

// Function declaration for saveWifiCredentialsToNVS
void saveWifiCredentialsToNVS(const String& ssid, const String& password, int priority = 1);

// Add helper function to save WiFi credentials directly to NVS
void saveWifiCredentialsToNVS(const String& ssid, const String& password, int priority) {
    Preferences prefs;
    
    // Open preferences in read mode first to get existing networks
    if (!prefs.begin(WIFI_NAMESPACE, true)) {
        Serial.println("Failed to open NVS for reading WiFi credentials");
        return;
    }
    
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();
    
    // Parse existing JSON
    DynamicJsonDocument wifiDoc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(wifiDoc, wifiListJson);
    
    if (error) {
        Serial.println("Error parsing saved WiFi networks. Creating new list.");
        wifiDoc.clear();
        wifiDoc = JsonArray();
    }
    
    // Check if this network already exists
    JsonArray networks = wifiDoc.as<JsonArray>();
    bool networkExists = false;
    
    for (JsonObject network : networks) {
        if (network["ssid"] == ssid) {
            // Update existing network
            network["password"] = password;
            if (priority > 0) {
                network["priority"] = priority;
            }
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
    
    // Debug output (hide actual password in logs)
    Serial.print("WiFi credentials JSON size: ");
    Serial.println(updatedJson.length());
    
    // Save back to NVS
    if (prefs.begin(WIFI_NAMESPACE, false)) { // Write mode
        bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedJson);
        prefs.end();
        
        if (success) {
            Serial.println("Successfully saved WiFi credentials to NVS");
        } else {
            Serial.println("Failed to save WiFi credentials to NVS");
        }
    } else {
        Serial.println("Failed to open NVS for writing WiFi credentials");
    }
}

void setupWifiManager() {
    // Add callbacks for when WiFi is saved via the portal
    wifiManager.setSaveConfigCallback([]() {
        Serial.println("WiFiManager: Credentials Saved");
        
        // Wait a short moment to ensure the connection is established
        delay(500);
        
        // Get the SSID that was just saved
        String savedSSID = wifiManager.getWiFiSSID(true);
        String savedPassword = wifiManager.getWiFiPass(true);
        
        Serial.print("WiFiManager saved network: ");
        Serial.println(savedSSID);
        
        if (savedSSID.length() > 0) {
            Serial.println("Attempting to synchronize WiFiManager password to NVS...");
            
            if (updateSavedWiFiPasswordFromWiFiManager(savedSSID, wifiManager)) {
                Serial.println("Successfully synchronized WiFiManager password to NVS storage");
            } else {
                Serial.println("Failed to synchronize WiFiManager password to NVS storage");
                
                // Fallback: Since updateSavedWiFiPasswordFromWiFiManager failed,
                // manually save the network with the password we got
                if (savedPassword.length() > 0) {
                    Serial.println("Using manual fallback to save credentials...");
                    saveWifiCredentialsToNVS(savedSSID, savedPassword);
                }
            }
        }
    });
    
    // Also add an event callback for when connection is successful
    WiFi.onEvent([](WiFiEvent_t event, WiFiEventInfo_t info) {
        if (event == ARDUINO_EVENT_WIFI_STA_GOT_IP) {
            Serial.println("WiFi connected with IP: " + WiFi.localIP().toString());
            
            // Get current network info
            String connectedSSID = WiFi.SSID();
            
            // Try to synchronize the password for this network
            Serial.print("Synchronizing password for connected network: ");
            Serial.println(connectedSSID);
            
            updateSavedWiFiPasswordFromWiFiManager(connectedSSID, wifiManager);
        }
    });
}
// ==== End wifi_manager_setup.cpp ====


// ==== Begin wifi_manager_helper.cpp ====
// Constants for NVS
#define WIFI_NAMESPACE "wificonfig"
#define WIFI_CREDENTIALS_KEY "credentials"
#define WIFI_CREDENTIALS_JSON_SIZE 2048

bool updateSavedWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm) {
    Serial.print("Updating saved WiFi credentials from WiFiManager for SSID: ");
    Serial.println(ssid);
    
    // First try to get the actual connected SSID - that's most reliable
    String connectedSSID = WiFi.SSID();
    String realPassword = "";
    
    if (connectedSSID == ssid) {
        // We're connected to this network - try to get the password from WiFiManager
        realPassword = wm.getWiFiPass(true);
        Serial.println("Using WiFiManager's stored password for currently connected network");
    } else {
        // We're not connected to this network, see if WiFiManager has it stored
        String storedSSID = wm.getWiFiSSID(true);
        
        if (storedSSID == ssid) {
            realPassword = wm.getWiFiPass(true);
            Serial.println("Using WiFiManager's stored password for saved network");
        } else {
            Serial.print("WiFiManager SSID (");
            Serial.print(storedSSID);
            Serial.print(") doesn't match requested SSID (");
            Serial.print(ssid);
            Serial.println(")");
            return false;
        }
    }
    
    // Verify that we got a password
    if (realPassword.length() == 0) {
        Serial.println("No password found in WiFiManager");
        return false;
    }
    
    Serial.println("Found valid password in WiFiManager, updating NVS storage");
    
    // Open NVS
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, false)) {
        Serial.println("Failed to open NVS for WiFi credentials update");
        return false;
    }
    
    // Retrieve the stored networks
    String networksJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();
    
    // Parse the JSON
    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(doc, networksJson);
    
    if (error) {
        Serial.print("Failed to parse WiFi credentials JSON: ");
        Serial.println(error.c_str());
        
        // Create a new JSON array with just this network
        doc.clear();
        JsonArray networks = doc.to<JsonArray>();
        JsonObject newNetwork = networks.createNestedObject();
        newNetwork["ssid"] = ssid;
        newNetwork["password"] = realPassword;
        newNetwork["priority"] = 1;
        
        // Save the new JSON
        String newJson;
        serializeJson(doc, newJson);
        
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            bool success = prefs.putString(WIFI_CREDENTIALS_KEY, newJson);
            prefs.end();
            
            if (success) {
                Serial.println("Created new WiFi credentials JSON with current network");
                return true;
            } else {
                Serial.println("Failed to save new WiFi credentials JSON");
                return false;
            }
        }
        return false;
    }
    
    // Find and update the network with matching SSID
    bool found = false;
    JsonArray networks = doc.as<JsonArray>();
    
    for (JsonObject network : networks) {
        if (network["ssid"] == ssid) {
            network["password"] = realPassword;
            found = true;
            break;
        }
    }
    
    // If network wasn't found, add it
    if (!found) {
        JsonObject newNetwork = networks.createNestedObject();
        newNetwork["ssid"] = ssid;
        newNetwork["password"] = realPassword;
        newNetwork["priority"] = networks.size() > 0 ? networks.size() + 1 : 1; // Add with lowest priority
    }
    
    // Serialize and save back to NVS
    String updatedJson;
    serializeJson(doc, updatedJson);
    
    if (prefs.begin(WIFI_NAMESPACE, false)) {
        bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedJson);
        prefs.end();
        
        if (success) {
            Serial.println("Successfully updated WiFi credentials in NVS with real password");
            return true;
        } else {
            Serial.println("Failed to save updated WiFi credentials to NVS");
            return false;
        }
    } else {
        Serial.println("Failed to open NVS for saving WiFi credentials");
        return false;
    }
    
    return false;
}

String getWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm) {
    // First check if this is the currently connected SSID
    String currentSSID = wm.getWiFiSSID(true);
    if (currentSSID == ssid) {
        return wm.getWiFiPass(true);
    }
    
    // Otherwise, we can't directly access other stored passwords from WiFiManager
    // Just return empty string
    return "";
}
// ==== End wifi_manager_helper.cpp ====


// ==== Begin wifi_manager_overloads.cpp ====
// External reference to the WiFiManager instance
extern WiFiManager wifiManager;

// Implementation of simplified helper functions that use the global WiFiManager instance

bool updateSavedWiFiPasswordFromWiFiManager(const String& ssid) {
    return updateSavedWiFiPasswordFromWiFiManager(ssid, wifiManager);
}

String getWiFiPasswordFromWiFiManager(const String& ssid) {
    return getWiFiPasswordFromWiFiManager(ssid, wifiManager);
}
// ==== End wifi_manager_overloads.cpp ====


// ==== Begin wifi_manager_instance.cpp ====
// Define the WiFiManager instance only in this file
WiFiManager wifiManager;

// Function to get a reference to the WiFiManager instance
WiFiManager& getWiFiManager() {
    return wifiManager;
}

// Initialize the WiFiManager instance with any default settings
void initWiFiManagerInstance() {
    // Set any default settings for WiFiManager here
    wifiManager.setDebugOutput(true);
}
// ==== End wifi_manager_instance.cpp ====
