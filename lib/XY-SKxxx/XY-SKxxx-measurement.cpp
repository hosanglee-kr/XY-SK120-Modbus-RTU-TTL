#include "XY-SKxxx-internal.h"
#include "XY-SKxxx.h"

/* Cached value access methods */
float XY_SKxxx::getOutputVoltage(bool refresh) {
  if (refresh) {
    updateOutputStatus(true);
  }
  return _status.outputVoltage;
}

float XY_SKxxx::getOutputCurrent(bool refresh) {
  if (refresh) {
    updateOutputStatus(true);
  }
  return _status.outputCurrent;
}

float XY_SKxxx::getOutputPower(bool refresh) {
  if (refresh) {
    updateOutputStatus(true);
  }
  return _status.outputPower;
}

float XY_SKxxx::getInputVoltage(bool refresh) {
  if (refresh) {
    updateOutputStatus(true);
  }
  return _status.inputVoltage;
}

/* Check if the power supply is in CC or CV mode */
bool XY_SKxxx::isInConstantCurrentMode(bool refresh) {
  if (refresh) {
    updateDeviceState(true);
  }
  return (_status.cvccMode == 1);
}

bool XY_SKxxx::isInConstantVoltageMode(bool refresh) {
  if (refresh) {
    updateDeviceState(true);
  }
  return (_status.cvccMode == 0);
}

// Non-cached versions for backward compatibility
float XY_SKxxx::getInputVoltage() {
  return getInputVoltage(false);
}

uint32_t XY_SKxxx::getAmpHours() {
  return getAmpHours(false);
}

uint32_t XY_SKxxx::getWattHours() {
  return getWattHours(false);
}

uint32_t XY_SKxxx::getOutputTime() {
  return getOutputTime(false);
}

float XY_SKxxx::getInternalTemperature() {
  return getInternalTemperature(false);
}

float XY_SKxxx::getExternalTemperature() {
  return getExternalTemperature(false);
}

uint16_t XY_SKxxx::getProtectionStatus() {
  return getProtectionStatus(false);
}

uint16_t XY_SKxxx::getCVCCState() {
  if (updateDeviceState(false)) {
    return _status.cvccMode;
  }
  return 0;
}
