


// W10_wifi_if_merge_003.cpp

#include "W10_wifi_if_merge_003.h"

#include <Arduino.h>
#include <Preferences.h>

// // 전역 인스턴스 구현
// WiFiManager  wifiManager;
// WiFiManager& getWiFiManager() {
//     return wifiManager;
// }
// void initWiFiManagerInstance() {
//     wifiManager.setDebugOutput(true);
// }

// 입력 문자열 정화
String sanitizeString(const String& input) {
    String result;
    result.reserve(input.length());
    for (size_t i = 0; i < input.length(); i++) {
        char c = input.charAt(i);
        if (c >= 32 && c <= 126) result += c;
    }
    return result;
}

// 상태 조회
bool isWiFiConnected() {
    return WiFi.status() == WL_CONNECTED;
}
String getWiFiSSID() {
    return WiFi.SSID();
}
String getWiFiIP() {
    return WiFi.localIP().toString();
}
int getWiFiRSSI() {
    return WiFi.RSSI();
}
String getWiFiMAC() {
    return WiFi.macAddress();
}

String getWifiStatus() {
    JsonDocument doc;
    doc["status"] = isWiFiConnected() ? "connected" : "disconnected";
    doc["ssid"]   = getWiFiSSID();
    doc["ip"]     = getWiFiIP();
    doc["rssi"]   = getWiFiRSSI();
    doc["mac"]    = getWiFiMAC();
    String out;
    serializeJson(doc, out);
    return out;
}

// 손상된 JSON 복구
static bool repairWiFiCredentials() {
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) return false;
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();

    JsonDocument doc;
    if (deserializeJson(doc, wifiListJson)) {
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
            prefs.end();
            return true;
        }
        return false;
    }
    if (!doc.is<JsonArray>()) {
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
            prefs.end();
            return true;
        }
        return false;
    }
    bool      needsUpdate = false;
    JsonArray arr         = doc.as<JsonArray>();
    for (JsonObject o : arr) {
        if (o.containsKey("ssid") && o.containsKey("password")) {
            String s = sanitizeString(o["ssid"].as<String>());
            String p = sanitizeString(o["password"].as<String>());
            if (s != o["ssid"].as<String>() || p != o["password"].as<String>()) {
                o["ssid"]     = s;
                o["password"] = p;
                needsUpdate   = true;
            }
        }
    }
    if (needsUpdate) {
        String updated;
        serializeJson(doc, updated);
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            bool ok = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
            prefs.end();
            return ok;
        }
    }
    return true;
}

// NVS 로드
String loadWiFiCredentialsFromNVS() {
    Preferences prefs;
    String      result = "[]";
    if (prefs.begin(WIFI_NAMESPACE, true)) {
        result = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
    }
    repairWiFiCredentials();
    if (prefs.begin(WIFI_NAMESPACE, true)) {
        result = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
    }
    return result;
}

// NVS 저장
bool saveWiFiCredentialsToNVS(const String& ssid, const String& password, int priority = -1) {
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) return false;
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();

    JsonDocument doc;
    if (deserializeJson(doc, wifiListJson)) {
        doc.clear();
        jToArray(doc);
    }
    JsonArray wifiList = doc.is<JsonArray>() ? doc.as<JsonArray>() : jToArray(doc);

    if (priority <= 0) priority = wifiList.size() + 1;

    bool exists = false;
    for (JsonObject n : wifiList) {
        if (n["ssid"].as<String>() == ssid) {
            n["password"] = password;
            n["priority"] = priority;
            exists        = true;
            break;
        }
    }
    if (!exists) {
        JsonObject nn  = wifiList.createNestedObject();
        nn["ssid"]     = ssid;
        nn["password"] = password;
        nn["priority"] = priority;
    }

    // 정렬
    struct NI {
        String s;
        String p;
        int    pr;
    };
    std::vector<NI> v;
    for (JsonObject n : wifiList) {
        v.push_back({n["ssid"].as<String>(), n["password"].as<String>(), n["priority"] | 9999});
    }
    std::sort(v.begin(), v.end(), [](const NI& a, const NI& b) { return a.pr < b.pr; });

    doc.clear();
    JsonArray outArr = jToArray(doc);
    for (auto& n : v) {
        JsonObject o  = outArr.createNestedObject();
        o["ssid"]     = n.s;
        o["password"] = n.p;
        o["priority"] = n.pr;
    }

    String updated;
    serializeJson(doc, updated);
    if (updated.length() > WIFI_CREDENTIALS_JSON_SIZE) return false;

    if (prefs.begin(WIFI_NAMESPACE, false)) {
        bool ok = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
        prefs.end();
        return ok;
    }
    return false;
}

