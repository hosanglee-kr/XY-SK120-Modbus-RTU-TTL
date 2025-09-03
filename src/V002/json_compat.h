// json_compat.h

#pragma once
#include <ArduinoJson.h>

// ArduinoJson v6와 v7을 모두 지원하기 위한 호환 계층
#if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)
    using JsonDoc = JsonDocument;

    // v7에서도 용량 있는 생성자가 존재하므로 그대로 사용 가능
    inline DeserializationError jDeserialize(JsonDoc& doc, const String& s) {
        return deserializeJson(doc, s);
    }
    inline DeserializationError jDeserialize(JsonDoc& doc, const char* data, size_t len) {
        return deserializeJson(doc, data, len);
    }
    inline void jSerialize(const JsonDoc& doc, String& out) {
        serializeJson(doc, out);
    }
    inline void jSerialize(const JsonDoc& doc, Stream& out) {
        serializeJson(doc, out);
    }
    template <typename T>
    inline T jAs(const JsonVariantConst& v) {
        return v.as<T>();
    }
    inline JsonArray jToArray(JsonDoc& d) {
        return d.to<JsonArray>();
    }
#else
    using JsonDoc = DynamicJsonDocument;
    inline DeserializationError jDeserialize(JsonDoc& doc, const String& s) {
        return deserializeJson(doc, s);
    }
    inline DeserializationError jDeserialize(JsonDoc& doc, const char* data, size_t len) {
        return deserializeJson(doc, data, len);
    }
    inline void jSerialize(const JsonDoc& doc, String& out) {
        serializeJson(doc, out);
    }
    inline void jSerialize(const JsonDoc& doc, Stream& out) {
        serializeJson(doc, out);
    }
    template <typename T>
    inline T jAs(const JsonVariantConst& v) {
        return v.as<T>();
    }
    inline JsonArray jToArray(JsonDoc& d) {
        return d.to<JsonArray>();
    }
#endif
