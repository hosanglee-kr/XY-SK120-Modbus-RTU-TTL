#include "XY-SKxxx-internal.h" // Include internal header

/* Initialize static member */
XY_SKxxx* XY_SKxxx::_instance = nullptr;

XY_SKxxx::XY_SKxxx(uint8_t rxPin, uint8_t txPin, uint8_t slaveID)
  : _rxPin(rxPin), _txPin(txPin), _slaveID(slaveID), _lastCommsTime(0), _silentIntervalTime(0),
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

void XY_SKxxx::begin(long baudRate) {
  _baudRate = baudRate;
  _silentIntervalTime = silentInterval(baudRate);
  
  // Initialize hardware serial for XIAO ESP32S3
  Serial1.begin(baudRate, SERIAL_8N1, _rxPin, _txPin);
  
  // Initialize ModbusMaster with Serial1
  modbus.begin(_slaveID, Serial1);
  
  // Set up pre and post transmission callbacks using static functions
  modbus.preTransmission(staticPreTransmission);
  modbus.postTransmission(staticPostTransmission);
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

bool XY_SKxxx::testConnection() {
  waitForSilentInterval();
  
  preTransmission();
  uint16_t model = getModel();
  postTransmission();
  
  return model > 0; // Return true if we got a valid model number
}

// Direct register access methods for memory groups
bool XY_SKxxx::readRegisters(uint16_t addr, uint16_t count, uint16_t* buffer) {
  waitForSilentInterval();
  
  uint8_t result = modbus.readHoldingRegisters(addr, count);
  if (result == modbus.ku8MBSuccess) {
    for (uint16_t i = 0; i < count; i++) {
      buffer[i] = modbus.getResponseBuffer(i);
    }
    _lastCommsTime = millis();
    return true;
  }
  
  _lastCommsTime = millis();
  return false;
}

bool XY_SKxxx::writeRegister(uint16_t addr, uint16_t value) {
  waitForSilentInterval();
  
  uint8_t result = modbus.writeSingleRegister(addr, value);
  _lastCommsTime = millis();
  
  return (result == modbus.ku8MBSuccess);
}

bool XY_SKxxx::writeRegisters(uint16_t addr, uint16_t count, uint16_t* buffer) {
  waitForSilentInterval();
  
  // First set all the response/transmit buffers
  for (uint16_t i = 0; i < count; i++) {
    modbus.setTransmitBuffer(i, buffer[i]);
  }
  
  // Then do the write
  uint8_t result = modbus.writeMultipleRegisters(addr, count);
  _lastCommsTime = millis();
  
  return (result == modbus.ku8MBSuccess);
}
