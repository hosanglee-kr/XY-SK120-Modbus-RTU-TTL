#ifndef CONFIG_MANAGER_H
#define CONFIG_MANAGER_H

#include <Arduino.h>
#include <ArduinoJson.h>

struct DeviceConfig {
  uint8_t modbusId;
  uint32_t baudRate;
  uint8_t dataBits;
  uint8_t parity;
  uint8_t stopBits;
  uint16_t updateInterval;
  char deviceName[32];
};

bool loadConfig();
bool saveConfig();
DeviceConfig& getConfig();

#endif // CONFIG_MANAGER_H
