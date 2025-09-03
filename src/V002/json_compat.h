// json_compat.h

#pragma once
#include <ArduinoJson.h>

// ------------------- 기본 타입 정의 -------------------
// ArduinoJson v7부터는 DynamicJsonDocument / StaticJsonDocument 대신
// JsonDocument 로 통합되었습니다.
// 기존 코드에서 JsonDoc(size) 형태를 그대로 쓸 수 있게 래핑합니다.

using JsonDoc = ArduinoJson::JsonDocument;

// 메모리 크기를 지정해서 만들던 부분 호환 (ex: JsonDoc doc(512))
// → v7에서는 JsonDocument() 기본 생성 후 .memoryPool().setCapacity() 필요
//   하지만 ArduinoJson v7은 내부적으로 자동 확장 가능하므로,
//   단순히 기본 생성만 하도록 정의합니다.
inline JsonDoc makeJsonDoc(size_t /*capacity*/ = 0) {
    return JsonDoc();
}

// 매크로로 기존 코드 호환
#define JsonDoc(capacity) decltype(makeJsonDoc(capacity))()


// ------------------- 직렬화/역직렬화 -------------------
inline bool jDeserialize(JsonDoc& doc, const String& data) {
    auto err = deserializeJson(doc, data);
    return err != DeserializationError::Ok;
}

inline bool jSerialize(JsonDoc& doc, String& out) {
    serializeJson(doc, out);
    return true;
}


// ------------------- containsKey 호환 -------------------
// v7에서는 obj.containsKey("key") deprecated
// 대체: !obj["key"].isNull()
template <typename TObject>
inline bool compatContainsKey(TObject& obj, const char* key) {
    return !obj[key].isNull();
}

// 매크로로 기존 코드 리다이렉트
#define containsKey(key) compatContainsKey(*this, key)


// ------------------- createNestedObject 호환 -------------------
// v7에서는 arr.createNestedObject() deprecated
// 대체: arr.add<JsonObject>()
template <typename TArray>
inline ArduinoJson::JsonObject compatCreateNestedObject(TArray& arr) {
    return arr.add<ArduinoJson::JsonObject>();
}

// 매크로로 기존 코드 리다이렉트
#define createNestedObject() compatCreateNestedObject(*this)
