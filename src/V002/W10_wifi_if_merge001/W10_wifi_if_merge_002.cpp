// W10_wifi_if_merge_002.cpp

#include "W10_wifi_if_merge_002.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiManager.h>

// =============================
// Global WiFiManager Instance
// =============================
WiFiManager wifiManager;
WiFiManager& getWiFiManager() { return wifiManager; }
void initWiFiManagerInstance() {
    wifiManager.setDebugOutput(true);
}

// =============================
// WiFi Settings (NVS)
// =============================

// WiFi status JSON
String getWifiStatus() {
    DynamicJsonDocument doc(512);
    doc["status"] = isWiFiConnected() ? "connected" : "disconnected";
    doc["ssid"]   = getWiFiSSID();
    doc["ip"]     = getWiFiIP();
    doc["rssi"]   = getWiFiRSSI();
    doc["mac"]    = getWiFiMAC();

    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

// Sanitize input string
String sanitizeString(const String& input) {
    String result = "";
    for (size_t i = 0; i < input.length(); i++) {
        char c = input.charAt(i);
        if (c >= 32 && c <= 126) result += c;
    }
    return result;
}

// Repair corrupted WiFi credentials
bool repairWiFiCredentials() {
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) return false;
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();

    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    if (deserializeJson(doc, wifiListJson)) {
        prefs.begin(WIFI_NAMESPACE, false);
        prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
        return true;
    }

    if (!doc.is<JsonArray>()) {
        prefs.begin(WIFI_NAMESPACE, false);
        prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
        return true;
    }

    bool needsUpdate = false;
    JsonArray networks = doc.as<JsonArray>();
    for (JsonObject network : networks) {
        String ssid = sanitizeString(network["ssid"].as<String>());
        String password = sanitizeString(network["password"].as<String>());
        if (network["ssid"] != ssid || network["password"] != password) {
            network["ssid"] = ssid;
            network["password"] = password;
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        String cleanJson;
        serializeJson(doc, cleanJson);
        prefs.begin(WIFI_NAMESPACE, false);
        prefs.putString(WIFI_CREDENTIALS_KEY, cleanJson);
        prefs.end();
    }
    return true;
}

// Save WiFi credentials to NVS
bool saveWiFiCredentialsToNVS(const String& ssid, const String& password, int priority) {
    Preferences prefs;
    prefs.begin(WIFI_NAMESPACE, false);
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");

    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    if (deserializeJson(doc, wifiListJson)) {
        doc.clear();
        doc.to<JsonArray>();
    }
    JsonArray wifiList = doc.as<JsonArray>();

    if (priority < 0) priority = wifiList.size() + 1;
    else {
        for (JsonObject net : wifiList) {
            if (net["priority"].as<int>() >= priority) net["priority"] = net["priority"].as<int>() + 1;
        }
    }

    bool exists = false;
    for (JsonObject net : wifiList) {
        if (net["ssid"] == ssid) {
            net["password"] = password;
            net["priority"] = priority;
            exists = true;
            break;
        }
    }

    if (!exists) {
        JsonObject newNet = wifiList.createNestedObject();
        newNet["ssid"] = ssid;
        newNet["password"] = password;
        newNet["priority"] = priority;
    }

    String updated;
    serializeJson(doc, updated);
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
    prefs.end();
    return success;
}

// Load WiFi credentials
String loadWiFiCredentialsFromNVS() {
    Preferences prefs;
    String result = "[]";
    if (prefs.begin(WIFI_NAMESPACE, true)) {
        result = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
    }
    repairWiFiCredentials();
    return result;
}

// Remove WiFi credential
bool removeWiFiCredentialByIndex(int index) {
    Preferences prefs;
    prefs.begin(WIFI_NAMESPACE, false);
    String json = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    if (deserializeJson(doc, json)) { prefs.end(); return false; }
    JsonArray arr = doc.as<JsonArray>();
    if (index < 0 || index >= arr.size()) { prefs.end(); return false; }
    arr.remove(index);
    String updated;
    serializeJson(doc, updated);
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
    prefs.end();
    return success;
}

// Update WiFi priority
bool updateWiFiNetworkPriority(int index, int newPriority) {
    Preferences prefs;
    prefs.begin(WIFI_NAMESPACE, false);
    String json = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");

    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    if (deserializeJson(doc, json)) { prefs.end(); return false; }
    JsonArray arr = doc.as<JsonArray>();

    if (index < 0 || index >= arr.size()) { prefs.end(); return false; }

    struct Net { String ssid; String pass; int prio; };
    std::vector<Net> nets;
    for (JsonObject n : arr) {
        nets.push_back({ n["ssid"].as<String>(), n["password"].as<String>(), n["priority"] | (int)(nets.size()+1) });
    }

    if (newPriority < 1) newPriority = 1;
    if (newPriority > nets.size()) newPriority = nets.size();

    int cur = nets[index].prio;
    nets[index].prio = newPriority;
    for (auto& n : nets) {
        if (cur < newPriority && n.prio > cur && n.prio <= newPriority) n.prio--;
        else if (cur > newPriority && n.prio >= newPriority && n.prio < cur) n.prio++;
    }

    std::sort(nets.begin(), nets.end(), [](auto& a, auto& b){ return a.prio < b.prio; });
    doc.clear();
    JsonArray newArr = doc.to<JsonArray>();
    for (auto& n : nets) {
        JsonObject obj = newArr.createNestedObject();
        obj["ssid"] = n.ssid; obj["password"] = n.pass; obj["priority"] = n.prio;
    }

    String updated;
    serializeJson(doc, updated);
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
    prefs.end();
    return success;
}

// Reset NVS WiFi storage
bool resetWiFiNVS() {
    Preferences prefs;
    if (prefs.begin(WIFI_NAMESPACE, false)) {
        bool success = prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
        return success;
    }
    return false;
}

// =============================
// WiFiManager Wrapper
// =============================
bool isWiFiConnected() { return WiFi.status() == WL_CONNECTED; }
String getWiFiSSID() { return WiFi.SSID(); }
String getWiFiIP() { return WiFi.localIP().toString(); }
int getWiFiRSSI() { return WiFi.RSSI(); }
String getWiFiMAC() { return WiFi.macAddress(); }

void resetWiFiManager() { wifiManager.resetSettings(); }
bool saveWiFiCredentials(const String& ssid, const String& password) { return saveWiFiCredentialsToNVS(ssid, password); }
String loadWiFiCredentials() { return loadWiFiCredentialsFromNVS(); }

// =============================
// WebSocket Handlers (요약)
// =============================
void sendErrorResponse(AsyncWebSocketClient* client, const String& error) {
    DynamicJsonDocument doc(128);
    doc["action"] = "error";
    doc["error"] = error;
    String resp; serializeJson(doc, resp);
    client->text(resp);
}

// handleAddWifiNetworkCommand / handleRemoveWifiNetworkCommand / handleConnectWifiCommand
// → 기존 코드 그대로 유지 (헤더와 시그니처 맞춤)

// =============================
// Single Network Connector
// =============================
bool connectToSingleNetwork(JsonObject network) {
    String ssid = network["ssid"].as<String>();
    String pass = network["password"].as<String>();
    WiFi.begin(ssid.c_str(), pass.c_str());
    int tries = 0;
    while (WiFi.status() != WL_CONNECTED && tries < 20) { delay(500); tries++; }
    return WiFi.status() == WL_CONNECTED;
}
