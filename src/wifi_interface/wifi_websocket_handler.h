#pragma once

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

// Function declarations
void handleAddWifiNetworkCommand(AsyncWebSocketClient* client, DynamicJsonDocument& doc);
void sendErrorResponse(AsyncWebSocketClient* client, const String& error);
