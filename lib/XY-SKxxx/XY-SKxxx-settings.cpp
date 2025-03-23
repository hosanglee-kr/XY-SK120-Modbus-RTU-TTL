#include "XY-SKxxx-internal.h"
#include "XY-SKxxx.h"

/**
 * Set the Modbus slave address
 * 
 * @param address New slave address (1-247)
 * @return true if successful
 */
bool XY_SKxxx::setSlaveAddress(uint8_t address) {
  if (address < 1 || address > 247) {
    return false; // Invalid Modbus address
  }
  
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_SLAVE_ADDR, address);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    // Update local slave ID (note: next communications will use new address)
    _slaveID = address;
    // Re-initialize ModbusMaster with the new slave ID
    modbus.begin(_slaveID, Serial1);
    return true;
  }
  
  return false;
}

/**
 * Get the current Modbus slave address
 * 
 * @param address Reference to store the slave address
 * @return true if successful
 */
bool XY_SKxxx::getSlaveAddress(uint8_t &address) {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_SLAVE_ADDR, 1);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    address = modbus.getResponseBuffer(0);
    return true;
  }
  
  return false;
}

/**
 * Set the baud rate
 * 
 * @param baudRate Baud rate code (0-8)
 *                 0: 9600, 1: 14400, 2: 19200, 3: 38400, 4: 56000, 
 *                 5: 576000, 6: 115200, 7: 2400, 8: 4800
 * @return true if successful
 */
bool XY_SKxxx::setBaudRate(uint8_t baudRate) {
  if (baudRate > 8) {
    return false; // Invalid baud rate code
  }
  
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_BAUDRATE_L, baudRate);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    // Convert code to actual baud rate
    long newBaudRate;
    switch (baudRate) {
      case 0: newBaudRate = 9600; break;
      case 1: newBaudRate = 14400; break;
      case 2: newBaudRate = 19200; break;
      case 3: newBaudRate = 38400; break;
      case 4: newBaudRate = 56000; break;
      case 5: newBaudRate = 576000; break;
      case 6: newBaudRate = 115200; break;
      case 7: newBaudRate = 2400; break;
      case 8: newBaudRate = 4800; break;
      default: return false;
    }
    
    // Note: communication speed will change after this command
    // Next operations will need to use the new baud rate
    _baudRate = newBaudRate;
    
    // Update the Serial1 baud rate
    Serial1.flush();
    Serial1.begin(newBaudRate, SERIAL_8N1, _rxPin, _txPin);
    
    // Recalculate silent interval for new baud rate
    _silentIntervalTime = silentInterval(newBaudRate);
    
    return true;
  }
  
  return false;
}

/**
 * Get the current baud rate code
 * 
 * @return Baud rate code (0-8) or 255 on error
 */
uint8_t XY_SKxxx::getBaudRateCode() {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_BAUDRATE_L, 1);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    return modbus.getResponseBuffer(0);
  }
  
  return 255; // Error value
}

/**
 * Get the actual baud rate value
 * 
 * @return Actual baud rate in bps or 0 on error
 */
long XY_SKxxx::getActualBaudRate() {
  uint8_t code = getBaudRateCode();
  if (code == 255) return 0;
  
  switch (code) {
    case 0: return 9600;
    case 1: return 14400;
    case 2: return 19200;
    case 3: return 38400;
    case 4: return 56000;
    case 5: return 576000;
    case 6: return 115200;
    case 7: return 2400;
    case 8: return 4800;
    default: return 0;
  }
}

/**
 * Set the backlight brightness
 * 
 * @param level Brightness level (0-5), 5 is the brightest
 * @return true if successful
 */
bool XY_SKxxx::setBacklightBrightness(uint8_t level) {
  if (level > 5) {
    level = 5; // Clamp to maximum
  }
  
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_B_LED, level);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _status.backlightLevel = level;
    return true;
  }
  
  return false;
}

/**
 * Get the current backlight brightness
 * 
 * @return Brightness level (0-5) or 255 on error
 */
uint8_t XY_SKxxx::getBacklightBrightness() {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_B_LED, 1);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _status.backlightLevel = modbus.getResponseBuffer(0);
    return _status.backlightLevel;
  }
  
  return 255; // Error value
}

/**
 * Set the sleep timeout
 * 
 * @param minutes Sleep timeout in minutes (0 = never sleep)
 * @return true if successful
 */
bool XY_SKxxx::setSleepTimeout(uint8_t minutes) {
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_SLEEP, minutes);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _status.sleepTimeout = minutes;
    return true;
  }
  
  return false;
}

/**
 * Get the current sleep timeout
 * 
 * @return Sleep timeout in minutes or 255 on error
 */
uint8_t XY_SKxxx::getSleepTimeout() {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_SLEEP, 1);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _status.sleepTimeout = modbus.getResponseBuffer(0);
    return _status.sleepTimeout;
  }
  
  return 255; // Error value
}

/**
 * Set the temperature unit
 * 
 * @param celsius true for Celsius, false for Fahrenheit
 * @return true if successful
 */
bool XY_SKxxx::setTemperatureUnit(bool celsius) {
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_F_C, celsius ? 1 : 0);
  _lastCommsTime = millis();
  
  return (result == modbus.ku8MBSuccess);
}

/**
 * Get the current temperature unit
 * 
 * @param celsius Reference to store the unit (true if Celsius, false if Fahrenheit)
 * @return true if successful
 */
bool XY_SKxxx::getTemperatureUnit(bool &celsius) {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_F_C, 1);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    celsius = (modbus.getResponseBuffer(0) != 0);
    return true;
  }
  
  return false;
}

/**
 * Set the active data group
 * 
 * @param group Data group to select (0-9)
 * @return true if successful
 */
bool XY_SKxxx::setDataGroup(uint8_t group) {
  if (group > 9) {
    return false; // Invalid group
  }
  
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(REG_EXTRACT_M, group);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _selectedDataGroup = group;
    return true;
  }
  
  return false;
}

/**
 * Get the currently selected data group
 * 
 * @return Data group (0-9) or 255 on error
 */
uint8_t XY_SKxxx::getSelectedDataGroup() {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(REG_EXTRACT_M, 1);
  _lastCommsTime = millis();
  
  if (result == modbus.ku8MBSuccess) {
    _selectedDataGroup = modbus.getResponseBuffer(0);
    return _selectedDataGroup;
  }
  
  return 255; // Error value
}
