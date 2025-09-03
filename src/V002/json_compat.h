// json_compat.h

#pragma once
#include <ArduinoJson.h>

// ArduinoJson v6와 v7을 모두 지원하기 위한 호환 계층
#if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)

// v7: JsonDocument는 capacity 생성자가 없음
// 따라서 우리가 직접 wrapper 클래스를 하나 만들어 준다
class JsonDoc : public JsonDocument {
public:
    JsonDoc() : JsonDocument() {}                 // 기본 생성자
    JsonDoc(size_t) : JsonDocument() {}           // v6 스타일과 호환되는 dummy 생성자
};

#else
// v6: DynamicJsonDocument 그대로 사용
using JsonDoc = DynamicJsonDocument;

#endif

// 공통 함수들
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
