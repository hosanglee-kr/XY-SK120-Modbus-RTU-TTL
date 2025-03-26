// Fix HTTP method definition conflicts between ESPAsyncWebServer and WiFiManager
#define WEBSERVER_H  // Prevent WebServer.h from being included directly

// Define HTTP methods for ESPAsyncWebServer before including it
// These match the WebRequestMethod enum in ESPAsyncWebServer.h
#define HTTP_GET     0b00000001
#define HTTP_POST    0b00000010
#define HTTP_DELETE  0b00000100
#define HTTP_PUT     0b00001000
#define HTTP_PATCH   0b00010000
#define HTTP_HEAD    0b00100000
#define HTTP_OPTIONS 0b01000000
#define HTTP_ANY     0b01111111

#include "web_interface.h"
#include <ArduinoJson.h>
#include <FS.h>
#include <LittleFS.h>
#include <AsyncWebSocket.h>
#include <WiFi.h>
#include "wifi_interface/wifi_manager_wrapper.h"
#include "modbus_handler.h"
#include "config_manager.h"

// Include XY-SKxxx header to access power supply functions
#include "XY-SKxxx.h"

// Declare external power supply instance
extern XY_SKxxx* powerSupply;

AsyncWebSocket ws("/ws");

void notFound(AsyncWebServerRequest *request) {
  request->send(404, "text/plain", "Not found");
}

String getContentType(String filename) {
  if (filename.endsWith(".html")) return "text/html";
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".json")) return "application/json";
  else if (filename.endsWith(".png")) return "image/png";
  else if (filename.endsWith(".jpg")) return "image/jpeg";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  return "text/plain";
}

bool handleFileRead(AsyncWebServerRequest *request) {
  String path = request->url();
  if (path.endsWith("/")) path += "index.html";
  
  String contentType = getContentType(path);
  
  // Check if file exists
  if (LittleFS.exists(path)) {
    request->send(LittleFS, path, contentType);
    return true;
  }
  
  // Special case for Apple Touch Icons and favicon - serve default if missing
  if (path.endsWith("apple-touch-icon.png") || 
      path.endsWith("apple-touch-icon-precomposed.png") ||
      path.endsWith("favicon.ico")) {
    
    // If we have a default icon file, serve that instead
    if (LittleFS.exists("/favicon.ico")) {
      request->send(LittleFS, "/favicon.ico", "image/x-icon");
      return true;
    } else {
      // Return a 204 No Content to prevent browser warnings
      request->send(204);
      return true;
    }
  }
  
  return false;
}

// Helper functions for XY-SKxxx power supply interface
// These work with the existing library methods instead of modifying the library

// Get voltage from power supply
float getPSUVoltage(XY_SKxxx* powerSupply) {
  float voltage = 0.0, current = 0.0, power = 0.0;
  if (powerSupply && powerSupply->testConnection()) {
    powerSupply->getOutput(voltage, current, power);
  }
  return voltage;
}

// Get current from power supply
float getPSUCurrent(XY_SKxxx* powerSupply) {
  float voltage = 0.0, current = 0.0, power = 0.0;
  if (powerSupply && powerSupply->testConnection()) {
    powerSupply->getOutput(voltage, current, power);
  }
  return current;
}

// Get power from power supply
float getPSUPower(XY_SKxxx* powerSupply) {
  float voltage = 0.0, current = 0.0, power = 0.0;
  if (powerSupply && powerSupply->testConnection()) {
    powerSupply->getOutput(voltage, current, power);
  }
  return power;
}

// Check if output is enabled - fixed implementation
bool isPSUOutputEnabled(XY_SKxxx* powerSupply) {
  if (powerSupply && powerSupply->testConnection()) {
    return powerSupply->isOutputEnabled(true); // Force refresh from device
  }
  return false;
}

// Set output state (on/off) - fixed implementation
bool setPSUOutput(XY_SKxxx* powerSupply, bool enable) {
  if (powerSupply && powerSupply->testConnection()) {
    if (enable) {
      return powerSupply->turnOutputOn();
    } else {
      return powerSupply->turnOutputOff();
    }
  }
  return false;
}

