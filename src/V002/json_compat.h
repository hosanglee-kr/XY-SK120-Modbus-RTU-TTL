// json_compat.h

#pragma once
#include <ArduinoJson.h>

// v7 호환용 alias
using JsonDoc = ArduinoJson::DynamicJsonDocument;

// 직렬화 헬퍼
inline void jSerialize(JsonDoc& doc, String& out) {
    out.clear();
    serializeJson(doc, out);
}

inline bool jDeserialize(JsonDoc& doc, const String& in) {
    DeserializationError err = deserializeJson(doc, in);
    return err != DeserializationError::Ok;
}

// ------------------- containsKey 호환 -------------------
// ArduinoJson v7에서는 containsKey() deprecated → obj[key].isNull() 체크 사용
template <typename TObject>
inline bool compatContainsKey(TObject& obj, const char* key) {
    return !obj[key].isNull();
}

// 기존 코드 그대로 동작하도록 매크로 정의
#define containsKey(key) compatContainsKey(*this, key)


// ------------------- createNestedObject 호환 -------------------
// ArduinoJson v7에서는 createNestedObject() deprecated → add<JsonObject>() 사용
template <typename TArray>
inline ArduinoJson::JsonObject compatCreateNestedObject(TArray& arr) {
    return arr.add<ArduinoJson::JsonObject>();
}

// 기존 코드 그대로 동작하도록 매크로 정의
#define createNestedObject() compatCreateNestedObject(*this)