bool removeWiFiCredentialByIndex(int index) {
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) return false;
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();

    JsonDocument doc;
    if (deserializeJson(doc, wifiListJson)) return false;
    if (!doc.is<JsonArray>()) return false;

    JsonArray arr = doc.as<JsonArray>();
    if (index < 0 || index >= (int)arr.size()) return false;
    arr.remove(index);

    String updated;
    serializeJson(doc, updated);
    if (!prefs.begin(WIFI_NAMESPACE, false)) return false;
    bool ok = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
    prefs.end();
    return ok;
}

bool updateWiFiNetworkPriority(int index, int newPriority) {
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) return false;
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();

    JsonDocument doc;
    if (deserializeJson(doc, wifiListJson)) return false;
    if (!doc.is<JsonArray>()) return false;

    struct NI {
        String s;
        String p;
        int    pr;
    };
    std::vector<NI> v;
    JsonArray       arr = doc.as<JsonArray>();
    for (JsonObject n : arr) {
        v.push_back({n["ssid"].as<String>(), n["password"].as<String>(), n["priority"] | ((int)v.size() + 1)});
    }
    if (index < 0 || index >= (int)v.size()) return false;

    if (newPriority < 1) newPriority = 1;
    if (newPriority > (int)v.size()) newPriority = v.size();

    int cur = v[index].pr;
    if (cur == newPriority) return true;

    for (auto& n : v) {
        if (n.pr == cur)
            n.pr = newPriority;
        else if (cur < newPriority) {
            if (n.pr > cur && n.pr <= newPriority) n.pr--;
        } else {
            if (n.pr >= newPriority && n.pr < cur) n.pr++;
        }
    }

    std::sort(v.begin(), v.end(), [](const NI& a, const NI& b) { return a.pr < b.pr; });

    doc.clear();
    JsonArray outArr = jToArray(doc);
    for (auto& n : v) {
        JsonObject o  = outArr.createNestedObject();
        o["ssid"]     = n.s;
        o["password"] = n.p;
        o["priority"] = n.pr;
    }

    String updated;
    serializeJson(doc, updated);
    if (!prefs.begin(WIFI_NAMESPACE, false)) return false;
    bool ok = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
    prefs.end();
    return ok;
}

// WiFiManager 콜백 플래그
static bool wifiCredentialsSaved = false;
void saveWifiCallback() {
    wifiCredentialsSaved = true;
    syncCurrentWiFiToStorage();
}

void processWiFiManagerCredentials() {
    if (!wifiCredentialsSaved) return;
    String ssid = WiFi.SSID();
    String pass = WiFi.psk();
    if (ssid.length()) {
        saveWiFiCredentialsToNVS(ssid, pass.length() ? pass : "placeholder_", 1);
    }
    wifiCredentialsSaved = false;
}