void handleWebSocketMessage(AsyncWebSocket* webSocket, AsyncWebSocketClient* client, 
                           AwsFrameInfo* info, uint8_t* data, size_t len) {
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    String message = String((char*)data);
    
    Serial.print("WebSocket received: ");
    Serial.println(message);
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, message);
    
    if (error) {
      Serial.print("deserializeJson() failed: ");
      Serial.println(error.c_str());
      return;
    }
    
    String action = doc["action"];
    
    if (action == "getData") {
      // Create a JSON response with power supply data only (removing Modbus dummy data)
      DynamicJsonDocument responseDoc(1024);
      
      // Add power supply status information using helper functions
      if (powerSupply && powerSupply->testConnection()) {
        float voltage = getPSUVoltage(powerSupply);
        float current = getPSUCurrent(powerSupply);
        float power = getPSUPower(powerSupply);
        bool outputEnabled = isPSUOutputEnabled(powerSupply);
        
        responseDoc["outputEnabled"] = outputEnabled;
        responseDoc["voltage"] = voltage;
        responseDoc["current"] = current;
        responseDoc["power"] = power;
        
        // Add model and version info
        responseDoc["model"] = powerSupply->getModel();
        responseDoc["version"] = powerSupply->getVersion();
      }
      
      String response;
      serializeJson(responseDoc, response);
      client->text(response);
    } 
    else if (action == "setConfig") {
      // Handle configuration settings
      client->text("{\"status\":\"success\",\"message\":\"Configuration updated\"}");
    }
    // Power supply control commands
    else if (action == "powerOutput") {
      // Toggle power output on/off - ensure we get the correct current state first
      if (powerSupply && powerSupply->testConnection()) {
        bool enable = doc["enable"];
        Serial.print("Power output command received. Setting output to: ");
        Serial.println(enable ? "ON" : "OFF");
        
        bool success = setPSUOutput(powerSupply, enable);
        
        // Wait a moment for the command to take effect
        delay(100);
        
        // Get current status after change
        bool outputEnabled = isPSUOutputEnabled(powerSupply);
        
        Serial.print("Output status after command: ");
        Serial.println(outputEnabled ? "ON" : "OFF");
        
        // Send response
        DynamicJsonDocument responseDoc(256);
        responseDoc["action"] = "powerOutputResponse";
        responseDoc["success"] = success;
        responseDoc["enabled"] = outputEnabled;
        
        String response;
        serializeJson(responseDoc, response);
        client->text(response);
      } else {
        client->text("{\"action\":\"powerOutputResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
      }
    }
    else if (action == "setVoltage") {
      // Set voltage
      if (powerSupply && powerSupply->testConnection()) {
        float voltage = doc["voltage"];
        bool success = powerSupply->setVoltage(voltage);
        
        // Read current settings after change
        float v = getPSUVoltage(powerSupply);
        
        // Send response
        DynamicJsonDocument responseDoc(256);
        responseDoc["action"] = "setVoltageResponse";
        responseDoc["success"] = success;
        responseDoc["voltage"] = v;
        
        String response;
        serializeJson(responseDoc, response);
        client->text(response);
      } else {
        client->text("{\"action\":\"setVoltageResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
      }
    }
    else if (action == "setCurrent") {
      // Set current
      if (powerSupply && powerSupply->testConnection()) {
        float current = doc["current"];
        bool success = powerSupply->setCurrent(current);
        
        // Read current settings after change
        float c = getPSUCurrent(powerSupply);
        
        // Send response
        DynamicJsonDocument responseDoc(256);
        responseDoc["action"] = "setCurrentResponse";
        responseDoc["success"] = success;
        responseDoc["current"] = c;
        
        String response;
        serializeJson(responseDoc, response);
        client->text(response);
      } else {
        client->text("{\"action\":\"setCurrentResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
      }
    }
    else if (action == "getStatus") {
      // Get comprehensive status
      DynamicJsonDocument responseDoc(1024);
      responseDoc["action"] = "statusResponse";
      
      if (powerSupply && powerSupply->testConnection()) {
        float voltage = getPSUVoltage(powerSupply);
        float current = getPSUCurrent(powerSupply);
        float power = getPSUPower(powerSupply);
        bool outputEnabled = isPSUOutputEnabled(powerSupply);
        
        // Get data using available methods
        responseDoc["connected"] = true;
        responseDoc["outputEnabled"] = outputEnabled;
        responseDoc["voltage"] = voltage;
        responseDoc["current"] = current;
        responseDoc["power"] = power;
        
        // Try to get temperature if available
        float temperature = 25.0; // Default value
        responseDoc["temperature"] = temperature;
        
        // Get device info
        responseDoc["model"] = powerSupply->getModel();
        responseDoc["version"] = powerSupply->getVersion();
      } else {
        responseDoc["connected"] = false;
      }
      
      String response;
      serializeJson(responseDoc, response);
      client->text(response);
    }
    // Key lock control
    else if (action == "setKeyLock") {
      if (powerSupply && powerSupply->testConnection()) {
        bool lock = doc["lock"];
        Serial.print("Key lock command received. Setting keys to: ");
        Serial.println(lock ? "LOCKED" : "UNLOCKED");
        
        bool success = powerSupply->setKeyLock(lock);
        
        // Get current status after change
        bool keyLocked = powerSupply->isKeyLocked(true);
        
        // Send response
        DynamicJsonDocument responseDoc(256);
        responseDoc["action"] = "keyLockResponse";
        responseDoc["success"] = success;
        responseDoc["locked"] = keyLocked;
        
        String response;
        serializeJson(responseDoc, response);
        client->text(response);
      } else {
        client->text("{\"action\":\"keyLockResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
      }
    }
    // Constant Voltage mode
    else if (action == "setConstantVoltage") {
      if (powerSupply && powerSupply->testConnection()) {
        float voltage = doc["voltage"];
        bool success = powerSupply->setConstantVoltage(voltage);
        
        // Send response
        DynamicJsonDocument responseDoc(256);
        responseDoc["action"] = "constantVoltageResponse";
        responseDoc["success"] = success;
        responseDoc["voltage"] = voltage;
        
        String response;
        serializeJson(responseDoc, response);
        client->text(response);
      } else {
        client->text("{\"action\":\"constantVoltageResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
      }
    }
    // Constant Current mode
    else if (action == "setConstantCurrent") {
      if (powerSupply && powerSupply->testConnection()) {
        float current = doc["current"];
        bool success = powerSupply->setConstantCurrent(current);
        
        // Send response
        DynamicJsonDocument responseDoc(256);
        responseDoc["action"] = "constantCurrentResponse";
        responseDoc["success"] = success;
        responseDoc["current"] = current;
        
        String response;
        serializeJson(responseDoc, response);
        client->text(response);
      } else {
        client->text("{\"action\":\"constantCurrentResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
      }
    }
    // Constant Power mode
    else if (action == "setConstantPower") {
      if (powerSupply && powerSupply->testConnection()) {
        float power = doc["power"];
        bool success = powerSupply->setConstantPower(power);
        
        // Send response
        DynamicJsonDocument responseDoc(256);
        responseDoc["action"] = "constantPowerResponse";
        responseDoc["success"] = success;
        responseDoc["power"] = power;
        
        String response;
        serializeJson(responseDoc, response);
        client->text(response);
      } else {
        client->text("{\"action\":\"constantPowerResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
      }
    }
    // Constant Power mode toggle
    else if (action == "setConstantPowerMode") {
      if (powerSupply && powerSupply->testConnection()) {
        bool enable = doc["enable"];
        bool success = powerSupply->setConstantPowerMode(enable);
        
        // Get current state after change
        bool isEnabled = powerSupply->isConstantPowerModeEnabled(true);
        
        // Send response
        DynamicJsonDocument responseDoc(256);
        responseDoc["action"] = "constantPowerModeResponse";
        responseDoc["success"] = success;
        responseDoc["enabled"] = isEnabled;
        
        String response;
        serializeJson(responseDoc, response);
        client->text(response);
      } else {
        client->text("{\"action\":\"constantPowerModeResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
      }
    }
  }
}

void onWsEvent(AsyncWebSocket* server, AsyncWebSocketClient* client, 
              AwsEventType type, void* arg, uint8_t* data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
      break;
    case WS_EVT_DATA:
      handleWebSocketMessage(server, client, (AwsFrameInfo*)arg, data, len);
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

void setupWebServer(AsyncWebServer* server) {
  // Wrap in try-catch to handle possible initialization errors
  try {
    // Initialize WebSocket
    ws.onEvent(onWsEvent);
    server->addHandler(&ws);
    
    // Set up CORS headers for all requests
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");
    
    // Route for root / web page
    server->on("/", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(LittleFS, "/index.html", "text/html");
    });
    
    // Route to load style.css file
    server->on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(LittleFS, "/style.css", "text/css");
    });
    
    // Route to load main.js file
    server->on("/main.js", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(LittleFS, "/main.js", "application/javascript");
    });
    
    // API endpoints - remove the /api/data endpoint that used dummy sensor data
    server->on("/api/data", HTTP_GET, [](AsyncWebServerRequest *request){
      DynamicJsonDocument doc(1024);
      
      // Add power supply status information instead of modbus data
      if (powerSupply && powerSupply->testConnection()) {
        float voltage = 0, current = 0, power = 0;
        powerSupply->getOutput(voltage, current, power);
        bool outputEnabled = powerSupply->isOutputEnabled(true);
        
        doc["outputEnabled"] = outputEnabled;
        doc["voltage"] = voltage;
        doc["current"] = current;
        doc["power"] = power;
      }
      
      String jsonString;
      serializeJson(doc, jsonString);
      
      // Simply send the string as a response
      request->send(200, "application/json", jsonString);
    });

    server->on("/api/config", HTTP_GET, [](AsyncWebServerRequest *request){
      DynamicJsonDocument doc(1024);
      DeviceConfig config = getConfig();
      
      doc["deviceName"] = config.deviceName;
      doc["modbusId"] = config.modbusId;
      doc["baudRate"] = config.baudRate;
      doc["dataBits"] = config.dataBits;
      doc["parity"] = config.parity;
      doc["stopBits"] = config.stopBits;
      doc["updateInterval"] = config.updateInterval;
      
      String jsonString;
      serializeJson(doc, jsonString);
      
      // Send the JSON string directly
      request->send(200, "application/json", jsonString);
    });

    server->on("/api/config", HTTP_POST, [](AsyncWebServerRequest *request){
      // Dummy response for now
      request->send(200, "application/json", "{\"success\":true,\"message\":\"Configuration saved\"}");
    }, NULL, [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      // Handle POST data when it's available
      if (len > 0) {
        DynamicJsonDocument doc(1024);
        DeserializationError error = deserializeJson(doc, data, len);
        
        if (!error) {
          DeviceConfig& config = getConfig();
          
          if (doc.containsKey("deviceName")) strlcpy(config.deviceName, doc["deviceName"], sizeof(config.deviceName));
          if (doc.containsKey("modbusId")) config.modbusId = doc["modbusId"];
          if (doc.containsKey("baudRate")) config.baudRate = doc["baudRate"];
          if (doc.containsKey("dataBits")) config.dataBits = doc["dataBits"];
          if (doc.containsKey("parity")) config.parity = doc["parity"];
          if (doc.containsKey("stopBits")) config.stopBits = doc["stopBits"];
          if (doc.containsKey("updateInterval")) config.updateInterval = doc["updateInterval"];
          
          // Save the updated configuration
          saveConfig();
        }
      }
    });

    // WiFi management API endpoints
    server->on("/api/wifi/status", HTTP_GET, [](AsyncWebServerRequest *request){
      DynamicJsonDocument doc(256);
      doc["status"] = isWiFiConnected() ? "connected" : "disconnected";
      doc["ssid"] = getWiFiSSID();
      doc["ip"] = getWiFiIP();
      doc["rssi"] = getWiFiRSSI();
      doc["mac"] = getWiFiMAC();
      
      String response;
      serializeJson(doc, response);
      request->send(200, "application/json", response);
    });
    
    server->on("/api/wifi/reset", HTTP_POST, [](AsyncWebServerRequest *request){
      // This will trigger a WiFi settings reset and device restart
      AsyncWebServerResponse *response = request->beginResponse(200, "application/json", 
                                                              "{\"status\":\"success\",\"message\":\"WiFi settings reset. Device will restart...\"}");
      request->send(response);
      
      // Schedule WiFi reset for after the response is sent
      delay(500);
      resetWiFiSettings();
      delay(500);
      ESP.restart();
    });
    
    // Add a simple health check endpoint
    server->on("/health", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(200, "text/plain", "OK");
    });
    
    // Add a simple health check endpoint that doesn't require AsyncTCP
    server->on("/ping", HTTP_GET, [](AsyncWebServerRequest *request){
      request->send(200, "text/plain", "pong");
    });
    
    Serial.println("Web server routes configured successfully");
  } 
  catch (const std::exception& e) {
    Serial.println("Error setting up web server routes");
  }
  
  // Handle file reads
  server->onNotFound([](AsyncWebServerRequest *request){
    if (!handleFileRead(request)) {
      request->send(404, "text/plain", "File Not Found");
    }
  });
}