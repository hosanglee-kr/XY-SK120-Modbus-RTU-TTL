#ifndef WEBSERVER_H
#define WEBSERVER_H

#include <Arduino.h>
#include <WiFi.h>

// Define HTTP method constants BEFORE including ESPAsyncWebServer
// These should match the values used by the ESPAsyncWebServer library
#define HTTP_GET     0b00000001
#define HTTP_POST    0b00000010
#define HTTP_DELETE  0b00000100
#define HTTP_PUT     0b00001000
#define HTTP_PATCH   0b00010000
#define HTTP_HEAD    0b00100000
#define HTTP_OPTIONS 0b01000000
#define HTTP_ANY     0b01111111

// Now include the ESPAsyncWebServer headers
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <FS.h>
#include <LittleFS.h>

// Declare global objects (defined in webserver.cpp)
extern AsyncEventSource events;

// Helper function to get content type
String getContentType(const String& path);

// Functions defined in webserver.cpp
void setupWebServer();
String processor(const String& var);
bool handleSourceMap(AsyncWebServerRequest *request);

// Functions defined in main.cpp but used by webserver.cpp
void handleDeviceData(AsyncWebServerRequest *request);
void handleSetVoltage(AsyncWebServerRequest *request);
void handleSetCurrent(AsyncWebServerRequest *request);
void handleToggleOutput(AsyncWebServerRequest *request);

#endif // WEBSERVER_H
