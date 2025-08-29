#ifndef WEB_INTERFACE_H
#define WEB_INTERFACE_H

#include <ESPAsyncWebServer.h>
#include "XY-SKxxx.h"  // Keep this include to fix the compilation error

void setupWebServer(AsyncWebServer* server);
void handleWebSocketMessage(AsyncWebSocket* webSocket, AsyncWebSocketClient* client, 
                           AwsFrameInfo* info, uint8_t* data, size_t len);
String getContentType(String filename);
bool handleFileRead(AsyncWebServerRequest *request);

// New unified status functions
void sendCompletePSUStatus(AsyncWebSocketClient* client);
void sendOperatingModeDetails(AsyncWebSocketClient* client);

// PSU helper functions
float getPSUVoltage(XY_SKxxx* powerSupply);
float getPSUCurrent(XY_SKxxx* powerSupply);
float getPSUPower(XY_SKxxx* powerSupply);
bool isPSUOutputEnabled(XY_SKxxx* powerSupply);
bool setPSUOutput(XY_SKxxx* powerSupply, bool enable);
String getPSUOperatingMode(XY_SKxxx* powerSupply);
void getPSUOperatingModeDetails(XY_SKxxx* powerSupply, String& modeName, float& setValue);

#endif // WEB_INTERFACE_H
