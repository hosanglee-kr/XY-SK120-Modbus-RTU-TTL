#include "webserver.h"
#include <LittleFS.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <functional>

// Initialize event source
AsyncEventSource events("/events");

// Helper function to get content type
String getContentType(const String& path) {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg")) return "image/jpeg";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".map")) return "application/json";
  return "text/plain";
}

// These function declarations should match the ones in main.cpp
void handleDeviceData(AsyncWebServerRequest *request);
void handleSetVoltage(AsyncWebServerRequest *request);
void handleSetCurrent(AsyncWebServerRequest *request);
void handleToggleOutput(AsyncWebServerRequest *request);

// Implementation of setupWebServer function
void setupWebServer() {
  static AsyncWebServer server(80);
  
  // CORS headers for all responses
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // IMPORTANT: Register API routes FIRST
  // API routes for device control - include BOTH endpoint versions for compatibility
  
  // Debug each API endpoint registration
  Serial.println("Registering API endpoints:");
  
  // Device data endpoints
  Serial.println(" - /api/device (GET)");
  server.on("/api/device", HTTP_GET, handleDeviceData);
  Serial.println(" - /api/data (GET)");
  server.on("/api/data", HTTP_GET, handleDeviceData);
  
  // Voltage endpoints
  Serial.println(" - /api/setVoltage (POST)");
  server.on("/api/setVoltage", HTTP_POST, handleSetVoltage);
  Serial.println(" - /api/voltage (POST)");
  server.on("/api/voltage", HTTP_POST, handleSetVoltage);
  Serial.println(" - /api/voltage (GET)");
  server.on("/api/voltage", HTTP_GET, handleSetVoltage);
  
  // Current endpoints
  Serial.println(" - /api/setCurrent (POST)");
  server.on("/api/setCurrent", HTTP_POST, handleSetCurrent);
  Serial.println(" - /api/current (POST)");
  server.on("/api/current", HTTP_POST, handleSetCurrent);
  Serial.println(" - /api/current (GET)");
  server.on("/api/current", HTTP_GET, handleSetCurrent);
  
  // Output control endpoints
  Serial.println(" - /api/toggleOutput (POST)");
  server.on("/api/toggleOutput", HTTP_POST, handleToggleOutput);
  Serial.println(" - /api/output (POST)");
  server.on("/api/output", HTTP_POST, handleToggleOutput);
  Serial.println(" - /api/output (GET)");
  server.on("/api/output", HTTP_GET, handleToggleOutput);
  
  // Test/status API endpoints
  Serial.println(" - /api/ping (GET)");
  server.on("/api/ping", HTTP_GET, [](AsyncWebServerRequest *request){
    AsyncResponseStream *response = request->beginResponseStream("application/json");
    response->print("{\"status\":\"success\",\"message\":\"API is working!\"}");
    request->send(response);
  });

  Serial.println(" - /api/status (GET)");
  server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest *request){
    AsyncResponseStream *response = request->beginResponseStream("application/json");
    response->print("{\"status\":\"success\",\"data\":{");
    response->print("\"uptime\":");
    response->print(millis() / 1000);
    response->print(",\"heap\":");
    response->print(ESP.getFreeHeap());
    response->print(",\"temperature\":");
    response->print(random(20, 30)); // Replace with actual temperature reading if available
    response->print("}}");
    request->send(response);
  });

  server.on("/api/params", HTTP_POST, 
    [](AsyncWebServerRequest *request){
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      response->print("{\"status\":\"success\",\"message\":\"Parameters updated\"}");
      request->send(response);
    },
    NULL, 
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total){
      // Handle the body data here when implementing actual functionality
    }
  );

  // Explicitly register static file handler and remove serveStatic at the end
  Serial.println("Registering static file handler");
  server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");
  
  // Event source for real-time updates
  events.onConnect([](AsyncEventSourceClient *client) {
    if (client->lastId()) {
      Serial.printf("Client reconnected! Last message ID: %u\n", client->lastId());
    }
    client->send("connected", NULL, millis(), 10000);
  });
  server.addHandler(&events);
  
  // Then register the not-found handler AFTER all other routes
  Serial.println("Registering notFound handler");
  server.onNotFound([](AsyncWebServerRequest *request) {
    String path = request->url();
    
    // Don't try to serve API paths as files but provide more helpful error
    if (path.startsWith("/api/")) {
      Serial.print("Unknown API endpoint requested: ");
      Serial.println(path);
      
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      response->print("{\"error\":\"API endpoint not found\",\"url\":\"");
      response->print(path);
      response->print("\",\"method\":\"");
      response->print(request->methodToString());
      response->print("\",\"available\":[");
      response->print("\"/api/device\",\"/api/data\",\"/api/voltage\",");
      response->print("\"/api/current\",\"/api/output\",\"/api/ping\",\"/api/status\"");
      response->print("]}");
      request->send(response);
      return;
    }
    
    // First check if it's a source map that doesn't exist
    if (handleSourceMap(request)) {
      return; // Source map request was handled
    }
    
    // Normal static file handling
    if (request->method() == HTTP_GET) {
      // Debug path access
      Serial.print("Request for: ");
      Serial.println(path);
      
      // Fix common path issues - if it starts with /spiffs, remove it
      if (path.startsWith("/spiffs")) {
        path = path.substring(7); // Remove "/spiffs"
        Serial.print("Corrected path: ");
        Serial.println(path);
      }
      
      // Try to serve the file
      if (LittleFS.exists(path)) {
        Serial.println("File exists, serving directly");
        request->send(LittleFS, path, getContentType(path));
      } else if (LittleFS.exists(path + ".gz")) {
        // Try gzipped version
        Serial.println("Gzipped file exists, serving with gzip encoding");
        AsyncWebServerResponse *response = request->beginResponse(LittleFS, path + ".gz", 
            getContentType(path));
        response->addHeader("Content-Encoding", "gzip");
        request->send(response);
      } else {
        // If file not found, serve index.html for SPA
        Serial.print("File not found, serving index.html: ");
        Serial.println(path);
        request->send(LittleFS, "/index.html", "text/html");
      }
    }
  });
  
  // Start server
  server.begin();
  Serial.println("Web server started");
}

// HTML template processor
String processor(const String& var) {
  // Process template variables here
  return String();
}