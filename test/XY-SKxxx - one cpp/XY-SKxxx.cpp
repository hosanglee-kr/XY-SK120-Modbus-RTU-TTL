#include "XY-SKxxx.h"

/* Initialize static member */
XY_SKxxx* XY_SKxxx::_instance = nullptr;

XY_SKxxx::XY_SKxxx(uint8_t rxPin, uint8_t txPin, uint8_t slaveID)
  : _rxPin(rxPin), _txPin(txPin), slaveID(slaveID), _lastCommsTime(0), _silentIntervalTime(0),
    _lastOutputUpdate(0), _lastSettingsUpdate(0), _lastEnergyUpdate(0), _lastTempUpdate(0), 
    _lastStateUpdate(0), _lastConstantVCUpdate(0), _lastVoltageCurrentProtectionUpdate(0),
    _lastPowerProtectionUpdate(0), _lastEnergyProtectionUpdate(0), _lastTempProtectionUpdate(0),
    _lastStartupSettingUpdate(0), _cacheTimeout(5000), _cacheValid(false) {
  // Store instance pointer for static callback use
  _instance = this;
  
  // Initialize device status with default values
  memset(&_status, 0, sizeof(DeviceStatus));
  memset(&_protection, 0, sizeof(ProtectionSettings));
}

/* Modbus RTU methods */
void XY_SKxxx::begin(long baudRate) {
  _baudRate = baudRate;
  _silentIntervalTime = silentInterval(baudRate);
  
  // Initialize hardware serial for XIAO ESP32S3
  Serial1.begin(baudRate, SERIAL_8N1, _rxPin, _txPin);
  
  // Initialize ModbusMaster with Serial1
  node.begin(slaveID, Serial1);
  
  // Set up pre and post transmission callbacks using static functions
  node.preTransmission(staticPreTransmission);
  node.postTransmission(staticPostTransmission);
}

/* Functions to read and write device registers */ 
/* following the order of the register address map in the XY-SKxxx protocol document.
For registers that has both read and write access, there will be 
a get() and set() method for each register.
*/

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

bool XY_SKxxx::getOutput(float &voltage, float &current, float &power) {
  // More robust implementation with retries
  for (int attempt = 0; attempt < 3; attempt++) {
    uint8_t result = node.readHoldingRegisters(REG_VOUT, 3);
    if (result == node.ku8MBSuccess) {
      voltage = (float)node.getResponseBuffer(0) / 100.0;
      current = (float)node.getResponseBuffer(1) / 1000.0;
      power = (float)node.getResponseBuffer(2) / 100.0;  // Fixed: 2 decimal places;  // <- This is correct
      return true;
    }
    // Wait before retry
    delay(_silentIntervalTime * 2);
  }
  return false;
}

float XY_SKxxx::getInputVoltage() {
  uint8_t result = node.readHoldingRegisters(REG_UIN, 1);
  if (result == node.ku8MBSuccess) {
    return (float)node.getResponseBuffer(0) / 100.0;
  }
  return 0.0;
}

uint32_t XY_SKxxx::getAmpHours() {
  uint8_t result = node.readHoldingRegisters(REG_AH_LOW, 2);
  if (result == node.ku8MBSuccess) {
    uint32_t ah = node.getResponseBuffer(0) | (node.getResponseBuffer(1) << 16);
    return ah;
  }
  return 0;
}

uint32_t XY_SKxxx::getWattHours() {
  uint8_t result = node.readHoldingRegisters(REG_WH_LOW, 2);
  if (result == node.ku8MBSuccess) {
    uint32_t wh = node.getResponseBuffer(0) | (node.getResponseBuffer(1) << 16);
    return wh;
  }
  return 0;
}

uint32_t XY_SKxxx::getOutputTime() {
  uint8_t result = node.readHoldingRegisters(REG_OUT_H, 3);
  if (result == node.ku8MBSuccess) {
    uint32_t hours = node.getResponseBuffer(0);
    uint32_t minutes = node.getResponseBuffer(1);
    uint32_t seconds = node.getResponseBuffer(2);
    return (hours * 3600) + (minutes * 60) + seconds;
  }
  return 0;
}

