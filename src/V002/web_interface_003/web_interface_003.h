// web_interface_003.h

#pragma once

#include <ESPAsyncWebServer.h>
#include "json_compat.h"
#include "W10_wifi_if_merge001/W10_wifi_if_merge_002.h"
#include "XY-SKxxx.h"

// 외부 PSU 인스턴스
extern XY_SKxxx* powerSupply;

// 서버 구성
void setupWebServer(AsyncWebServer* server);

// 정적 파일
String getContentType(String filename);
bool   handleFileRead(AsyncWebServerRequest *request);

// PSU 상태 전송
void sendCompletePSUStatus(AsyncWebSocketClient* client);
void sendOperatingModeDetails(AsyncWebSocketClient* client);

// PSU 헬퍼
float  getPSUVoltage(XY_SKxxx* powerSupply);
float  getPSUCurrent(XY_SKxxx* powerSupply);
float  getPSUPower(XY_SKxxx* powerSupply);
bool   isPSUOutputEnabled(XY_SKxxx* powerSupply);
bool   setPSUOutput(XY_SKxxx* powerSupply, bool enable);
String getPSUOperatingMode(XY_SKxxx* powerSupply);
void   getPSUOperatingModeDetails(XY_SKxxx* powerSupply, String& modeName, float& setValue);
