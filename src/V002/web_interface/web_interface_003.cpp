// web_interface_003.cpp

// WebServer와 WiFiManager의 HTTP 메서드 충돌 방지
#define WEBSERVER_H

#include "web_interface_003.h"
#include <FS.h>
#include <LittleFS.h>
#include <Arduino.h>
#include <WiFi.h>
#include <AsyncWebSocket.h>

// 필요시 로그 매크로 대체
#ifndef LOG_INFO
#define LOG_INFO(x)   Serial.println(String("[INFO] ")+x)
#define LOG_ERROR(x)  Serial.println(String("[ERROR] ")+x)
#define LOG_WS(a,b,x) Serial.println(String("[WS] ")+x)
#endif

// 외부 선언
extern XY_SKxxx* powerSupply;

// WS 인스턴스
static AsyncWebSocket ws("/ws");

// 기본 유틸
String getContentType(String filename) {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css"))  return "text/css";
  if (filename.endsWith(".js"))   return "application/javascript";
  if (filename.endsWith(".json")) return "application/json";
  if (filename.endsWith(".png"))  return "image/png";
  if (filename.endsWith(".jpg"))  return "image/jpeg";
  if (filename.endsWith(".ico"))  return "image/x-icon";
  return "text/plain";
}

bool handleFileRead(AsyncWebServerRequest *request) {
  String path = request->url();
  if (path.endsWith("/")) path += "index.html";
  String type = getContentType(path);

  if (LittleFS.exists(path)) { request->send(LittleFS, path, type); return true; }

  // favicon 계열 fall-back
  if (path.endsWith("apple-touch-icon.png") || path.endsWith("apple-touch-icon-precomposed.png") || path.endsWith("favicon.ico")) {
    if (LittleFS.exists("/favicon.ico")) { request->send(LittleFS, "/favicon.ico", "image/x-icon"); return true; }
    request->send(204); return true;
  }
  return false;
}

// PSU 헬퍼
float getPSUVoltage(XY_SKxxx* psu) { float v=0,c=0,p=0; if(psu && psu->testConnection()) psu->getOutput(v,c,p); return v; }
float getPSUCurrent(XY_SKxxx* psu) { float v=0,c=0,p=0; if(psu && psu->testConnection()) psu->getOutput(v,c,p); return c; }
float getPSUPower  (XY_SKxxx* psu) { float v=0,c=0,p=0; if(psu && psu->testConnection()) psu->getOutput(v,c,p); return p; }

bool isPSUOutputEnabled(XY_SKxxx* psu) { return psu && psu->testConnection() ? psu->isOutputEnabled(true) : false; }
bool setPSUOutput(XY_SKxxx* psu, bool enable) {
  if (!psu || !psu->testConnection()) return false;
  return enable ? psu->turnOutputOn() : psu->turnOutputOff();
}

String getPSUOperatingMode(XY_SKxxx* psu) {
  if (!psu || !psu->testConnection()) return "Unknown";
  OperatingMode m = psu->getOperatingMode(true);
  switch(m){case MODE_CV:return "CV";case MODE_CC:return "CC";case MODE_CP:return "CP";default:return "Unknown";}
}

void getPSUOperatingModeDetails(XY_SKxxx* psu, String& modeName, float& setValue) {
  if (!psu || !psu->testConnection()) { modeName="Unknown"; setValue=0; return; }
  OperatingMode m = psu->getOperatingMode(true);
  switch(m){
    case MODE_CV: modeName="Constant Voltage"; setValue=psu->getCachedConstantVoltage(false); break;
    case MODE_CC: modeName="Constant Current"; setValue=psu->getCachedConstantCurrent(false); break;
    case MODE_CP: modeName="Constant Power";   setValue=psu->getCachedConstantPower(false); break;
    default:      modeName="Unknown"; setValue=0; break;
  }
}

static bool isPSUKeyLocked(XY_SKxxx* psu){ return psu ? psu->isKeyLocked(true) : false; }

