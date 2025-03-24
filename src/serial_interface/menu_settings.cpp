#include "menu_settings.h"
#include "serial_core.h"
#include "serial_interface.h"

void displaySettingsMenu() {
  Serial.println("\n==== Settings Menu ====");
  Serial.println("baudrate [code] - Set device baud rate (0-6)");
  Serial.println("address [id] - Set device Modbus address (1-247)");
  Serial.println("brightness [level] - Set display brightness (1-5, 5 = brightest)");
  Serial.println("tempunit [c/f] - Set temperature unit (Celsius/Fahrenheit)");
  Serial.println("save - Save current settings to device");
  Serial.println("default - Restore device to factory defaults");
  Serial.println("update [pin] [value] - Update local configuration");
  Serial.println("saveconfig - Save local configuration to flash");
  Serial.println("beeper [on/off] - Enable/disable beeper");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleSettingsMenu(const String& input, XY_SKxxx* ps, XYModbusConfig& config) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  if (input.startsWith("baudrate ")) {
    uint8_t baudCode;
    if (parseUInt8(input.substring(9), baudCode)) {
      if (ps->setBaudRate(baudCode)) {
        Serial.print("Baud rate code set to: ");
        Serial.println(baudCode);
        Serial.println("You must save and restart the device for this to take effect");
      } else {
        Serial.println("Failed to set baud rate");
      }
    }
  } else if (input.startsWith("address ")) {
    uint8_t address;
    if (parseUInt8(input.substring(8), address)) {
      if (address >= 1 && address <= 247) {
        if (ps->setSlaveAddress(address)) {
          Serial.print("Modbus address set to: ");
          Serial.println(address);
          Serial.println("You must save and restart the device for this to take effect");
        } else {
          Serial.println("Failed to set Modbus address");
        }
      } else {
        Serial.println("Invalid address. Must be between 1 and 247.");
      }
    }
  } else if (input == "save") {
    if (ps->updateDeviceSettings()) {
      Serial.println("Settings saved to device");
      Serial.println("Please restart the device for changes to take effect");
    } else {
      Serial.println("Failed to save settings");
    }
  } else if (input == "default") {
    // No direct function for factory reset, so we'll use writeRegister
    if (ps->writeRegister(0x2000, 0x0001)) {  // Assume register 0x2000 with value 1 restores defaults
      Serial.println("Factory defaults command sent");
      Serial.println("Please restart the device for changes to take effect");
    } else {
      Serial.println("Failed to restore factory defaults");
    }
  } else if (input.startsWith("update ")) {
    // Format: update [setting] [value]
    int spacePos = input.indexOf(' ', 7);
    if (spacePos > 0) {
      String setting = input.substring(7, spacePos);
      String value = input.substring(spacePos + 1);
      
      if (setting.equalsIgnoreCase("rxpin")) {
        uint8_t pin;
        if (parseUInt8(value, pin)) {
          config.rxPin = pin;
          Serial.print("Updated RX Pin to: ");
          Serial.println(pin);
        }
      } else if (setting.equalsIgnoreCase("txpin")) {
        uint8_t pin;
        if (parseUInt8(value, pin)) {
          config.txPin = pin;
          Serial.print("Updated TX Pin to: ");
          Serial.println(pin);
        }
      } else if (setting.equalsIgnoreCase("slaveid") || setting.equalsIgnoreCase("address")) {
        uint8_t id;
        if (parseUInt8(value, id) && id >= 1 && id <= 247) {
          config.slaveId = id;
          Serial.print("Updated Slave ID to: ");
          Serial.println(id);
        } else {
          Serial.println("Invalid Slave ID. Must be between 1 and 247.");
        }
      } else if (setting.equalsIgnoreCase("baud") || setting.equalsIgnoreCase("baudrate")) {
        uint32_t baud;
        if (parseUInt16(value, (uint16_t&)baud)) {
          // Check for standard baud rates
          if (baud == 1200 || baud == 2400 || baud == 4800 || baud == 9600 || 
              baud == 19200 || baud == 38400 || baud == 57600 || baud == 115200) {
            config.baudRate = baud;
            Serial.print("Updated Baud Rate to: ");
            Serial.println(baud);
          } else {
            Serial.println("Invalid baud rate. Use a standard value.");
          }
        }
      } else {
        Serial.println("Unknown setting. Available: rxpin, txpin, slaveid, baudrate");
      }
    } else {
      Serial.println("Invalid format. Use: update [setting] [value]");
    }
  } else if (input == "saveconfig") {
    if (XYConfigManager::saveConfig(config)) {
      Serial.println("Configuration saved");
      Serial.println("Please restart the device for changes to take effect");
    } else {
      Serial.println("Failed to save configuration");
    }
  } else if (input.startsWith("beeper ")) {
    String subCmd = input.substring(7);
    subCmd.trim();
    
    if (subCmd == "on") {
      if (ps->setBeeper(true)) {
        Serial.println("Beeper enabled");
      } else {
        Serial.println("Failed to enable beeper");
      }
    } else if (subCmd == "off") {
      if (ps->setBeeper(false)) {
        Serial.println("Beeper disabled");
      } else {
        Serial.println("Failed to disable beeper");
      }
    } else {
      Serial.println("Invalid option. Use 'on' or 'off'");
    }
  } else if (input.startsWith("brightness ")) {
    uint8_t level;
    if (parseUInt8(input.substring(11), level)) {
      if (level >= 1 && level <= 5) {
        if (ps->setBacklightBrightness(level)) {
          Serial.print("Display brightness set to: ");
          Serial.println(level);
        } else {
          Serial.println("Failed to set brightness");
        }
      } else {
        Serial.println("Invalid brightness level. Use 1-5 (5 is brightest)");
      }
    }
  } else if (input.startsWith("tempunit ")) {
    String unit = input.substring(9);
    unit.trim();
    unit.toLowerCase();
    
    if (unit == "c" || unit == "celsius") {
      if (ps->setTemperatureUnit(false)) { // Changed from true to false
        Serial.println("Temperature unit set to Celsius");
      } else {
        Serial.println("Failed to set temperature unit");
      }
    } else if (unit == "f" || unit == "fahrenheit") {
      if (ps->setTemperatureUnit(true)) { // Changed from false to true
        Serial.println("Temperature unit set to Fahrenheit");
      } else {
        Serial.println("Failed to set temperature unit");
      }
    } else {
      Serial.println("Invalid unit. Use 'c' for Celsius or 'f' for Fahrenheit");
    }
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}
