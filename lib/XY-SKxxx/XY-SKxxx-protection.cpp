#include "XY-SKxxx-internal.h"
#include "XY-SKxxx.h"

// Basic protection thresholds
bool XY_SKxxx::setOverVoltageProtection(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100);
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_S_OVP, voltageValue);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _protection.overVoltageProtection = voltage;
    return true;
  }
  
  return false;
}

bool XY_SKxxx::getOverVoltageProtection(float &voltage) {
  voltage = getCachedOverVoltageProtection(true);
  return true;
}

// ...continue with other protection methods...
