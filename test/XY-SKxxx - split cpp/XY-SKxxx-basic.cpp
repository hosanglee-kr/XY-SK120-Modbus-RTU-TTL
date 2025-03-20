// Include guard to prevent multiple compilation
#ifndef XY_SKXXX_BASIC_IMPL
#define XY_SKXXX_BASIC_IMPL

#include "XY-SKxxx-internal.h"
#include "XY-SKxxx.h"

uint16_t XY_SKxxx::getModel() {
  uint8_t result = node.readHoldingRegisters(REG_MODEL, 1);
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
}

uint16_t XY_SKxxx::getVersion() {
  uint8_t result = node.readHoldingRegisters(REG_VERSION, 1);
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
}

bool XY_SKxxx::setVoltage(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100);
  
  // Retry up to 3 times if fails
  for (int attempt = 0; attempt < 3; attempt++) {
    uint8_t result = node.writeSingleRegister(REG_V_SET, voltageValue);
    if (result == node.ku8MBSuccess) {
      return true;
    }
    // Wait before retry
    delay(_silentIntervalTime * 2);
  }
  return false;
}

bool XY_SKxxx::setCurrent(float current) {
  uint16_t currentValue = (uint16_t)(current * 1000);
  
  // Retry up to 3 times if fails
  for (int attempt = 0; attempt < 3; attempt++) {
    uint8_t result = node.writeSingleRegister(REG_I_SET, currentValue);
    if (result == node.ku8MBSuccess) {
      return true;
    }
    // Wait before retry
    delay(_silentIntervalTime * 2);
  }
  return false;
}

bool XY_SKxxx::getOutput(float &voltage, float &current, float &power) {
  // More robust implementation with retries
  for (int attempt = 0; attempt < 3; attempt++) {
    uint8_t result = node.readHoldingRegisters(REG_VOUT, 3);
    if (result == node.ku8MBSuccess) {
      voltage = (float)node.getResponseBuffer(0) / 100.0;
      current = (float)node.getResponseBuffer(1) / 1000.0;
      power = (float)node.getResponseBuffer(2) / 100.0;
      return true;
    }
    // Wait before retry
    delay(_silentIntervalTime * 2);
  }
  return false;
}

// ...continue with basic read/write operations...

#endif // XY_SKXXX_BASIC_IMPL
