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
  uint8_t result = node.writeSingleRegister(REG_ONOFF, on ? 1 : 0);
  return (result == node.ku8MBSuccess);
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
  // 1 is lock, 0 is unlock
  uint8_t result = node.writeSingleRegister(REG_LOCK, lock ? 1 : 0);
  return (result == node.ku8MBSuccess);
}

uint16_t XY_SKxxx::getBaudRate(bool refresh) {
  if (refresh) {
    waitForSilentInterval();
    preTransmission();
    uint8_t result = node.readHoldingRegisters(REG_BAUDRATE_L, 1);
    postTransmission();
    
    if (result == node.ku8MBSuccess) {
      return node.getResponseBuffer(0);
    }
  }
  return 0; // Default or error value
}

bool XY_SKxxx::setConstantVoltage(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100); // 2 decimal places
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_CV_SET, voltageValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setConstantCurrent(float current) {
  uint16_t currentValue = (uint16_t)(current * 1000); // 3 decimal places
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_CC_SET, currentValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}
