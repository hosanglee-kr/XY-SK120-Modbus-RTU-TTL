#include "XY-SKxxx.h"

/* Initialize static member */
XY_SKxxx* XY_SKxxx::_instance = nullptr;

XY_SKxxx::XY_SKxxx(uint8_t rxPin, uint8_t txPin, uint8_t slaveID)
  : _rxPin(rxPin), _txPin(txPin), slaveID(slaveID), _lastCommsTime(0), _silentIntervalTime(0) {
  // Store instance pointer for static callback use
  _instance = this;
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
uint16_t XY_SKxxx::readModel() {
  uint8_t result = node.readHoldingRegisters(REG_MODEL, 1);
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
}

uint16_t XY_SKxxx::readVersion() {
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

bool XY_SKxxx::readOutput(float &voltage, float &current, float &power) {
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

float XY_SKxxx::readInputVoltage() {
  uint8_t result = node.readHoldingRegisters(REG_UIN, 1);
  if (result == node.ku8MBSuccess) {
    return (float)node.getResponseBuffer(0) / 100.0;
  }
  return 0.0;
}

uint32_t XY_SKxxx::readAmpHours() {
  uint8_t result = node.readHoldingRegisters(REG_AH_LOW, 2);
  if (result == node.ku8MBSuccess) {
    uint32_t ah = node.getResponseBuffer(0) | (node.getResponseBuffer(1) << 16);
    return ah;
  }
  return 0;
}

uint32_t XY_SKxxx::readWattHours() {
  uint8_t result = node.readHoldingRegisters(REG_WH_LOW, 2);
  if (result == node.ku8MBSuccess) {
    uint32_t wh = node.getResponseBuffer(0) | (node.getResponseBuffer(1) << 16);
    return wh;
  }
  return 0;
}

uint32_t XY_SKxxx::readOutputTime() {
  uint8_t result = node.readHoldingRegisters(REG_OUT_H, 3);
  if (result == node.ku8MBSuccess) {
    uint32_t hours = node.getResponseBuffer(0);
    uint32_t minutes = node.getResponseBuffer(1);
    uint32_t seconds = node.getResponseBuffer(2);
    return (hours * 3600) + (minutes * 60) + seconds;
  }
  return 0;
}

float XY_SKxxx::readInternalTemperature() {
  uint8_t result = node.readHoldingRegisters(REG_T_IN, 1);
  if (result == node.ku8MBSuccess) {
    return (float)node.getResponseBuffer(0) / 10.0;
  }
  return 0.0;
}

float XY_SKxxx::readExternalTemperature() {
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

uint16_t XY_SKxxx::readProtectionStatus() {
  uint8_t result = node.readHoldingRegisters(REG_PROTECT, 1);
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
}

uint16_t XY_SKxxx::readCVCCState() {
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

uint16_t XY_SKxxx::readBaudRate() {
  uint8_t result = node.readHoldingRegisters(REG_BAUDRATE_L, 1);
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
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

bool XY_SKxxx::selectDataGroup(uint8_t group) {
  uint8_t result = node.writeSingleRegister(REG_EXTRACT_M, group);
  return (result == node.ku8MBSuccess);
}

uint16_t XY_SKxxx::readSystemStatus() {
  uint8_t result = node.readHoldingRegisters(REG_SYS_STATUS, 1);
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
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

bool XY_SKxxx::beginTransmission() {
  waitForSilentInterval();
  return true;
}

void XY_SKxxx::endTransmission() {
  _lastCommsTime = millis();
}

bool XY_SKxxx::preTransmission() {
  return beginTransmission();
}

bool XY_SKxxx::postTransmission() {
  endTransmission();
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
  beginTransmission();
  voltageSuccess = setVoltage(voltage);
  endTransmission();
  
  // Wait between commands
  delay(_silentIntervalTime * 3);
  
  // Set current with proper timing
  beginTransmission();
  currentSuccess = setCurrent(current);
  endTransmission();
  
  // If either operation failed, try again
  if (!voltageSuccess || !currentSuccess) {
    // If voltage failed, retry
    if (!voltageSuccess) {
      delay(_silentIntervalTime * 3);
      beginTransmission();
      voltageSuccess = setVoltage(voltage);
      endTransmission();
    }
    
    // If current failed, retry
    if (!currentSuccess) {
      delay(_silentIntervalTime * 3);
      beginTransmission();
      currentSuccess = setCurrent(current);
      endTransmission();
    }
  }
  
  return voltageSuccess && currentSuccess;
}

bool XY_SKxxx::turnOutputOn() {
  waitForSilentInterval();
  
  beginTransmission();
  bool success = setOutputState(true);
  endTransmission();
  
  // Retry once if failed
  if (!success) {
    delay(_silentIntervalTime * 3);
    beginTransmission();
    success = setOutputState(true);
    endTransmission();
  }
  
  return success;
}

bool XY_SKxxx::turnOutputOff() {
  waitForSilentInterval();
  
  beginTransmission();
  bool success = setOutputState(false);
  endTransmission();
  
  // Retry once if failed
  if (!success) {
    delay(_silentIntervalTime * 3);
    beginTransmission();
    success = setOutputState(false);
    endTransmission();
  }
  
  return success;
}

bool XY_SKxxx::getOutputStatus(float &voltage, float &current, float &power, bool &isOn) {
  waitForSilentInterval();
  
  beginTransmission();
  bool success = readOutput(voltage, current, power);
  endTransmission();
  
  if (success) {
    isOn = (power > 0);
  }
  
  return success;
}

bool XY_SKxxx::testConnection() {
  waitForSilentInterval();
  
  beginTransmission();
  uint16_t model = readModel(); // Store the return value from readModel()
  endTransmission();
  
  return model > 0; // Return true if we got a valid model number
}

/* Constant Voltage (CV) methods */
bool XY_SKxxx::setConstantVoltage(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100); // 2 decimal places
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.writeSingleRegister(REG_CV_SET, voltageValue);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getConstantVoltage(float &voltage) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_CV_SET, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    voltage = (float)node.getResponseBuffer(0) / 100.0; // 2 decimal places
    return true;
  }
  return false;
}

/* Constant Current (CC) methods */
bool XY_SKxxx::setConstantCurrent(float current) {
  uint16_t currentValue = (uint16_t)(current * 1000); // 3 decimal places
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.writeSingleRegister(REG_CC_SET, currentValue);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getConstantCurrent(float &current) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_CC_SET, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    current = (float)node.getResponseBuffer(0) / 1000.0; // 3 decimal places
    return true;
  }
  return false;
}

/* Check if the power supply is in CC or CV mode */
bool XY_SKxxx::isInConstantCurrentMode() {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_CVCC, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    // According to the XY-SK120 protocol, 1 means CC mode
    return (node.getResponseBuffer(0) == 1);
  }
  return false;
}

bool XY_SKxxx::isInConstantVoltageMode() {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_CVCC, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    // According to the XY-SK120 protocol, 0 means CV mode
    return (node.getResponseBuffer(0) == 0);
  }
  return false;
}

/* VLP (input under-voltage protection) methods */
bool XY_SKxxx::setUnderVoltageProtection(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100);
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_VLP, voltageValue);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getUnderVoltageProtection(float &voltage) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_S_VLP, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    voltage = (float)node.getResponseBuffer(0) / 100.0;
    return true;
  }
  return false;
}

