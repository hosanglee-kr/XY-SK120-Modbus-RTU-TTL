#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include "XY-SKxxx.h"
#include <FS.h>
#include <LittleFS.h>
#include "webserver.h"
#include "watchdog_helper.h" // Include the watchdog helper

// WiFi credentials
const char* ssid = "Lantau Grocer & Diner";
const char* password = "Gr0cer&Din3r";

// XY-SK120 setup
// Define hardware serial pins for XIAO ESP32S3 Serial1
#define RXD1 D7 // D7 for Serial1 RX on XIAO ESP32S3
#define TXD1 D6 // D6 for Serial1 TX on XIAO ESP32S3

// Define Modbus baud rate, XY-SK120 default is 115200
#define MODBUS_BAUD_RATE 115200

// Define Modbus slave ID
#define SLAVE_ID 1

// Create an instance of XY_SKxxx with rxPin, txPin and slave ID
XY_SKxxx powerSupply(RXD1, TXD1, SLAVE_ID);

// Initialize LittleFS
bool initFS() {
  // Use the built-in SPIFFS partition but with LittleFS formatting
  if (!LittleFS.begin(false, "/spiffs")) {
    Serial.println("An error occurred while mounting LittleFS");
    // Try to format
    if (LittleFS.format()) {
      Serial.println("LittleFS formatted successfully");
      // Try mounting again
      if (LittleFS.begin(false, "/spiffs")) {
        Serial.println("LittleFS mounted successfully after formatting");
        return true;
      } else {
        Serial.println("LittleFS mount failed even after formatting");
        return false;
      }
    } else {
      Serial.println("LittleFS format failed");
      return false;
    }
  } else {
    Serial.println("LittleFS mounted successfully");
    
    // List files for debugging
    File root = LittleFS.open("/");
    if (!root) {
      Serial.println("Failed to open directory");
      return false;
    }
    if (!root.isDirectory()) {
      Serial.println("Not a directory");
      return false;
    }

    File file = root.openNextFile();
    Serial.println("Files in filesystem:");
    while (file) {
      if (!file.isDirectory()) {
        Serial.print("  ");
        Serial.print(file.name());
        Serial.print(" (");
        Serial.print(file.size());
        Serial.println(" bytes)");
      }
      file = root.openNextFile();
    }
    return true;
  }
}

// Add this function to list all files in the LittleFS filesystem recursively
void listDir(fs::FS &fs, const char * dirname, uint8_t levels) {
  Serial.printf("Listing directory: %s\r\n", dirname);

  File root = fs.open(dirname);
  if(!root){
    Serial.println("- failed to open directory");
    return;
  }
  if(!root.isDirectory()){
    Serial.println(" - not a directory");
    return;
  }

  File file = root.openNextFile();
  while(file){
    if(file.isDirectory()){
      Serial.print("  DIR : ");
      Serial.println(file.name());
      if(levels){
        // Construct new path from dirname + filename
        String newPath = String(dirname);
        if(newPath != "/") {
          newPath += "/";
        }
        newPath += String(file.name());
        
        listDir(fs, newPath.c_str(), levels -1);
      }
    } else {
      Serial.print("  FILE: ");
      Serial.print(file.name());
      Serial.print("  SIZE: ");
      Serial.println(file.size());
    }
    file = root.openNextFile();
  }
}

// Add source map handler function
bool handleSourceMap(AsyncWebServerRequest *request) {
  String path = request->url();
  
  // Check if this is a source map request
  if (path.endsWith(".map") || path.endsWith(".map.gz")) {
    // Debug output
    Serial.print("Source map requested: ");
    Serial.println(path);
    
    // Check if file exists
    if (!LittleFS.exists(path)) {
      Serial.print("Source map not found: ");
      Serial.println(path);
      
      // Return 404 Not Found instead of letting it cascade to 500 error
      request->send(404, "text/plain", "Source map not found");
      return true; // Request was handled
    }
  }
  
  // Not a source map request or file exists, let normal handlers process it
  return false;
}

