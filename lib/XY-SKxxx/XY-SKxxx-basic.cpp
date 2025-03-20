// Include guard to prevent multiple compilation
#ifndef XY_SKXXX_BASIC_IMPL
#define XY_SKXXX_BASIC_IMPL

#include "XY-SKxxx-internal.h"
#include "XY-SKxxx.h"

uint16_t XY_SKxxx::getModel() {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_MODEL, 1);
  if (result == modbus.ku8MBSuccess) {
    _lastCommsTime = millis();
    return modbus.getResponseBuffer(0);
  }
  
  _lastCommsTime = millis();
  return 0;
}

uint16_t XY_SKxxx::getVersion() {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_VERSION, 1);
  if (result == modbus.ku8MBSuccess) {
    _lastCommsTime = millis();
    return modbus.getResponseBuffer(0);
  }
  
  _lastCommsTime = millis();
  return 0;
}

bool XY_SKxxx::setVoltage(float voltage) {
  if (voltage >= 0.0f && voltage <= 30.0f) { // Adjust based on your device's specifications
    uint16_t voltageValue = (uint16_t)(voltage * 100);
    waitForSilentInterval();
    uint8_t result = modbus.writeSingleRegister(REG_V_SET, voltageValue);
    _lastCommsTime = millis();
    
    if (result == modbus.ku8MBSuccess) {
      _status.setVoltage = voltage;
      return true;
    }
  }
  return false;
}

bool XY_SKxxx::setCurrent(float current) {
  if (current >= 0.0f && current <= 5.1f) { // Adjust based on your device's specifications
    uint16_t currentValue = (uint16_t)(current * 1000);
    waitForSilentInterval();
    uint8_t result = modbus.writeSingleRegister(REG_I_SET, currentValue);
    _lastCommsTime = millis();
    
    if (result == modbus.ku8MBSuccess) {
      _status.setCurrent = current;
      return true;
    }
  }
  return false;
}

bool XY_SKxxx::getOutput(float &voltage, float &current, float &power) {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_VOUT, 3);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    voltage = modbus.getResponseBuffer(0) / 100.0f;
    current = modbus.getResponseBuffer(1) / 1000.0f;
    power = modbus.getResponseBuffer(2) / 100.0f;
    return true;
  }
  
  return false;
}

// ...continue with basic read/write operations...

#endif // XY_SKXXX_BASIC_IMPL