void syncCurrentWiFiToStorage() {
    if (WiFi.status() != WL_CONNECTED) return;
    String ssid = WiFi.SSID();
    if (!ssid.length()) return;

    String json = loadWiFiCredentialsFromNVS();
    if (json == "[]") {
        JsonDocument    doc;
        JsonArray  arr = jToArray(doc);
        JsonObject o   = arr.createNestedObject();
        o["ssid"]      = ssid;
        o["password"]  = "placeholder_";
        o["priority"]  = 1;
        String out;
        serializeJson(doc, out);
        Preferences prefs;
        if (prefs.begin(WIFI_NAMESPACE, false)) {
            prefs.putString(WIFI_CREDENTIALS_KEY, out);
            prefs.end();
        }
        return;
    }
    JsonDocument doc;
    if (deserializeJson(doc, json)) return;
    JsonArray arr = doc.as<JsonArray>();
    for (JsonObject o : arr) {
        if (o["ssid"].as<String>() == ssid) return;
    }
    for (JsonObject o : arr) {
        o["priority"] = (o["priority"] | 0) + 1;
    }
    JsonObject n  = arr.createNestedObject();
    n["ssid"]     = ssid;
    n["password"] = "placeholder_";
    n["priority"] = 1;
    String out;
    serializeJson(doc, out);
    Preferences prefs;
    if (prefs.begin(WIFI_NAMESPACE, false)) {
        prefs.putString(WIFI_CREDENTIALS_KEY, out);
        prefs.end();
    }
}

bool connectToSavedNetworks() {
    // 1차 시도 내부 저장 자격증명
    WiFi.begin();
    for (int i = 0; WiFi.status() != WL_CONNECTED && i < 20; ++i) {
        delay(500);
    }
    if (WiFi.status() == WL_CONNECTED) {
        syncCurrentWiFiToStorage();
        return true;
    }
    // 2차 NVS 목록 순차 시도
    String json = loadWiFiCredentialsFromNVS();
    if (json == "[]") return false;

    JsonDocument doc;
    if (deserializeJson(doc, json)) return false;
    JsonArray arr = doc.as<JsonArray>();

    struct NI {
        String s;
        String p;
        int    pr;
    };
    std::vector<NI> v;
    for (JsonObject n : arr) {
        v.push_back({n["ssid"].as<String>(), n["password"].as<String>(), n["priority"] | ((int)v.size() + 1)});
    }
    std::sort(v.begin(), v.end(), [](const NI& a, const NI& b) { return a.pr < b.pr; });

    for (auto& n : v) {
        if (n.p.startsWith("placeholder_")) continue;
        WiFi.begin(n.s.c_str(), n.p.c_str());
        for (int i = 0; WiFi.status() != WL_CONNECTED && i < 20; ++i) {
            delay(500);
        }
        if (WiFi.status() == WL_CONNECTED) return true;
    }
    return false;
}

bool initWiFiManager(const char* apName) {
    // WiFi.mode(WIFI_STA);
    // wifiManager.setConfigPortalTimeout(180);
    // wifiManager.setSaveConfigCallback(saveWifiCallback);
    // WiFiManagerParameter custom_device_name("deviceName", "Device Name", "XY-SK120", 40);
    // wifiManager.addParameter(&custom_device_name);
    // if (!connectToSavedNetworks()) {
    //   bool res = wifiManager.autoConnect(apName);
    //   if (res) syncCurrentWiFiToStorage();
    //   return res;
    // }
    return true;
}

bool initWiFiManager(const char* apName, const char* apPassword) {
    // wifiManager.setDebugOutput(true);
    // wifiManager.setAPStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
    // WiFi.setTxPower(WIFI_POWER_19_5dBm);
    // wifiManager.setConfigPortalTimeout(300);
    // wifiManager.setMinimumSignalQuality(10);
    // wifiManager.setSaveConfigCallback(saveWifiCallback);
    // wifiManager.setCustomHeadElement("<style>body{background:#f8f9fa;font-family:Arial}</style>");
    // wifiManager.setWiFiAPChannel(1);
    // wifiManager.setScanDispPerc(true);

    // bool res = (apPassword && strlen(apPassword)) ? wifiManager.autoConnect(apName, apPassword) : wifiManager.autoConnect(apName);
    // if (res) {
    //   delay(1000);
    //   processWiFiManagerCredentials();
    //   syncCurrentWiFiToStorage();
    // }
    return res;
}