// 상태 묶음 전송
void sendCompletePSUStatus(AsyncWebSocketClient* client) {
  if (!client || !powerSupply || !powerSupply->testConnection()) return;
  JsonDoc d(1024);
  d["action"]="statusResponse";
  d["connected"]=true;
  d["outputEnabled"]=isPSUOutputEnabled(powerSupply);
  d["voltage"]=getPSUVoltage(powerSupply);
  d["current"]=getPSUCurrent(powerSupply);
  d["power"]=getPSUPower(powerSupply);
  d["operatingMode"]=getPSUOperatingMode(powerSupply);
  String name; float setVal=0; getPSUOperatingModeDetails(powerSupply, name, setVal);
  d["operatingModeName"]=name; d["setValue"]=setVal;
  d["voltageSet"]=powerSupply->getCachedConstantVoltage(false);
  d["currentSet"]=powerSupply->getCachedConstantCurrent(false);
  d["cpModeEnabled"]=powerSupply->isConstantPowerModeEnabled(false);
  d["powerSet"]=powerSupply->getCachedConstantPower(false);
  d["model"]=powerSupply->getModel();
  d["version"]=powerSupply->getVersion();
  d["keyLockEnabled"]=isPSUKeyLocked(powerSupply);
  String out; jSerialize(d, out); client->text(out);
  sendOperatingModeDetails(client);
}

// 동작 모드 전송
void sendOperatingModeDetails(AsyncWebSocketClient* client) {
  if (!client || !powerSupply || !powerSupply->testConnection()) return;
  JsonDoc d(256);
  d["action"]="operatingModeResponse";
  OperatingMode m = powerSupply->getOperatingMode(true);
  String code="Unknown", name="Unknown"; float setVal=0;
  switch(m){
    case MODE_CV: code="CV"; name="Constant Voltage"; setVal=powerSupply->getCachedConstantVoltage(false); break;
    case MODE_CC: code="CC"; name="Constant Current"; setVal=powerSupply->getCachedConstantCurrent(false); break;
    case MODE_CP: code="CP"; name="Constant Power";   setVal=powerSupply->getCachedConstantPower(false); break;
    default: break;
  }
  d["success"]=true; d["modeCode"]=code; d["modeName"]=name; d["setValue"]=setVal;
  d["voltageSet"]=powerSupply->getCachedConstantVoltage(false);
  d["currentSet"]=powerSupply->getCachedConstantCurrent(false);
  bool cp = powerSupply->isConstantPowerModeEnabled(false);
  d["cpModeEnabled"]=cp;
  if (cp) d["powerSet"]=powerSupply->getCachedConstantPower(false);
  String out; jSerialize(d, out); client->text(out);
}