/*OVP (over-voltage protection) methods */
bool XY_SKxxx::setOverVoltageProtection(float voltage) {
  uint16_t voltageValue = (uint16_t)(voltage * 100);
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_OVP, voltageValue);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverVoltageProtection(float &voltage) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_S_OVP, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    voltage = (float)node.getResponseBuffer(0) / 100.0;
    return true;
  }
  return false;
}

/* OCP (over-current protection) methods */
bool XY_SKxxx::setOverCurrentProtection(float current) {
  uint16_t currentValue = (uint16_t)(current * 1000);
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_OCP, currentValue);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverCurrentProtection(float &current) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_S_OCP, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    current = (float)node.getResponseBuffer(0) / 1000.0;
    return true;
  }
  return false;
}

/* OPP (over-power protection) methods */
bool XY_SKxxx::setOverPowerProtection(float power) {
  uint16_t powerValue = (uint16_t)(power * 100);
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_OPP, powerValue);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverPowerProtection(float &power) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_S_OPP, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    power = (float)node.getResponseBuffer(0) / 100.0;
    return true;
  }
  return false;
}

/* OHP (output high power protection) methods */
bool XY_SKxxx::setHighPowerProtectionTime(uint16_t hours, uint16_t minutes) {
  waitForSilentInterval();
  
  // Set hours register
  beginTransmission();
  uint8_t resultHours = node.writeSingleRegister(REG_S_OHP_H, hours);
  endTransmission();
  
  delay(_silentIntervalTime * 2);
  
  // Set minutes register
  beginTransmission();
  uint8_t resultMinutes = node.writeSingleRegister(REG_S_OHP_M, minutes);
  endTransmission();
  
  return (resultHours == node.ku8MBSuccess && resultMinutes == node.ku8MBSuccess);
}