bool exitConfigPortal() {
    // processWiFiManagerCredentials();
    // bool ok = wifiManager.stopConfigPortal();
    // WiFi.softAPdisconnect(true);
    // WiFi.mode(WIFI_STA);
    // return ok;
}

void resetWiFiSettings() {
    // wifiManager.resetSettings();
}
bool resetWiFi() {
    resetWiFiSettings();
    return true;
}

// // WiFiManager 비번 동기화
// bool updateSavedWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm) {
//     String connectedSSID = WiFi.SSID();
//     String pass;
//     if (connectedSSID == ssid)
//         pass = wm.getWiFiPass(true);
//     else if (wm.getWiFiSSID(true) == ssid)
//         pass = wm.getWiFiPass(true);
//     if (!pass.length()) return false;

//     Preferences prefs;
//     if (!prefs.begin(WIFI_NAMESPACE, true)) return false;
//     String json = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
//     prefs.end();

//     JsonDocument doc;
//     if (deserializeJson(doc, json)) {
//         doc.clear();
//         JsonArray  a  = jToArray(doc);
//         JsonObject o  = a.createNestedObject();
//         o["ssid"]     = ssid;
//         o["password"] = pass;
//         o["priority"] = 1;
//     } else {
//         bool      found = false;
//         JsonArray a     = doc.as<JsonArray>();
//         for (JsonObject n : a) {
//             if (n["ssid"] == ssid) {
//                 n["password"] = pass;
//                 found         = true;
//                 break;
//             }
//         }
//         if (!found) {
//             JsonObject o  = a.createNestedObject();
//             o["ssid"]     = ssid;
//             o["password"] = pass;
//             o["priority"] = a.size() + 1;
//         }
//     }
//     String updated;
//     serializeJson(doc, updated);
//     if (!prefs.begin(WIFI_NAMESPACE, false)) return false;
//     bool ok = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
//     prefs.end();
//     return ok;
// }

// String getWiFiPasswordFromWiFiManager(const String& ssid, WiFiManager& wm) {
//     String s = wm.getWiFiSSID(true);
//     if (s == ssid) return wm.getWiFiPass(true);
//     return "";
// }

// // 전역 오버로드
// bool updateSavedWiFiPasswordFromWiFiManager(const String& ssid) {
//     return updateSavedWiFiPasswordFromWiFiManager(ssid, wifiManager);
// }
// String getWiFiPasswordFromWiFiManager(const String& ssid) {
//     return getWiFiPasswordFromWiFiManager(ssid, wifiManager);
// }

// WebSocket 에러 응답
void sendErrorResponse(AsyncWebSocketClient* client, const String& error) {
    JsonDocument v_jsondoc;
    v_jsondoc["action"] = "error";
    v_jsondoc["error"]  = error;
    String out;
    serializeJson(v_jsondoc, out);
    client->text(out);
}

// WebSocket 명령
void handleAddWifiNetworkCommand(AsyncWebSocketClient* client, JsonDocument& doc) {
    if (!doc.containsKey("ssid") || !doc.containsKey("password")) {
        sendErrorResponse(client, "Missing SSID or password");
        return;
    }
    String      ssid     = sanitizeString(doc["ssid"].as<String>());
    String      pwd      = sanitizeString(doc["password"].as<String>());
    int         priority = doc.containsKey("priority") ? doc["priority"].as<int>() : 1;

    // NVS 읽기
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) {
        sendErrorResponse(client, "NVS open failed");
        return;
    }
    String json = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();

    JsonDocument wdoc;
    if (deserializeJson(wdoc, json)) {
        wdoc.clear();
        jToArray(wdoc);
    }
    JsonArray nets   = wdoc.is<JsonArray>() ? wdoc.as<JsonArray>() : jToArray(wdoc);

    bool      exists = false;
    for (JsonObject n : nets) {
        if (n["ssid"].as<String>() == ssid) {
            n["password"] = pwd;
            n["priority"] = priority;
            exists        = true;
            break;
        }
    }
    if (!exists) {
        JsonObject n  = nets.createNestedObject();
        n["ssid"]     = ssid;
        n["password"] = pwd;
        n["priority"] = priority;
    }

    String updated;
    serializeJson(wdoc, updated);
    bool ok = false;
    if (prefs.begin(WIFI_NAMESPACE, false)) {
        ok = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
        prefs.end();
    }

    JsonDocument resp;
    resp["action"]  = "addWifiNetworkResponse";
    resp["success"] = ok;
    resp["ssid"]    = ssid;
    String out;
    serializeJson(resp, out);
    client->text(out);

    if (ok && WiFi.status() == WL_CONNECTED && WiFi.SSID() == ssid) {
        // updateSavedWiFiPasswordFromWiFiManager(ssid, wifiManager);
    }
}