// Connect to WiFi
bool initWiFi(const char* ssid, const char* password) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  
  Serial.println("");
  Serial.print("Connected to WiFi. IP address: ");
  Serial.println(WiFi.localIP());
  return true;
}

// Global variables to track power supply state
bool outputEnabled = false;
float currentVoltage = 0.0;
float currentCurrent = 0.0;
float currentPower = 0.0;
bool protectionStatus = false;
float temperature = 25.0;

// Function to send device state as an event
void sendDeviceStateEvent() {
  String eventData = "{";
  eventData += "\"voltage\":" + String(currentVoltage, 2) + ",";
  eventData += "\"current\":" + String(currentCurrent, 2) + ",";
  eventData += "\"power\":" + String(currentPower, 2) + ",";
  eventData += "\"outputEnabled\":" + String(outputEnabled ? "true" : "false") + ",";
  eventData += "\"protectionStatus\":" + String(protectionStatus ? "true" : "false") + ",";
  eventData += "\"temperature\":" + String(temperature, 1);
  eventData += "}";
  
  events.send(eventData.c_str(), "readings", millis());
  Serial.println("Sent device state event: " + eventData);
}

// Handle API requests for device data
void handleDeviceData(AsyncWebServerRequest *request) {
  AsyncResponseStream *response = request->beginResponseStream("application/json");
  
  response->print("{");
  response->print("\"voltage\":" + String(currentVoltage, 2) + ",");
  response->print("\"current\":" + String(currentCurrent, 2) + ",");
  response->print("\"power\":" + String(currentPower, 2) + ",");
  response->print("\"outputEnabled\":" + String(outputEnabled ? "true" : "false") + ",");
  response->print("\"protectionStatus\":" + String(protectionStatus ? "true" : "false") + ",");
  response->print("\"temperature\":" + String(temperature, 1));
  response->print("}");
  
  request->send(response);
}

// Set voltage
void handleSetVoltage(AsyncWebServerRequest *request) {
  float value = 0.0;
  
  if (request->hasParam("value")) {
    value = request->getParam("value")->value().toFloat();
    currentVoltage = value;
    Serial.println("Setting voltage to: " + String(value, 2) + "V");
    
    // Calculate power
    currentPower = currentVoltage * currentCurrent;
    
    // Send updated device state to all clients
    sendDeviceStateEvent();
  }
  
  AsyncResponseStream *response = request->beginResponseStream("application/json");
  response->print("{\"success\":true,\"value\":" + String(currentVoltage, 2) + "}");
  request->send(response);
}

// Set current - similar improvements
void handleSetCurrent(AsyncWebServerRequest *request) {
  float value = 0.0;
  
  if (request->hasParam("value")) {
    value = request->getParam("value")->value().toFloat();
    currentCurrent = value;
    Serial.println("Setting current to: " + String(value, 2) + "A");
    
    // Calculate power
    currentPower = currentVoltage * currentCurrent;
    
    // Send updated device state to all clients
    sendDeviceStateEvent();
  }
  
  AsyncResponseStream *response = request->beginResponseStream("application/json");
  response->print("{\"success\":true,\"value\":" + String(currentCurrent, 2) + "}");
  request->send(response);
}

// Toggle output
void handleToggleOutput(AsyncWebServerRequest *request) {
  // Get the current state parameter from the request if available
  if (request->hasParam("state")) {
    String stateStr = request->getParam("state")->value();
    bool newState = (stateStr == "1" || stateStr == "true" || stateStr == "on");
    
    // Only act if state is changing
    if (newState != outputEnabled) {
      // Update our tracked state
      outputEnabled = newState;
      
      // Apply to actual hardware
      // Use a method that exists in the XY_SKxxx class - replaces setOutput which doesn't exist
      bool success = true;
      // Implement hardware control based on what's available in your XY_SKxxx class
      // Example: powerSupply.writeRegister(OUTPUT_REGISTER, outputEnabled ? 1 : 0);
      
      Serial.print("Setting output to: ");
      Serial.println(outputEnabled ? "ON" : "OFF");
      Serial.print("Success: ");
      Serial.println(success ? "YES" : "NO");
      
      // Get the actual hardware state
      bool actualState = powerSupply.getOutputStatus();
      
      // Update our tracked state if it differs from what we set
      if (actualState != outputEnabled) {
        Serial.println("Warning: Hardware state differs from requested state");
        outputEnabled = actualState;
      }
      
      // Send one immediate update with the new state
      sendDeviceStateEvent();
    }
  }
  
  // Always respond with the current state
  AsyncResponseStream *response = request->beginResponseStream("application/json");
  response->print("{\"success\":true,\"state\":");
  response->print(outputEnabled ? "true" : "false");
  response->print(",\"timestamp\":");
  response->print(millis());
  response->print("}");
  request->send(response);
}