// WS 메시지
static void handleWebSocketMessage(AsyncWebSocket* server, AsyncWebSocketClient* client,
                                   AwsFrameInfo* info, uint8_t* data, size_t len) {
  if (!(info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT)) return;
  data[len]=0;
  String msg = String((char*)data);

  IPAddress clientIP = client->remoteIP();
  IPAddress serverIP = WiFi.localIP();
  LOG_WS(clientIP, serverIP, "RX " + msg);

  JsonDoc doc(1024);
  if (jDeserialize(doc, msg)) { LOG_ERROR("JSON parse error"); return; }
  String action = doc["action"] | "";

  if (action == "ping") { client->text("{\"action\":\"pong\"}"); return; }

  // PSU
  if (action == "getData" || action == "getStatus") { sendCompletePSUStatus(client); return; }

  if (action == "powerOutput") {
    if (powerSupply && powerSupply->testConnection()) {
      bool enable = doc["enable"] | false;
      bool ok = setPSUOutput(powerSupply, enable);
      delay(100);
      JsonDoc r(256);
      r["action"]="powerOutputResponse"; r["success"]=ok; r["enabled"]=isPSUOutputEnabled(powerSupply);
      String out; jSerialize(r, out); client->text(out);
    } else client->text("{\"action\":\"powerOutputResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
    return;
  }
  if (action == "setVoltage") {
    if (powerSupply && powerSupply->testConnection()) {
      float v = doc["voltage"] | 0.0;
      bool ok = powerSupply->setVoltage(v);
      JsonDoc r(256); r["action"]="setVoltageResponse"; r["success"]=ok; r["voltage"]=getPSUVoltage(powerSupply);
      String out; jSerialize(r, out); client->text(out);
    } else client->text("{\"action\":\"setVoltageResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
    return;
  }
  if (action == "setCurrent") {
    if (powerSupply && powerSupply->testConnection()) {
      float c = doc["current"] | 0.0;
      bool ok = powerSupply->setCurrent(c);
      JsonDoc r(256); r["action"]="setCurrentResponse"; r["success"]=ok; r["current"]=getPSUCurrent(powerSupply);
      String out; jSerialize(r, out); client->text(out);
    } else client->text("{\"action\":\"setCurrentResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
    return;
  }
  if (action == "setKeyLock") {
    if (powerSupply && powerSupply->testConnection()) {
      bool lock = doc["lock"] | false;
      bool ok = powerSupply->setKeyLock(lock);
      JsonDoc r(256); r["action"]="keyLockResponse"; r["success"]=ok; r["locked"]=powerSupply->isKeyLocked(true);
      String out; jSerialize(r, out); client->text(out);
    } else client->text("{\"action\":\"keyLockResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
    return;
  }
  if (action == "getKeyLockStatus") {
    JsonDoc r(128); r["action"]="keyLockStatusResponse"; r["success"]=true; r["locked"]=isPSUKeyLocked(powerSupply);
    String out; jSerialize(r, out); client->text(out); return;
  }
  if (action == "setConstantVoltage") {
    if (powerSupply && powerSupply->testConnection()) {
      float v = doc["voltage"] | 0.0;
      bool ok = powerSupply->setConstantVoltage(v);
      JsonDoc r(256); r["action"]="constantVoltageResponse"; r["success"]=ok; r["voltage"]=v;
      String out; jSerialize(r, out); client->text(out); delay(100); sendCompletePSUStatus(client);
    } else client->text("{\"action\":\"constantVoltageResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
    return;
  }
  if (action == "setConstantCurrent") {
    if (powerSupply && powerSupply->testConnection()) {
      float c = doc["current"] | 0.0;
      bool ok = powerSupply->setConstantCurrent(c);
      JsonDoc r(256); r["action"]="constantCurrentResponse"; r["success"]=ok; r["current"]=c;
      String out; jSerialize(r, out); client->text(out); delay(100); sendCompletePSUStatus(client);
    } else client->text("{\"action\":\"constantCurrentResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
    return;
  }
  if (action == "setConstantPower") {
    if (powerSupply && powerSupply->testConnection()) {
      float p = doc["power"] | 0.0;
      bool ok = powerSupply->setConstantPower(p);
      JsonDoc r(256); r["action"]="constantPowerResponse"; r["success"]=ok; r["power"]=p;
      String out; jSerialize(r, out); client->text(out); delay(100); sendCompletePSUStatus(client);
    } else client->text("{\"action\":\"constantPowerResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
    return;
  }
  if (action == "setConstantPowerMode") {
    if (powerSupply && powerSupply->testConnection()) {
      bool en = doc["enable"] | false;
      bool ok = powerSupply->setConstantPowerMode(en);
      JsonDoc r(256); r["action"]="constantPowerModeResponse"; r["success"]=ok; r["enabled"]=powerSupply->isConstantPowerModeEnabled(true);
      String out; jSerialize(r, out); client->text(out); delay(100); sendCompletePSUStatus(client);
    } else client->text("{\"action\":\"constantPowerModeResponse\",\"success\":false,\"error\":\"Power supply not connected\"}");
    return;
  }
  if (action == "getOperatingMode") { sendOperatingModeDetails(client); return; }

  // WiFi
  if (action == "getWifiStatus") {
    String s = getWifiStatus();
    JsonDoc r(512); r["action"]="wifiStatusResponse";
    // 파싱해서 필요한 필드만 그대로 전달
    JsonDoc w(512); jDeserialize(w, s);
    r["status"]=w["status"]; r["ssid"]=w["ssid"]; r["ip"]=w["ip"]; r["rssi"]=w["rssi"]; r["mac"]=w["mac"];
    String out; jSerialize(r, out); client->text(out); return;
  }
  if (action == "addWifiNetwork")  { handleAddWifiNetworkCommand(client, doc); return; }
  if (action == "removeWifiNetwork"){ handleRemoveWifiNetworkCommand(client, doc); return; }
  if (action == "connectWifi")     { handleConnectWifiCommand(client, doc); return; }
  if (action == "saveWifiCredentials") {
    String ssid = doc["ssid"] | ""; String pwd = doc["password"] | "";
    bool ok = saveWiFiCredentialsToNVS(ssid, pwd, 1);
    JsonDoc r(128); r["action"]="saveWifiCredentialsResponse"; r["success"]=ok;
    String out; jSerialize(r, out); client->text(out); return;
  }
  if (action == "loadWifiCredentials") {
    String creds = loadWiFiCredentialsFromNVS();
    JsonDoc r(WIFI_CREDENTIALS_JSON_SIZE+128); r["action"]="loadWifiCredentialsResponse"; r["credentials"]=creds;
    String out; jSerialize(r, out); client->text(out); return;
  }
  if (action == "resetWifi") {
    bool ok = resetWiFi();
    JsonDoc r(128); r["action"]="resetWifiResponse"; r["success"]=ok;
    String out; jSerialize(r, out); client->text(out); return;
  }
}

static void onWsEvent(AsyncWebSocket* server, AsyncWebSocketClient* client,
                      AwsEventType type, void* arg, uint8_t* data, size_t len) {
  switch(type){
    case WS_EVT_CONNECT:    LOG_INFO("WS client #"+String(client->id())+" connected"); break;
    case WS_EVT_DISCONNECT: LOG_INFO("WS client #"+String(client->id())+" disconnected"); break;
    case WS_EVT_DATA:       handleWebSocketMessage(server, client, (AwsFrameInfo*)arg, data, len); break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR: break;
  }
}

void setupWebServer(AsyncWebServer* server) {
  // WebSocket
  ws.onEvent(onWsEvent);
  server->addHandler(&ws);

  // CORS
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

  // 정적 라우트
  server->on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(LittleFS, "/index.html", "text/html");
  });
  server->on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(LittleFS, "/style.css", "text/css");
  });
  server->on("/main.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(LittleFS, "/main.js", "application/javascript");
  });

  // API
  server->on("/api/data", HTTP_GET, [](AsyncWebServerRequest *request){
    JsonDoc d(512);
    if (powerSupply && powerSupply->testConnection()) {
      float v=0,c=0,p=0; powerSupply->getOutput(v,c,p);
      d["outputEnabled"]=powerSupply->isOutputEnabled(true);
      d["voltage"]=v; d["current"]=c; d["power"]=p;
    }
    String out; jSerialize(d, out);
    request->send(200, "application/json", out);
  });

  server->on("/api/config", HTTP_GET, [](AsyncWebServerRequest *request){
    // 프로젝트의 config_manager와 연결되어 있다면 채워 넣으세요
    // 여기서는 예시 구조만
    JsonDoc d(512);
    d["deviceName"]="XY-SK120";
    d["updateInterval"]=1000;
    String out; jSerialize(d, out);
    request->send(200, "application/json", out);
  });

  server->on("/health", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/plain", "OK");
  });
  server->on("/ping", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/plain", "pong");
  });

  // 정적 파일 핸들러
  server->onNotFound([](AsyncWebServerRequest *request){
    if (!handleFileRead(request)) request->send(404, "text/plain", "File Not Found");
  });

  LOG_INFO("Web server configured");
}
