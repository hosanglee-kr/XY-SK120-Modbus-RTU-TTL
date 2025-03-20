#ifndef XY_SKXXX_CACHE_IMPL
#define XY_SKXXX_CACHE_IMPL

#include "XY-SKxxx-internal.h"
#include "XY-SKxxx.h"

/* Status cache update methods */
bool XY_SKxxx::updateAllStatus(bool force) {
  bool success = true;
  
  // Check if enough time has passed since last update or if forced
  unsigned long now = millis();
  
  // Update all status components
  success &= updateOutputStatus(force);
  delay(_silentIntervalTime * 2);
  
  success &= updateDeviceSettings(force);
  delay(_silentIntervalTime * 2);
  
  success &= updateEnergyMeters(force);
  delay(_silentIntervalTime * 2);
  
  success &= updateTemperatures(force);
  delay(_silentIntervalTime * 2);
  
  success &= updateDeviceState(force);
  
  _cacheValid = success;
  
  return success;
}

bool XY_SKxxx::updateDeviceState(bool force) {
  // Check if update is needed based on timeout or force flag
  unsigned long now = millis();
  if (!force && (now - _lastStateUpdate < _cacheTimeout)) {
    return true;
  }
  
  bool success = true;  // Add success flag to track overall operation success
  waitForSilentInterval();
  
  // Read output state
  uint8_t outputResult = modbus.readHoldingRegisters(REG_ONOFF, 1);
  if (outputResult == modbus.ku8MBSuccess) {
    _status.outputEnabled = (modbus.getResponseBuffer(0) != 0);
  } else {
    _lastCommsTime = millis();
    return false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read key lock status
  preTransmission();
  uint8_t lockResult = modbus.readHoldingRegisters(REG_LOCK, 1);
  postTransmission();
  
  if (lockResult == modbus.ku8MBSuccess) {
    _status.keyLocked = (modbus.getResponseBuffer(0) != 0);
  } else {
    success = false;  // Use success instead of undeclared result
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read protection status
  preTransmission();
  uint8_t protResult = modbus.readHoldingRegisters(REG_PROTECT, 1);
  postTransmission();
  
  if (protResult == modbus.ku8MBSuccess) {
    _status.protectionStatus = modbus.getResponseBuffer(0);
  } else {
    success = false;  // Use success instead of undeclared result
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read CC/CV mode
  preTransmission();
  uint8_t cvccResult = modbus.readHoldingRegisters(REG_CVCC, 1);
  postTransmission();
  
  if (cvccResult == modbus.ku8MBSuccess) {
    _status.cvccMode = modbus.getResponseBuffer(0);
  } else {
    success = false;  // Use success instead of undeclared result
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read system status
  preTransmission();
  uint8_t sysResult = modbus.readHoldingRegisters(REG_SYS_STATUS, 1);
  postTransmission();
  
  if (sysResult == modbus.ku8MBSuccess) {
    _status.systemStatus = modbus.getResponseBuffer(0);
  } else {
    success = false;  // Use success instead of undeclared result
  }
  
  if (success) {  // Use success instead of undeclared result
    _lastStateUpdate = now;
  }
  
  return success;  // Use success instead of undeclared result
}

bool XY_SKxxx::updateOutputStatus(bool force) {
  // Check if update is needed based on timeout or force flag
  unsigned long now = millis();
  if (!force && (now - _lastOutputUpdate < _cacheTimeout)) {
    return true;
  }
  
  waitForSilentInterval();
  
  // Read output voltage, current, power, and input voltage
  uint8_t result = modbus.readHoldingRegisters(REG_VOUT, 4);
  if (result == modbus.ku8MBSuccess) {
    _status.outputVoltage = modbus.getResponseBuffer(0) / 100.0f;
    _status.outputCurrent = modbus.getResponseBuffer(1) / 1000.0f;
    _status.outputPower = modbus.getResponseBuffer(2) / 100.0f;
    _status.inputVoltage = modbus.getResponseBuffer(3) / 100.0f;
    
    _lastOutputUpdate = now;
    _cacheValid = true;
    _lastCommsTime = millis();
    return true;
  }
  
  _lastCommsTime = millis();
  return false;
}

// ...continue with other cache update methods...

#endif // XY_SKXXX_CACHE_IMPL
