#ifndef WEB_INTERFACE_H
#define WEB_INTERFACE_H

#include <ESPAsyncWebServer.h>

void setupWebServer(AsyncWebServer* server);
void handleWebSocketMessage(AsyncWebSocket* webSocket, AsyncWebSocketClient* client, 
                           AwsFrameInfo* info, uint8_t* data, size_t len);
String getContentType(String filename);
bool handleFileRead(AsyncWebServerRequest *request);

#endif // WEB_INTERFACE_H