bool XY_SKxxx::getHighPowerProtectionTime(uint16_t &hours, uint16_t &minutes) {
  waitForSilentInterval();
  
  // Read hours register
  beginTransmission();
  uint8_t resultHours = node.readHoldingRegisters(REG_S_OHP_H, 1);
  endTransmission();
  
  if (resultHours == node.ku8MBSuccess) {
    hours = node.getResponseBuffer(0);
  } else {
    return false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read minutes register
  beginTransmission();
  uint8_t resultMinutes = node.readHoldingRegisters(REG_S_OHP_M, 1);
  endTransmission();
  
  if (resultMinutes == node.ku8MBSuccess) {
    minutes = node.getResponseBuffer(0);
    return true;
  }
  
  return false;
}

/* OAH (over-amp-hour protection) methods */
bool XY_SKxxx::setOverAmpHourProtection(uint16_t ampHoursLow, uint16_t ampHoursHigh) {
  waitForSilentInterval();
  
  // Set low register
  beginTransmission();
  uint8_t resultLow = node.writeSingleRegister(REG_S_OAH_L, ampHoursLow);
  endTransmission();
  
  delay(_silentIntervalTime * 2);
  
  // Set high register
  beginTransmission();
  uint8_t resultHigh = node.writeSingleRegister(REG_S_OAH_H, ampHoursHigh);
  endTransmission();
  
  return (resultLow == node.ku8MBSuccess && resultHigh == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverAmpHourProtection(uint16_t &ampHoursLow, uint16_t &ampHoursHigh) {
  waitForSilentInterval();
  
  // Read low register
  beginTransmission();
  uint8_t resultLow = node.readHoldingRegisters(REG_S_OAH_L, 1);
  endTransmission();
  
  if (resultLow == node.ku8MBSuccess) {
    ampHoursLow = node.getResponseBuffer(0);
  } else {
    return false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read high register
  beginTransmission();
  uint8_t resultHigh = node.readHoldingRegisters(REG_S_OAH_H, 1);
  endTransmission();
  
  if (resultHigh == node.ku8MBSuccess) {
    ampHoursHigh = node.getResponseBuffer(0);
    return true;
  }
  
  return false;
}

/* OWH (over-watt-hour protection) methods */
bool XY_SKxxx::setOverWattHourProtection(uint16_t wattHoursLow, uint16_t wattHoursHigh) {
  waitForSilentInterval();
  
  // Set low register
  beginTransmission();
  uint8_t resultLow = node.writeSingleRegister(REG_S_OWH_L, wattHoursLow);
  endTransmission();
  
  delay(_silentIntervalTime * 2);
  
  // Set high register
  beginTransmission();
  uint8_t resultHigh = node.writeSingleRegister(REG_S_OWH_H, wattHoursHigh);
  endTransmission();
  
  return (resultLow == node.ku8MBSuccess && resultHigh == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverWattHourProtection(uint16_t &wattHoursLow, uint16_t &wattHoursHigh) {
  waitForSilentInterval();
  
  // Read low register
  beginTransmission();
  uint8_t resultLow = node.readHoldingRegisters(REG_S_OWH_L, 1);
  endTransmission();
  
  if (resultLow == node.ku8MBSuccess) {
    wattHoursLow = node.getResponseBuffer(0);
  } else {
    return false;
  }
  
  delay(_silentIntervalTime * 2);
  
  // Read high register
  beginTransmission();
  uint8_t resultHigh = node.readHoldingRegisters(REG_S_OWH_H, 1);
  endTransmission();
  
  if (resultHigh == node.ku8MBSuccess) {
    wattHoursHigh = node.getResponseBuffer(0);
    return true;
  }
  
  return false;
}

/* REGS_S_OTP (Over Temperature Protection) methods */
bool XY_SKxxx::setOverTemperatureProtection(float temperature) {
  uint16_t tempValue = (uint16_t)(temperature * 10); // 1 decimal place
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_OTP, tempValue);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getOverTemperatureProtection(float &temperature) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_S_OTP, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    temperature = (float)node.getResponseBuffer(0) / 10.0; // 1 decimal place
    return true;
  }
  return false;
}

/* WIP: Power-on initialization setting methods */
bool XY_SKxxx::setPowerOnInitialization(bool outputOnAtStartup) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.writeSingleRegister(REG_S_INI, outputOnAtStartup ? 1 : 0);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getPowerOnInitialization(bool &outputOnAtStartup) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_S_INI, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    outputOnAtStartup = (node.getResponseBuffer(0) != 0);
    return true;
  }
  return false;
}

/* Temperature unit methods */
bool XY_SKxxx::setTemperatureUnit(bool celsius) {
  waitForSilentInterval();
  beginTransmission();
  // Value: 0 for Celsius, 1 for Fahrenheit
  uint8_t result = node.writeSingleRegister(REG_F_C, celsius ? 0 : 1);
  endTransmission();
  return (result == node.ku8MBSuccess);
}

bool XY_SKxxx::getTemperatureUnit(bool &celsius) {
  waitForSilentInterval();
  beginTransmission();
  uint8_t result = node.readHoldingRegisters(REG_F_C, 1);
  endTransmission();
  if (result == node.ku8MBSuccess) {
    celsius = (node.getResponseBuffer(0) == 0);  // 0 is Celsius, 1 is Fahrenheit
    return true;
  }
  return false;
}

// Convenience method to get just the voltage
float XY_SKxxx::getVoltage() {
  waitForSilentInterval();
  beginTransmission();
  float voltage = readInputVoltage(); // Use the dedicated method for reading input voltage
  endTransmission();
  return voltage;
}

// Convenience method to get just the current
float XY_SKxxx::getCurrent() {
  float voltage = 0.0, current = 0.0, power = 0.0;
  if (readOutput(voltage, current, power)) { // Use readOutput to fetch current
    return current;
  }
  return 0.0; // Return 0.0 if the read fails
}

// Convenience method to get just the power
float XY_SKxxx::getPower() {
  float voltage = 0.0, current = 0.0, power = 0.0;
  if (readOutput(voltage, current, power)) { // Use readOutput to fetch power
    return power;
  }
  return 0.0; // Return 0.0 if the read fails
}

// Simplified version that just returns whether output is enabled
bool XY_SKxxx::getOutputStatus() {
  waitForSilentInterval();
  beginTransmission();
  uint16_t status = readProtectionStatus(); // Use readProtectionStatus to check output state
  endTransmission();
  return (status & 0x01); // Check the least significant bit for output state
}

// Get protection status from the device
uint16_t XY_SKxxx::getProtectionStatus() {
  waitForSilentInterval();
  beginTransmission();
  uint16_t protectionStatus = readProtectionStatus(); // Use readProtectionStatus directly
  endTransmission();
  return protectionStatus;
}

// Get temperature (using internal temperature)
float XY_SKxxx::getTemperature() {
  waitForSilentInterval();
  beginTransmission();
  float temperature = readInternalTemperature(); // Use readInternalTemperature directly
  endTransmission();
  return temperature;
}

// Convenience method to enable output
bool XY_SKxxx::enableOutput() {
  waitForSilentInterval();
  beginTransmission();
  bool success = setOutputState(true); // Use setOutputState to enable output
  endTransmission();
  return success;
}

// Convenience method to disable output
bool XY_SKxxx::disableOutput() {
  waitForSilentInterval();
  beginTransmission();
  bool success = setOutputState(false); // Use setOutputState to disable output
  endTransmission();
  return success;
}