float XY_SKxxx::getInternalTemperature() {
  uint8_t result = node.readHoldingRegisters(REG_T_IN, 1);
  if (result == node.ku8MBSuccess) {
    return (float)node.getResponseBuffer(0) / 10.0;
  }
  return 0.0;
}

float XY_SKxxx::getExternalTemperature() {
  uint8_t result = node.readHoldingRegisters(REG_T_EX, 1);
  if (result == node.ku8MBSuccess) {
    return (float)node.getResponseBuffer(0) / 10.0;
  }
  return 0.0;
}

bool XY_SKxxx::setKeyLock(bool lock) {
  // 1 is lock, 0 is unlock
  uint8_t result = node.writeSingleRegister(REG_LOCK, lock ? 1 : 0);
  return (result == node.ku8MBSuccess);
}

uint16_t XY_SKxxx::getProtectionStatus() {
  uint8_t result = node.readHoldingRegisters(REG_PROTECT, 1);
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
}

uint16_t XY_SKxxx::getCVCCState() {
  uint8_t result = node.readHoldingRegisters(REG_CVCC, 1);
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
}

bool XY_SKxxx::setOutputState(bool on) {
  uint8_t result = node.writeSingleRegister(REG_ONOFF, on ? 1 : 0);
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setBacklightBrightness(uint8_t level) {
  uint8_t result = node.writeSingleRegister(REG_B_LED, level);
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setSleepTimeout(uint8_t minutes) {
  uint8_t result = node.writeSingleRegister(REG_SLEEP, minutes);
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setSlaveAddress(uint8_t address) {
  uint8_t result = node.writeSingleRegister(REG_SLAVE_ADDR, address);
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setBaudRate(uint8_t baudRate) {
  uint8_t result = node.writeSingleRegister(REG_BAUDRATE_L, baudRate);
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setInternalTempCalibration(float offset) {
  uint16_t offsetValue = (uint16_t)(offset * 10);
  uint8_t result = node.writeSingleRegister(REG_T_IN_CAL, offsetValue);
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setExternalTempCalibration(float offset) {
  uint16_t offsetValue = (uint16_t)(offset * 10);
  uint8_t result = node.writeSingleRegister(REG_T_EXT_CAL, offsetValue);
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setBuzzer(bool on) {
  uint8_t result = node.writeSingleRegister(REG_BUZZER, on ? 1 : 0);
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setDataGroup(uint8_t group) {
  uint8_t result = node.writeSingleRegister(REG_EXTRACT_M, group);
  return (result == node.ku8MBSuccess);
}

/* Modbus RTU timing methods */
unsigned long XY_SKxxx::silentInterval(unsigned long baudRate) {
  // 3.5 character times = 3.5 * (11 bits/character)
  // 11 bits = 1 start bit + 8 data bits + 1 parity bit + 1 stop bit in Modbus-RTU asynchronous transmission
  float characterTime = 1000.0 / (float)(baudRate / 11.0); // Milliseconds per character
  return (unsigned long)(3.5 * characterTime);
}

void XY_SKxxx::waitForSilentInterval() {
  unsigned long elapsed = millis() - _lastCommsTime;
  // Use a longer wait time to ensure device is ready
  if (elapsed < (_silentIntervalTime * 2) && _lastCommsTime > 0) {
    // Need to wait for the remaining silent interval time
    delay((_silentIntervalTime * 2) - elapsed);
  }
}

bool XY_SKxxx::preTransmission() {
  waitForSilentInterval();
  return true;
}

bool XY_SKxxx::postTransmission() {
  _lastCommsTime = millis();
  return true;
}

void XY_SKxxx::staticPreTransmission() {
  if (_instance) {
    _instance->preTransmission();
  }
}

void XY_SKxxx::staticPostTransmission() {
  if (_instance) {
    _instance->postTransmission();
  }
}

/* Higher-level convenience methods */
bool XY_SKxxx::setVoltageAndCurrent(float voltage, float current) {
  bool voltageSuccess = false;
  bool currentSuccess = false;
  
  // First make sure the silent interval is observed
  waitForSilentInterval();
  
  // Set voltage with proper timing
  preTransmission(); // Use preTransmission instead of beginTransmission
  voltageSuccess = setVoltage(voltage);
  postTransmission(); // Use postTransmission instead of endTransmission
  
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

bool XY_SKxxx::testConnection() {
  waitForSilentInterval();
  
  preTransmission();
  uint16_t model = getModel();
  postTransmission();
  
  return model > 0; // Return true if we got a valid model number
}

/* Constant Voltage (CV) methods */
bool XY_SKxxx::setConstantVoltage(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100); // 2 decimal places
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_CV_SET, voltageValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getConstantVoltage(float &voltage) {
  voltage = getCachedConstantVoltage(true); // Force refresh from device
  return true; // Assuming the refresh succeeded
}

/* Constant Current (CC) methods */
bool XY_SKxxx::setConstantCurrent(float current) {
  uint16_t currentValue = (uint16_t)(current * 1000); // 3 decimal places
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_CC_SET, currentValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getConstantCurrent(float &current) {
  current = getCachedConstantCurrent(true); // Force refresh from device
  return true; // Assuming the refresh succeeded
}

/* Check if the power supply is in CC or CV mode */
// These implementations need to be updated to match the declared function signatures
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

/* VLP (input under-voltage protection) methods */
bool XY_SKxxx::setUnderVoltageProtection(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100);
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_VLP, voltageValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getUnderVoltageProtection(float &voltage) {
  voltage = getCachedUnderVoltageProtection(true);
  return true;
}

/*OVP (over-voltage protection) methods */
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

/* OCP (over-current protection) methods */
bool XY_SKxxx::setOverCurrentProtection(float current) {
  uint16_t currentValue = (uint16_t)(current * 1000);
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_OCP, currentValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverCurrentProtection(float &current) {
  current = getCachedOverCurrentProtection(true);
  return true;
}

/* OPP (over-power protection) methods */
bool XY_SKxxx::setOverPowerProtection(float power) {
  uint16_t powerValue = (uint16_t)(power * 100);
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_OPP, powerValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverPowerProtection(float &power) {
  power = getCachedOverPowerProtection(true);
  return true;
}

/* OHP (output high power protection) methods */
bool XY_SKxxx::setHighPowerProtectionTime(uint16_t hours, uint16_t minutes) {
  waitForSilentInterval();
  
  // Set hours register
  preTransmission();
  uint8_t resultHours = node.writeSingleRegister(REG_S_OHP_H, hours);
  postTransmission();
  
  delay(_silentIntervalTime * 2);
  
  // Set minutes register
  preTransmission();
  uint8_t resultMinutes = node.writeSingleRegister(REG_S_OHP_M, minutes);
  postTransmission();
  
  return (resultHours == node.ku8MBSuccess && resultMinutes == node.ku8MBSuccess);
}

bool XY_SKxxx::getHighPowerProtectionTime(uint16_t &hours, uint16_t &minutes) {
  getCachedHighPowerProtectionTime(hours, minutes, true);
  return true;
}

/* OAH (over-amp-hour protection) methods */
bool XY_SKxxx::setOverAmpHourProtection(uint16_t ampHoursLow, uint16_t ampHoursHigh) {
  waitForSilentInterval();
  
  // Set low register
  preTransmission();
  uint8_t resultLow = node.writeSingleRegister(REG_S_OAH_L, ampHoursLow);
  postTransmission();
  
  delay(_silentIntervalTime * 2);
  
  // Set high register
  preTransmission();
  uint8_t resultHigh = node.writeSingleRegister(REG_S_OAH_H, ampHoursHigh);
  postTransmission();
  
  return (resultLow == node.ku8MBSuccess && resultHigh == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverAmpHourProtection(uint16_t &ampHoursLow, uint16_t &ampHoursHigh) {
  getCachedOverAmpHourProtection(ampHoursLow, ampHoursHigh, true);
  return true;
}

/* OWH (over-watt-hour protection) methods */
bool XY_SKxxx::setOverWattHourProtection(uint16_t wattHoursLow, uint16_t wattHoursHigh) {
  waitForSilentInterval();
  
  // Set low register
  preTransmission();
  uint8_t resultLow = node.writeSingleRegister(REG_S_OWH_L, wattHoursLow);
  postTransmission();
  
  delay(_silentIntervalTime * 2);
  
  // Set high register
  preTransmission();
  uint8_t resultHigh = node.writeSingleRegister(REG_S_OWH_H, wattHoursHigh);
  postTransmission();
  
  return (resultLow == node.ku8MBSuccess && resultHigh == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverWattHourProtection(uint16_t &wattHoursLow, uint16_t &wattHoursHigh) {
  getCachedOverWattHourProtection(wattHoursLow, wattHoursHigh, true);
  return true;
}

/* REGS_S_OTP (Over Temperature Protection) methods */
bool XY_SKxxx::setOverTemperatureProtection(float temperature) {
  uint16_t tempValue = (uint16_t)(temperature * 10); // 1 decimal place
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_OTP, tempValue);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverTemperatureProtection(float &temperature) {
  temperature = getCachedOverTemperatureProtection(true);
  return true;
}

/* WIP: Power-on initialization setting methods */
bool XY_SKxxx::setPowerOnInitialization(bool outputOnAtStartup) {
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_INI, outputOnAtStartup ? 1 : 0);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getPowerOnInitialization(bool &outputOnAtStartup) {
  outputOnAtStartup = getCachedPowerOnInitialization(true);
  return true;
}

/* Temperature unit methods */
bool XY_SKxxx::setTemperatureUnit(bool celsius) {
  waitForSilentInterval();
  preTransmission();
  // Value: 0 for Celsius, 1 for Fahrenheit
  uint8_t result = node.writeSingleRegister(REG_F_C, celsius ? 0 : 1);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getTemperatureUnit(bool &celsius) {
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.readHoldingRegisters(REG_F_C, 1);
  postTransmission();
  if (result == node.ku8MBSuccess) {
    celsius = (node.getResponseBuffer(0) == 0);  // 0 is Celsius, 1 is Fahrenheit
    return true;
  }
  return false;
}

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

bool XY_SKxxx::updateOutputStatus(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastOutputUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  // Read VOUT, IOUT, POWER, UIN in a single transaction
  // This is possible if REG_VOUT through REG_UIN are consecutive (0x0002-0x0005)
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.readHoldingRegisters(REG_VOUT, 4); // Read 4 registers starting at REG_VOUT
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

bool XY_SKxxx::updateDeviceSettings(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastSettingsUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read voltage setting
  waitForSilentInterval();
  preTransmission();
  uint8_t voltageResult = node.readHoldingRegisters(REG_V_SET, 1);
  postTransmission();
  
  if (voltageResult == node.ku8MBSuccess) {
    _status.setVoltage = (float)node.getResponseBuffer(0) / 100.0;
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read current setting
  preTransmission();
  uint8_t currentResult = node.readHoldingRegisters(REG_I_SET, 1);
  postTransmission();
  
  if (currentResult == node.ku8MBSuccess) {
    _status.setCurrent = (float)node.getResponseBuffer(0) / 1000.0;
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read backlight level
  preTransmission();
  uint8_t backlightResult = node.readHoldingRegisters(REG_B_LED, 1);
  postTransmission();
  
  if (backlightResult == node.ku8MBSuccess) {
    _status.backlightLevel = node.getResponseBuffer(0);
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read sleep timeout
  preTransmission();
  uint8_t sleepResult = node.readHoldingRegisters(REG_SLEEP, 1);
  postTransmission();
  
  if (sleepResult == node.ku8MBSuccess) {
    _status.sleepTimeout = node.getResponseBuffer(0);
  } else {
    result = false;
  }
  
  if (result) {
    _lastSettingsUpdate = now;
  }
  
  return result;
}

bool XY_SKxxx::updateEnergyMeters(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastEnergyUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read amp-hours
  waitForSilentInterval();
  preTransmission();
  uint8_t ahResult = node.readHoldingRegisters(REG_AH_LOW, 2);
  postTransmission();
  
  if (ahResult == node.ku8MBSuccess) {
    _status.ampHours = node.getResponseBuffer(0) | (node.getResponseBuffer(1) << 16);
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read watt-hours
  preTransmission();
  uint8_t whResult = node.readHoldingRegisters(REG_WH_LOW, 2);
  postTransmission();
  
  if (whResult == node.ku8MBSuccess) {
    _status.wattHours = node.getResponseBuffer(0) | (node.getResponseBuffer(1) << 16);
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read output time
  preTransmission();
  uint8_t timeResult = node.readHoldingRegisters(REG_OUT_H, 3);
  postTransmission();
  
  if (timeResult == node.ku8MBSuccess) {
    uint32_t hours = node.getResponseBuffer(0);
    uint32_t minutes = node.getResponseBuffer(1);
    uint32_t seconds = node.getResponseBuffer(2);
    _status.outputTime = (hours * 3600) + (minutes * 60) + seconds;
  } else {
    result = false;
  }
  
  if (result) {
    _lastEnergyUpdate = now;
  }
  
  return result;
}

bool XY_SKxxx::updateTemperatures(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastTempUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read internal temperature
  waitForSilentInterval();
  preTransmission();
  uint8_t intTempResult = node.readHoldingRegisters(REG_T_IN, 1);
  postTransmission();
  
  if (intTempResult == node.ku8MBSuccess) {
    _status.internalTemp = (float)node.getResponseBuffer(0) / 10.0;
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read external temperature
  preTransmission();
  uint8_t extTempResult = node.readHoldingRegisters(REG_T_EX, 1);
  postTransmission();
  
  if (extTempResult == node.ku8MBSuccess) {
    _status.externalTemp = (float)node.getResponseBuffer(0) / 10.0;
  } else {
    result = false;
  }
  
  if (result) {
    _lastTempUpdate = now;
  }
  
  return result;
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

uint32_t XY_SKxxx::getAmpHours(bool refresh) {
  if (refresh) {
    updateEnergyMeters(true);
  }
  return _status.ampHours;
}

uint32_t XY_SKxxx::getWattHours(bool refresh) {
  if (refresh) {
    updateEnergyMeters(true);
  }
  return _status.wattHours;
}

uint32_t XY_SKxxx::getOutputTime(bool refresh) {
  if (refresh) {
    updateEnergyMeters(true);
  }
  return _status.outputTime;
}

float XY_SKxxx::getInternalTemperature(bool refresh) {
  if (refresh) {
    updateTemperatures(true);
  }
  return _status.internalTemp;
}

float XY_SKxxx::getExternalTemperature(bool refresh) {
  if (refresh) {
    updateTemperatures(true);
  }
  return _status.externalTemp;
}

bool XY_SKxxx::isOutputEnabled(bool refresh) {
  if (refresh) {
    updateDeviceState(true);
  }
  return _status.outputEnabled;
}

bool XY_SKxxx::isKeyLocked(bool refresh) {
  if (refresh) {
    updateDeviceState(true);
  }
  return _status.keyLocked;
}

uint16_t XY_SKxxx::getProtectionStatus(bool refresh) {
  if (refresh) {
    updateDeviceState(true);
  }
  return _status.protectionStatus;
}

float XY_SKxxx::getSetVoltage(bool refresh) {
  if (refresh) {
    updateDeviceSettings(true);
  }
  return _status.setVoltage;
}

float XY_SKxxx::getSetCurrent(bool refresh) {
  if (refresh) {
    updateDeviceSettings(true);
  }
  return _status.setCurrent;
}

/* Protection settings cache update methods */
bool XY_SKxxx::updateAllProtectionSettings(bool force) {
  bool success = true;
  
  // Update all protection components
  success &= updateConstantVoltageCurrentSettings(force);
  delay(_silentIntervalTime * 2);
  
  success &= updateVoltageCurrentProtection(force);
  delay(_silentIntervalTime * 2);
  
  success &= updatePowerProtection(force);
  delay(_silentIntervalTime * 2);
  
  success &= updateEnergyProtection(force);
  delay(_silentIntervalTime * 2);
  
  success &= updateTemperatureProtection(force);
  delay(_silentIntervalTime * 2);
  
  success &= updateStartupSetting(force);
  
  return success;
}

bool XY_SKxxx::updateConstantVoltageCurrentSettings(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastConstantVCUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read constant voltage setting
  waitForSilentInterval();
  preTransmission();
  uint8_t cvResult = node.readHoldingRegisters(REG_CV_SET, 1);
  postTransmission();
  
  if (cvResult == node.ku8MBSuccess) {
    _protection.constantVoltage = (float)node.getResponseBuffer(0) / 100.0; // 2 decimal places
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read constant current setting
  preTransmission();
  uint8_t ccResult = node.readHoldingRegisters(REG_CC_SET, 1);
  postTransmission();
  
  if (ccResult == node.ku8MBSuccess) {
    _protection.constantCurrent = (float)node.getResponseBuffer(0) / 1000.0; // 3 decimal places
  } else {
    result = false;
  }
  
  if (result) {
    _lastConstantVCUpdate = now;
  }
  
  return result;
}

bool XY_SKxxx::updateVoltageCurrentProtection(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastVoltageCurrentProtectionUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read under voltage protection
  waitForSilentInterval();
  preTransmission();
  uint8_t vlpResult = node.readHoldingRegisters(REG_S_VLP, 1);
  postTransmission();
  
  if (vlpResult == node.ku8MBSuccess) {
    _protection.underVoltageProtection = (float)node.getResponseBuffer(0) / 100.0; // 2 decimal places
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read over voltage protection
  preTransmission();
  uint8_t ovpResult = node.readHoldingRegisters(REG_S_OVP, 1);
  postTransmission();
  
  if (ovpResult == node.ku8MBSuccess) {
    _protection.overVoltageProtection = (float)node.getResponseBuffer(0) / 100.0; // 2 decimal places
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read over current protection
  preTransmission();
  uint8_t ocpResult = node.readHoldingRegisters(REG_S_OCP, 1);
  postTransmission();
  
  if (ocpResult == node.ku8MBSuccess) {
    _protection.overCurrentProtection = (float)node.getResponseBuffer(0) / 1000.0; // 3 decimal places
  } else {
    result = false;
  }
  
  if (result) {
    _lastVoltageCurrentProtectionUpdate = now;
  }
  
  return result;
}

bool XY_SKxxx::updatePowerProtection(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastPowerProtectionUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read over power protection
  waitForSilentInterval();
  preTransmission();
  uint8_t oppResult = node.readHoldingRegisters(REG_S_OPP, 1);
  postTransmission();
  
  if (oppResult == node.ku8MBSuccess) {
    _protection.overPowerProtection = (float)node.getResponseBuffer(0) / 100.0; // 2 decimal places
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read high power protection hours
  preTransmission();
  uint8_t ohpHResult = node.readHoldingRegisters(REG_S_OHP_H, 1);
  postTransmission();
  
  if (ohpHResult == node.ku8MBSuccess) {
    _protection.highPowerHours = node.getResponseBuffer(0); // 0 decimal places
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read high power protection minutes
  preTransmission();
  uint8_t ohpMResult = node.readHoldingRegisters(REG_S_OHP_M, 1);
  postTransmission();
  
  if (ohpMResult == node.ku8MBSuccess) {
    _protection.highPowerMinutes = node.getResponseBuffer(0); // 0 decimal places
  } else {
    result = false;
  }
  
  if (result) {
    _lastPowerProtectionUpdate = now;
  }
  
  return result;
}

bool XY_SKxxx::updateEnergyProtection(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastEnergyProtectionUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read over amp-hour protection low
  waitForSilentInterval();
  preTransmission();
  uint8_t oahLResult = node.readHoldingRegisters(REG_S_OAH_L, 1);
  postTransmission();
  
  if (oahLResult == node.ku8MBSuccess) {
    _protection.overAmpHoursLow = node.getResponseBuffer(0); // 0 decimal places
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read over amp-hour protection high
  preTransmission();
  uint8_t oahHResult = node.readHoldingRegisters(REG_S_OAH_H, 1);
  postTransmission();
  
  if (oahHResult == node.ku8MBSuccess) {
    _protection.overAmpHoursHigh = node.getResponseBuffer(0); // 0 decimal places
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read over watt-hour protection low
  preTransmission();
  uint8_t owhLResult = node.readHoldingRegisters(REG_S_OWH_L, 1);
  postTransmission();
  
  if (owhLResult == node.ku8MBSuccess) {
    _protection.overWattHoursLow = node.getResponseBuffer(0); // 0 decimal places
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read over watt-hour protection high
  preTransmission();
  uint8_t owhHResult = node.readHoldingRegisters(REG_S_OWH_H, 1);
  postTransmission();
  
  if (owhHResult == node.ku8MBSuccess) {
    _protection.overWattHoursHigh = node.getResponseBuffer(0); // 0 decimal places
  } else {
    result = false;
  }
  
  if (result) {
    _lastEnergyProtectionUpdate = now;
  }
  
  return result;
}

bool XY_SKxxx::updateTemperatureProtection(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastTempProtectionUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read over temperature protection
  waitForSilentInterval();
  preTransmission();
  uint8_t otpResult = node.readHoldingRegisters(REG_S_OTP, 1);
  postTransmission();
  
  if (otpResult == node.ku8MBSuccess) {
    _protection.overTemperature = (float)node.getResponseBuffer(0) / 10.0; // 1 decimal place
    _lastTempProtectionUpdate = now;
    result = true;
  } else {
    result = false;
  }
  
  return result;
}

bool XY_SKxxx::updateStartupSetting(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastStartupSettingUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read power-on initialization setting
  waitForSilentInterval();
  preTransmission();
  uint8_t iniResult = node.readHoldingRegisters(REG_S_INI, 1);
  postTransmission();
  
  if (iniResult == node.ku8MBSuccess) {
    _protection.outputOnAtStartup = (node.getResponseBuffer(0) != 0);
    _lastStartupSettingUpdate = now;
    result = true;
  } else {
    result = false;
  }
  
  return result;
}

/* Cached protection value access methods */
float XY_SKxxx::getCachedConstantVoltage(bool refresh) {
  if (refresh) {
    updateConstantVoltageCurrentSettings(true);
  }
  return _protection.constantVoltage;
}

float XY_SKxxx::getCachedConstantCurrent(bool refresh) {
  if (refresh) {
    updateConstantVoltageCurrentSettings(true);
  }
  return _protection.constantCurrent;
}

float XY_SKxxx::getCachedUnderVoltageProtection(bool refresh) {
  if (refresh) {
    updateVoltageCurrentProtection(true);
  }
  return _protection.underVoltageProtection;
}

float XY_SKxxx::getCachedOverVoltageProtection(bool refresh) {
  if (refresh) {
    updateVoltageCurrentProtection(true);
  }
  return _protection.overVoltageProtection;
}

float XY_SKxxx::getCachedOverCurrentProtection(bool refresh) {
  if (refresh) {
    updateVoltageCurrentProtection(true);
  }
  return _protection.overCurrentProtection;
}

float XY_SKxxx::getCachedOverPowerProtection(bool refresh) {
  if (refresh) {
    updatePowerProtection(true);
  }
  return _protection.overPowerProtection;
}

void XY_SKxxx::getCachedHighPowerProtectionTime(uint16_t &hours, uint16_t &minutes, bool refresh) {
  if (refresh) {
    updatePowerProtection(true);
  }
  hours = _protection.highPowerHours;
  minutes = _protection.highPowerMinutes;
}

void XY_SKxxx::getCachedOverAmpHourProtection(uint16_t &ampHoursLow, uint16_t &ampHoursHigh, bool refresh) {
  if (refresh) {
    updateEnergyProtection(true);
  }
  ampHoursLow = _protection.overAmpHoursLow;
  ampHoursHigh = _protection.overAmpHoursHigh;
}

void XY_SKxxx::getCachedOverWattHourProtection(uint16_t &wattHoursLow, uint16_t &wattHoursHigh, bool refresh) {
  if (refresh) {
    updateEnergyProtection(true);
  }
  wattHoursLow = _protection.overWattHoursLow;
  wattHoursHigh = _protection.overWattHoursHigh;
}

float XY_SKxxx::getCachedOverTemperatureProtection(bool refresh) {
  if (refresh) {
    updateTemperatureProtection(true);
  }
  return _protection.overTemperature;
}

bool XY_SKxxx::getCachedPowerOnInitialization(bool refresh) {
  if (refresh) {
    updateStartupSetting(true);
  }
  return _protection.outputOnAtStartup;
}

/* Additional get methods for existing settings */

bool XY_SKxxx::getBacklightBrightness(uint8_t &level, bool refresh) {
  if (refresh || _status.backlightLevel == 0) {
    updateDeviceSettings(true);
  }
  level = _status.backlightLevel;
  return true;
}

uint8_t XY_SKxxx::getSleepTimeout(bool refresh) {
  if (refresh) {
    updateDeviceSettings(true);
  }
  return _status.sleepTimeout;
}

bool XY_SKxxx::getSlaveAddress(uint8_t &address) {
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.readHoldingRegisters(REG_SLAVE_ADDR, 1);
  postTransmission();
  
  if (result == node.ku8MBSuccess) {
    address = node.getResponseBuffer(0);
    return true;
  }
  return false;
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

bool XY_SKxxx::updateCalibrationSettings(bool force) {
  unsigned long now = millis();
  if (!force && (now - _lastCalibrationUpdate < _cacheTimeout)) {
    return true; // Cache is still valid
  }
  
  bool result = true;
  
  // Read internal temperature calibration
  waitForSilentInterval();
  preTransmission();
  uint8_t intCalResult = node.readHoldingRegisters(REG_T_IN_CAL, 1);
  postTransmission();
  
  if (intCalResult == node.ku8MBSuccess) {
    _internalTempCalibration = (float)node.getResponseBuffer(0) / 10.0;
  } else {
    result = false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read external temperature calibration
  preTransmission();
  uint8_t extCalResult = node.readHoldingRegisters(REG_T_EXT_CAL, 1);
  postTransmission();
  
  if (extCalResult == node.ku8MBSuccess) {
    _externalTempCalibration = (float)node.getResponseBuffer(0) / 10.0;
  } else {
    result = false;
  }
  
  if (result) {
    _lastCalibrationUpdate = now;
  }
  
  return result;
}

float XY_SKxxx::getInternalTempCalibration(bool refresh) {
  if (refresh) {
    updateCalibrationSettings(true);
  }
  return _internalTempCalibration;
}

float XY_SKxxx::getExternalTempCalibration(bool refresh) {
  if (refresh) {
    updateCalibrationSettings(true);
  }
  return _externalTempCalibration;
}

bool XY_SKxxx::getBuzzer(bool &enabled) {
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.readHoldingRegisters(REG_BUZZER, 1);
  postTransmission();
  
  if (result == node.ku8MBSuccess) {
    enabled = (node.getResponseBuffer(0) != 0);
    return true;
  }
  return false;
}

uint8_t XY_SKxxx::getSelectedDataGroup() {
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.readHoldingRegisters(REG_EXTRACT_M, 1);
  postTransmission();
  
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0; // Default or error value
}

uint16_t XY_SKxxx::getSystemStatus(bool refresh) {
  if (refresh) {
    waitForSilentInterval();
    preTransmission();
    uint8_t result = node.readHoldingRegisters(REG_SYS_STATUS, 1);
    postTransmission();
    
    if (result == node.ku8MBSuccess) {
      _status.systemStatus = node.getResponseBuffer(0);
    }
  }
  return _status.systemStatus;
}

// Only implement these if the registers are writable according to documentation
bool XY_SKxxx::setProtectionStatus(uint16_t status) {
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_PROTECT, status);
  postTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::setSystemStatus(uint16_t status) {
  waitForSilentInterval();
  preTransmission();
  uint8_t result = node.writeSingleRegister(REG_SYS_STATUS, status);
  postTransmission();
  return (result == node.ku8MBSuccess);
}
