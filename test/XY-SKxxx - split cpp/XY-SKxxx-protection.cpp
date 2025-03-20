#include "XY-SKxxx-internal.h"
#include "XY-SKxxx.h"

/* Protection settings methods */
bool XY_SKxxx::setOverVoltageProtection(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100);
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_OVP, voltageValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverVoltageProtection(float &voltage) {
  voltage = getCachedOverVoltageProtection(true);
  return true;
}

// ...continue with other protection methods...
