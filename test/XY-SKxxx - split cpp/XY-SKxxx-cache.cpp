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
  unsigned long now = millis();
  if (!force && (now - _lastStateUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read output state
  waitForSilentInterval();
  preTransmission();
  uint8_t outputResult = node.readHoldingRegisters(REG_ONOFF, 1);
  postTransmission();
  
  if (outputResult == node.ku8MBSuccess) {
    _status.outputEnabled = (node.getResponseBuffer(0) != 0);
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read key lock status
  preTransmission();
  uint8_t lockResult = node.readHoldingRegisters(REG_LOCK, 1);
  postTransmission();
  
  if (lockResult == node.ku8MBSuccess) {
    _status.keyLocked = (node.getResponseBuffer(0) != 0);
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read protection status
  preTransmission();
  uint8_t protResult = node.readHoldingRegisters(REG_PROTECT, 1);
  postTransmission();
  
  if (protResult == node.ku8MBSuccess) {
    _status.protectionStatus = node.getResponseBuffer(0);
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read CC/CV mode
  preTransmission();
  uint8_t cvccResult = node.readHoldingRegisters(REG_CVCC, 1);
  postTransmission();
  
  if (cvccResult == node.ku8MBSuccess) {
    _status.cvccMode = node.getResponseBuffer(0);
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read system status
  preTransmission();
  uint8_t sysResult = node.readHoldingRegisters(REG_SYS_STATUS, 1);
  postTransmission();
  
  if (sysResult == node.ku8MBSuccess) {
    _status.systemStatus = node.getResponseBuffer(0);
  } else {
    result = false;
  }
  
  if (result) {
    _lastStateUpdate = now;
  }
  
  return result;
}

bool XY_SKxxx::updateOutputStatus(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastOutputUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  // Read VOUT, IOUT, POWER, UIN in a single transaction
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.readHoldingRegisters(REG_VOUT, 4);
  postTransmission();
  
  if (result == node.ku8MBSuccess) {
    _status.outputVoltage = (float)node.getResponseBuffer(0) / 100.0;
    _status.outputCurrent = (float)node.getResponseBuffer(1) / 1000.0;
    _status.outputPower = (float)node.getResponseBuffer(2) / 100.0;
    _status.inputVoltage = (float)node.getResponseBuffer(3) / 100.0;
    _lastOutputUpdate = now;
    return true;
  }
  
  return false;
}

// ...continue with other cache update methods...

#endif // XY_SKXXX_CACHE_IMPL