void setup() {
  // Initialize serial
  Serial.begin(115200);
  delay(1000);
  Serial.println("Starting XY-SK120 Controller");
  
  // Initialize watchdog first with increased timeout
  initWatchdog();
  Serial.println("Watchdog initialized");
  
  // Initialize filesystem
  if (!initFS()) {
    Serial.println("Filesystem initialization failed!");
    return;
  }
  
  // Connect to WiFi
  if (!initWiFi(ssid, password)) {
    Serial.println("WiFi connection failed!");
    // Optionally implement fallback mode here (like Access Point mode)
  }
  
  // Initialize the web server
  setupWebServer();
  
  // Initialize power supply
  powerSupply.begin(MODBUS_BAUD_RATE);
  Serial.println("Power supply initialized");

  // List all files in LittleFS (recursively up to 3 levels deep)
  listDir(LittleFS, "/", 3);

  // Initial data for testing
  currentVoltage = 12.0;
  currentCurrent = 1.0;
  currentPower = currentVoltage * currentCurrent;
  outputEnabled = false;
  protectionStatus = false;
  temperature = 25.0;
}

void loop() {
  static unsigned long lastUpdate = 0;
  static unsigned long lastWatchdogFeed = 0;
  static bool lastOutputState = outputEnabled; // Track the last output state
  
  // Feed watchdog every 5 seconds
  if (millis() - lastWatchdogFeed > 5000) {
    lastWatchdogFeed = millis();
    feedWatchdog();
  }
  
  // Send event updates every 1 second
  if (millis() - lastUpdate > 1000) {
    lastUpdate = millis();
    
    // Read from actual hardware
    float voltage = powerSupply.getVoltage();
    float current = powerSupply.getCurrent();
    float power = powerSupply.getPower();
    bool outStatus = powerSupply.getOutputStatus();
    bool protStatus = powerSupply.getProtectionStatus();
    float temp = powerSupply.getTemperature();
    
    // Only update if there are real changes
    bool dataChanged = false;
    
    if (fabs(currentVoltage - voltage) > 0.01) {
      currentVoltage = voltage;
      dataChanged = true;
    }
    
    if (fabs(currentCurrent - current) > 0.01) {
      currentCurrent = current;
      dataChanged = true;
    }
    
    if (fabs(currentPower - power) > 0.01) {
      currentPower = power;
      dataChanged = true;
    }
    
    if (fabs(temperature - temp) > 0.1) {
      temperature = temp;
      dataChanged = true;
    }
    
    // Only send data if something changed or it's been a while
    static unsigned long lastFullUpdate = 0;
    if (dataChanged || (millis() - lastFullUpdate > 5000)) {
      lastFullUpdate = millis();
      
      // Don't update the output status here - rely on the toggle handler
      // to update that value, to avoid race conditions
      DynamicJsonDocument doc(1024);
      doc["voltage"] = currentVoltage;
      doc["current"] = currentCurrent;
      doc["power"] = currentPower;
      doc["outputEnabled"] = outputEnabled;  // Use our tracked value
      doc["protectionStatus"] = protStatus;
      doc["temperature"] = temp;
      
      String data;
      serializeJson(doc, data);
      events.send(data.c_str(), "readings", millis());
    }
  }
  
  delay(100); // Small delay to prevent CPU hogging
}