// W10_wifi_if_merge_003.h

#pragma once

#include <Arduino.h>
#include <WiFi.h>

////W #include <WiFiManager.h>

#include <ESPAsyncWebServer.h>
#include <Preferences.h>
#include <vector>
#include <algorithm>
#include <ArduinoJson.h>

// NVS 키
#define WIFI_NAMESPACE            "wificonfig"
#define WIFI_CREDENTIALS_KEY      "credentials"
#define WIFI_CREDENTIALS_JSON_SIZE 2048
#define MAX_SAVED_NETWORKS        10

// 전역 WiFiManager 인스턴스 접근자
// class WiFiManager;
// extern WiFiManager wifiManager;
// WiFiManager& getWiFiManager();

void initWiFiManagerInstance();

// 유틸
String sanitizeString(const String& input);

// 상태 조회
bool   isWiFiConnected();
String getWiFiSSID();
String getWiFiIP();
int    getWiFiRSSI();
String getWiFiMAC();
String getWifiStatus();            // JSON 문자열로 상태 반환

static bool repairWiFiCredentials();

// 저장소 조작
String loadWiFiCredentialsFromNVS();
bool   saveWiFiCredentialsToNVS(const String& ssid, const String& password, int priority);
bool   removeWiFiCredentialByIndex(int index);
bool   updateWiFiNetworkPriority(int index, int newPriority);
bool   resetWiFi();                // WiFiManager 설정 초기화 호출 래퍼

// WiFiManager 연동
bool initWiFiManager(const char* apName);
bool initWiFiManager(const char* apName, const char* apPassword);
bool connectToSavedNetworks();
void resetWiFiSettings();
bool exitConfigPortal();
void processWiFiManagerCredentials();
void syncCurrentWiFiToStorage();
void saveWifiCallback();

// WiFiManager 헬퍼
// bool   updateSavedWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm);
// String getWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm);

// 전역 오버로드
bool   updateSavedWiFiPasswordFromWiFiManager(const String& ssid);
String getWiFiPasswordFromWiFiManager(const String& ssid);

// WebSocket 핸들러
void sendErrorResponse(AsyncWebSocketClient* client, const String& error);
void handleAddWifiNetworkCommand(AsyncWebSocketClient* client, JsonDocument& doc);
void handleRemoveWifiNetworkCommand(AsyncWebSocketClient* client, JsonDocument& doc);
void handleConnectWifiCommand(AsyncWebSocketClient* client, JsonDocument& doc);