void handleRemoveWifiNetworkCommand(AsyncWebSocketClient* client, JsonDocument& in) {
    if (!in.containsKey("index")) {
        sendErrorResponse(client, "Missing index");
        return;
    }
    int         index = in["index"].as<int>();

    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) {
        sendErrorResponse(client, "NVS open failed");
        return;
    }
    String json = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();

    JsonDocument wdoc;
    if (deserializeJson(wdoc, json)) {
        sendErrorResponse(client, "Parse error");
        return;
    }
    if (!wdoc.is<JsonArray>()) {
        sendErrorResponse(client, "Bad format");
        return;
    }

    JsonArray nets = wdoc.as<JsonArray>();
    if (index < 0 || index >= (int)nets.size()) {
        sendErrorResponse(client, "Invalid index");
        return;
    }
    nets.remove(index);

    String updated;
    serializeJson(wdoc, updated);
    bool ok = false;
    if (prefs.begin(WIFI_NAMESPACE, false)) {
        ok = prefs.putString(WIFI_CREDENTIALS_KEY, updated);
        prefs.end();
    }

    JsonDocument resp;
    resp["action"]  = "removeWifiNetworkResponse";
    resp["success"] = ok;
    resp["index"]   = index;
    String out;
    serializeJson(resp, out);
    client->text(out);
}

void handleConnectWifiCommand(AsyncWebSocketClient* client, JsonDocument& in) {
    if (!in.containsKey("ssid")) {
        sendErrorResponse(client, "Missing SSID");
        return;
    }
    String      ssid = sanitizeString(in["ssid"].as<String>());

    // NVS에서 비번 찾기
    Preferences prefs;
    if (!prefs.begin(WIFI_NAMESPACE, true)) {
        sendErrorResponse(client, "NVS open failed");
        return;
    }
    String json = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();

    String  pwd;
    JsonDocument wdoc;
    if (!deserializeJson(wdoc, json) && wdoc.is<JsonArray>()) {
        for (JsonObject n : wdoc.as<JsonArray>()) {
            if (n["ssid"].as<String>() == ssid) {
                pwd = n["password"].as<String>();
                break;
            }
        }
    }
    if (!pwd.length()) {
        sendErrorResponse(client, "Network not found");
        return;
    }

    if (WiFi.status() == WL_CONNECTED) {
        WiFi.disconnect();
        delay(500);
    }
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pwd.c_str());

    int t = 30;
    while (WiFi.status() != WL_CONNECTED && t-- > 0) {
        delay(1000);
    }

    bool    ok = WiFi.status() == WL_CONNECTED;
    JsonDocument resp;
    resp["action"]  = "connectWifiResponse";
    resp["success"] = ok;
    resp["ssid"]    = ssid;
    if (ok) {
        resp["ip"]   = WiFi.localIP().toString();
        resp["rssi"] = WiFi.RSSI();
        //// updateSavedWiFiPasswordFromWiFiManager(ssid, wifiManager);
    } else {
        resp["error"] = "Failed to connect";
    }
    String out;
    serializeJson(resp, out);
    client->text(out);
}
