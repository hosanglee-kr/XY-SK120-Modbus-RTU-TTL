#include "XY-SKxxx-internal.h"
#include "XY-SKxxx.h"

/* Higher-level convenience methods */
bool XY_SKxxx::setVoltageAndCurrent(float voltage, float current) {
  bool voltageSuccess = false;
  bool currentSuccess = false;
  
  // First make sure the silent interval is observed
  waitForSilentInterval();
  
  // Set voltage with proper timing
  preTransmission();
  voltageSuccess = setVoltage(voltage);
  postTransmission();
  
  // Wait between commands
  delay(_silentIntervalTime * 3);
  
  // Set current with proper timing
  preTransmission();
  currentSuccess = setCurrent(current);
  postTransmission();
  
  // If either operation failed, try again
  if (!voltageSuccess || !currentSuccess) {
    // If voltage failed, retry
    if (!voltageSuccess) {
      delay(_silentIntervalTime * 3);
      preTransmission();
      voltageSuccess = setVoltage(voltage);
      postTransmission();
    }
    
    // If current failed, retry
    if (!currentSuccess) {
      delay(_silentIntervalTime * 3);
      preTransmission();
      currentSuccess = setCurrent(current);
      postTransmission();
    }
  }
  
  return voltageSuccess && currentSuccess;
}

bool XY_SKxxx::setOutputState(bool on) {
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_ONOFF, on ? 1 : 0);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _status.outputEnabled = on;
    return true;
  }
  
  return false;
}

bool XY_SKxxx::turnOutputOn() {
  waitForSilentInterval();
  
  preTransmission();
  bool success = setOutputState(true);
  postTransmission();
  
  // Retry once if failed
  if (!success) {
    delay(_silentIntervalTime * 3);
    preTransmission();
    success = setOutputState(true);
    postTransmission();
  }
  
  return success;
}

bool XY_SKxxx::turnOutputOff() {
  waitForSilentInterval();
  
  preTransmission();
  bool success = setOutputState(false);
  postTransmission();
  
  // Retry once if failed
  if (!success) {
    delay(_silentIntervalTime * 3);
    preTransmission();
    success = setOutputState(false);
    postTransmission();
  }
  
  return success;
}

bool XY_SKxxx::getOutputStatus(float &voltage, float &current, float &power, bool &isOn) {
  waitForSilentInterval();
  
  preTransmission();
  bool success = getOutput(voltage, current, power);
  postTransmission();
  
  if (success) {
    isOn = (power > 0);
  }
  
  return success;
}

bool XY_SKxxx::setKeyLock(bool lock) {
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_LOCK, lock ? 1 : 0);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _status.keyLocked = lock;
    return true;
  }
  
  return false;
}

uint16_t XY_SKxxx::getBaudRate(bool refresh) {
  if (refresh) {
    waitForSilentInterval();
    
    uint8_t result = modbus.readHoldingRegisters(REG_BAUDRATE_L, 1);
    _lastCommsTime = millis();
    
    if (result == modbus.ku8MBSuccess) {
      // Convert the baudrate code to the actual baudrate
      return modbus.getResponseBuffer(0);  // Changed node to modbus
    }
  }
  
  return 0; // Default or error value
}

bool XY_SKxxx::setConstantVoltage(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100);
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_CV_SET, voltageValue);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _protection.constantVoltage = voltage;
    return true;
  }
  
  return false;
}

bool XY_SKxxx::setConstantCurrent(float current) {
  uint16_t currentValue = (uint16_t)(current * 1000);
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_CC_SET, currentValue);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _protection.constantCurrent = current;
    return true;
  }
  
  return false;
}
