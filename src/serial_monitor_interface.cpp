#include <Arduino.h>
#include "XY-SKxxx.h"
#include "XY-SKxxx_Config.h"
#include "serial_monitor_interface.h"
#include "XY-SKxxx-cd-data-group.h"

// Helper function to display device status
void displayStatus(XY_SKxxx* powerSupply) {
  float voltage, current, power;
  bool isOn;
  
  if (powerSupply->getOutputStatus(voltage, current, power, isOn)) {
    Serial.println("\n----- DEVICE STATUS -----");
    Serial.print("Voltage: "); Serial.print(voltage, 2); Serial.println(" V");
    Serial.print("Current: "); Serial.print(current, 3); Serial.println(" A");
    Serial.print("Power:   "); Serial.print(power, 3); Serial.println(" W");
    Serial.print("Output:  "); Serial.println(isOn ? "ON" : "OFF");
    
    if (isOn) {
      Serial.print("Mode:    ");
      if (powerSupply->isInConstantCurrentMode()) {
        Serial.println("Constant Current (CC)");
      } else if (powerSupply->isInConstantVoltageMode()) {
        Serial.println("Constant Voltage (CV)");
      } else {
        Serial.println("Unknown");
      }
    }
    Serial.println("------------------------");
  } else {
    Serial.println("Failed to read device status");
  }
}

// Function to display configuration
void displayConfig(XYModbusConfig &config) {
  Serial.println("\n----- CONFIGURATION -----");
  Serial.print("RX Pin:    "); Serial.println(config.rxPin);
  Serial.print("TX Pin:    "); Serial.println(config.txPin);
  Serial.print("Slave ID:  "); Serial.println(config.slaveId);
  Serial.print("Baud Rate: "); Serial.println(config.baudRate);
  Serial.println("------------------------");
}

// Helper function to display a memory group's settings
void displayMemoryGroup(XY_SKxxx* powerSupply, xy_sk::MemoryGroup group) {
  uint16_t data[xy_sk::DATA_GROUP_REGISTERS];
  
  if (xy_sk::DataGroupManager::readMemoryGroup(
        group,
        data,
        [powerSupply](uint16_t addr, uint16_t count, uint16_t* buffer) -> bool {
          return powerSupply->readRegisters(addr, count, buffer);
        })) {
    
    Serial.print("\n----- MEMORY GROUP M");
    Serial.print(static_cast<int>(group));
    Serial.println(" -----");
    
    // 0x0050: CV (constant voltage) setting
    Serial.print("Voltage Set:       "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] / 100.0f, 2);
    Serial.println(" V   (Constant Voltage Setting)");
    
    // 0x0051: CC (constant current) setting
    Serial.print("Current Set:       "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] / 1000.0f, 3);
    Serial.println(" A   (Constant Current Setting)");
    
    // 0x0052: LVP (input under voltage protection) setting
    Serial.print("UVP Value:         "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::UVP_SET)] / 100.0f, 2);
    Serial.println(" V   (Under Voltage Protection)");
    
    // 0x0053: OVP (output over voltage protection) setting
    Serial.print("OVP Value:         "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::OVP_SET)] / 100.0f, 2);
    Serial.println(" V   (Over Voltage Protection)");
    
    // 0x0054: OCP (output over current protection) setting
    Serial.print("OCP Value:         "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::OCP_SET)] / 1000.0f, 3);
    Serial.println(" A   (Over Current Protection)");
    
    // 0x0055: OPP (output over power protection) setting
    Serial.print("OPP Value:         "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::OPP_SET)] / 10.0f, 1);
    Serial.println(" W   (Over Power Protection)");
    
    // 0x0056: OAH (over-amp-hour protection - hours)
    Serial.print("OAH Hours:         "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::OAH_SET)]);
    Serial.println(" h   (Over Amp-Hour Protection - Hours)");
    
    // 0x0057: OAH (over-amp-hour protection - minutes)
    Serial.print("OAH Minutes:       "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::OWH_SET)]);
    Serial.println(" min (Over Amp-Hour Protection - Minutes)");
    
    // 0x0058: OAH_LOW (over-amp-hour protection - low)
    Serial.print("OAH Low Value:     "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::UVP_SET)]);
    Serial.println(" mAh (Over Amp-Hour Protection Low Bytes)");
    
    // 0x0059: OAH_HIGH (over-amp-hour protection - high)
    Serial.print("OAH High Value:    "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::UCP_SET)]);
    Serial.println(" mAh (Over Amp-Hour Protection High Bytes)");
    
    // 0x005A: OWH_LOW (over-watt-hour protection - low)
    Serial.print("OWH Low Value:     "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_BACK)] * 10);
    Serial.println(" mWh (Over Watt-Hour Protection Low Bytes)");
    
    // 0x005B: OWH_HIGH (over-watt-hour protection - high)
    Serial.print("OWH High Value:    "); 
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_BACK)] * 10);
    Serial.println(" mWh (Over Watt-Hour Protection High Bytes)");
    
    // 0x005C: Over temperature protection setting
    Serial.print("OTP Value:         "); 
    // Fix: Changed divisor from 10.0f to 1.0f to display correct temperature
    Serial.print(data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::POWER_BACK)], 0);
    Serial.println(" °C  (Over Temperature Protection)");
    
    // 0x005D: Power-on initialization setting
    uint16_t iniValue = data[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::PARAMETERS)];
    Serial.print("Power-On Setting:  "); 
    Serial.print(iniValue);
    Serial.print("    (");
    Serial.print(iniValue == 0 ? "Output OFF" : "Output ON");
    Serial.println(" at power-up)");
    
    Serial.println("------------------------");
  } else {
    Serial.print("Failed to read memory group M");
    Serial.println(static_cast<int>(group));
  }
}

// Helper function to read current settings and save to specified memory group
bool saveCurrentToMemoryGroup(XY_SKxxx* powerSupply, xy_sk::MemoryGroup targetGroup) {
  // First read M0 (current settings)
  uint16_t data[xy_sk::DATA_GROUP_REGISTERS];
  
  if (!xy_sk::DataGroupManager::readMemoryGroup(
        xy_sk::MemoryGroup::M0,
        data,
        [powerSupply](uint16_t addr, uint16_t count, uint16_t* buffer) -> bool {
          // Use the new readRegisters method
          return powerSupply->readRegisters(addr, count, buffer);
        })) {
    return false;
  }
  
  // Then write to target memory group
  return xy_sk::DataGroupManager::writeMemoryGroup(
    targetGroup,
    data,
    [powerSupply](uint16_t addr, uint16_t count, const uint16_t* buffer) -> bool {
      // Use the new writeRegisters method
      return powerSupply->writeRegisters(addr, count, const_cast<uint16_t*>(buffer));
    });
}

void printHelp() {
  Serial.println("\nAvailable Commands:");
  Serial.println("  on         - Turn output ON");
  Serial.println("  off        - Turn output OFF");
  Serial.println("  set V I    - Set voltage (V) and current (I)");
  Serial.println("  status     - Display current status");
  Serial.println("  info       - Display device information");
  Serial.println("  config     - Display current configuration");
  Serial.println("  save       - Save current config to NVS");
  Serial.println("  reset      - Reset config to defaults");
  Serial.println("  help       - Show this help message");
  
  // Add memory group commands
  Serial.println("\nMemory Group Commands:");
  Serial.println("  mem N       - Display memory group N (0-9)");
  Serial.println("  call N      - Call memory group N (1-9) to active memory");
  Serial.println("  save2mem N  - Save current settings to memory group N (1-9)");
  Serial.println("  setmem N param value - Set specific parameter in memory group N");
  Serial.println("                Parameters: v(voltage), i(current), p(power),");
  Serial.println("                            ovp, ocp, opp, oah, owh, uvp, ucp");
  
  // Add debug commands
  Serial.println("\nDebug Commands:");
  Serial.println("  read addr count   - Read 'count' registers starting at address 'addr'");
  Serial.println("  write addr value  - Write 'value' to register at address 'addr'");
  Serial.println("  writes addr v1 v2 - Write multiple values to consecutive registers");
}

// Helper function to display register values in hex and decimal
void displayRegisterValues(uint16_t startAddr, uint16_t* values, uint8_t count) {
  Serial.println("\n----- REGISTER VALUES -----");
  for (uint8_t i = 0; i < count; i++) {
    uint16_t addr = startAddr + i;
    uint16_t value = values[i];
    
    Serial.print("Addr 0x");
    if (addr < 0x1000) Serial.print("0");
    if (addr < 0x100) Serial.print("0");
    if (addr < 0x10) Serial.print("0");
    Serial.print(addr, HEX);
    
    Serial.print(": 0x");
    if (value < 0x1000) Serial.print("0");
    if (value < 0x100) Serial.print("0");
    if (value < 0x10) Serial.print("0");
    Serial.print(value, HEX);
    
    Serial.print(" (");
    Serial.print(value, DEC);
    Serial.print(") ");
    
    // Show as float with common scaling factors
    Serial.print("Float: ");
    Serial.print(value / 1000.0f, 3);
    Serial.print(" / ");
    Serial.print(value / 100.0f, 2);
    Serial.print(" / ");
    Serial.print(value / 10.0f, 1);
    
    Serial.println();
  }
  Serial.println("-------------------------");
}

void handleSerialCommand(String command, XY_SKxxx* powerSupply, XYModbusConfig &config) {
  command.trim();
  
  if (command == "on") {
    Serial.println("Turning output ON...");
    if (powerSupply->turnOutputOn()) {
      Serial.println("Success");
    } else {
      Serial.println("Failed");
    }
    displayStatus(powerSupply);
  }
  else if (command == "off") {
    Serial.println("Turning output OFF...");
    if (powerSupply->turnOutputOff()) {
      Serial.println("Success");
    } else {
      Serial.println("Failed");
    }
    displayStatus(powerSupply);
  }
  else if (command == "status") {
    displayStatus(powerSupply);
  }
  else if (command == "info") {
    uint16_t model = powerSupply->getModel();
    uint16_t version = powerSupply->getVersion();
    
    Serial.println("\nDevice Information:");
    Serial.print("Model:   "); Serial.println(model);
    Serial.print("Version: "); Serial.println(version);
  }
  else if (command == "config") {
    displayConfig(config);
  }
  else if (command == "save") {
    if (XYConfigManager::saveConfig(config)) {
      Serial.println("Configuration saved successfully");
    } else {
      Serial.println("Failed to save configuration");
    }
  }
  else if (command == "reset") {
    if (XYConfigManager::resetConfig()) {
      config = XYConfigManager::loadConfig();
      Serial.println("Configuration reset to defaults");
      displayConfig(config);
    } else {
      Serial.println("Failed to reset configuration");
    }
  }
  else if (command == "help") {
    printHelp();
  }
  else if (command.startsWith("set ")) {
    // Parse voltage and current values
    command = command.substring(4); // Remove "set "
    int spaceIndex = command.indexOf(' ');
    
    if (spaceIndex > 0) {
      float voltage = command.substring(0, spaceIndex).toFloat();
      float current = command.substring(spaceIndex + 1).toFloat();
      
      Serial.print("Setting voltage to: "); Serial.print(voltage); Serial.println(" V");
      Serial.print("Setting current to: "); Serial.print(current); Serial.println(" A");
      
      if (powerSupply->setVoltageAndCurrent(voltage, current)) {
        Serial.println("Settings updated successfully");
      } else {
        Serial.println("Failed to update settings");
      }
      
      displayStatus(powerSupply);
    } else {
      Serial.println("Invalid format. Use: set [voltage] [current]");
    }
  }
  // Commands to change configuration
  else if (command.startsWith("rx ")) {
    uint8_t pin = command.substring(3).toInt();
    Serial.print("Setting RX pin to: "); Serial.println(pin);
    config.rxPin = pin;
    displayConfig(config);
  }
  else if (command.startsWith("tx ")) {
    uint8_t pin = command.substring(3).toInt();
    Serial.print("Setting TX pin to: "); Serial.println(pin);
    config.txPin = pin;
    displayConfig(config);
  }
  else if (command.startsWith("slave ")) {
    uint8_t id = command.substring(6).toInt();
    Serial.print("Setting slave ID to: "); Serial.println(id);
    config.slaveId = id;
    displayConfig(config);
  }
  else if (command.startsWith("baud ")) {
    uint32_t baud = command.substring(5).toInt();
    Serial.print("Setting baud rate to: "); Serial.println(baud);
    displayConfig(config);
  }
  else if (command == "reload") {
    // Delete the old instance
    if (powerSupply != nullptr) {
      delete powerSupply;
    }
    
    // Create a new instance with updated config
    powerSupply = new XY_SKxxx(config.rxPin, config.txPin, config.slaveId);
    powerSupply->begin(config.baudRate);
    
    Serial.println("Power supply reinitialized with new configuration");
    delay(500);
    
    if (powerSupply->testConnection()) {
      Serial.println("Connection test successful!");
      displayStatus(powerSupply);
    } else {
      Serial.println("Connection test failed with new configuration");
    }
  }
  // Memory group commands
  else if (command.startsWith("mem ")) {
    int groupNum = command.substring(4).toInt();
    if (groupNum >= 0 && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      displayMemoryGroup(powerSupply, group);
    } else {
      Serial.println("Invalid memory group. Must be 0-9.");
    }
  }
  else if (command.startsWith("call ")) {
    int groupNum = command.substring(5).toInt();
    if (groupNum >= 1 && groupNum <= 9) {
      Serial.print("Calling memory group M");
      Serial.println(groupNum);
      
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      bool success = xy_sk::DataGroupManager::callMemoryGroup(
        group,
        [powerSupply](uint16_t addr, uint16_t value) -> bool {
          return powerSupply->writeRegister(addr, value);
        });
      
      if (success) {
        Serial.println("Memory group called successfully");
        // Display the called memory group (Mn) instead of M0
        displayMemoryGroup(powerSupply, group);
      } else {
        Serial.println("Failed to call memory group");
      }
    } else {
      Serial.println("Invalid memory group. Must be 1-9.");
    }
  }
  else if (command.startsWith("save2mem ")) {
    int groupNum = command.substring(9).toInt();
    if (groupNum >= 1 && groupNum <= 9) {
      Serial.print("Saving current settings to memory group M");
      Serial.println(groupNum);
      
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      if (saveCurrentToMemoryGroup(powerSupply, group)) {
        Serial.println("Settings saved to memory group successfully");
      } else {
        Serial.println("Failed to save settings to memory group");
      }
    } else {
      Serial.println("Invalid memory group. Must be 1-9.");
    }
  }
  else if (command.startsWith("setmem ")) {
    // Format: setmem N param value
    // Example: setmem 1 v 12.5
    command = command.substring(7); // Remove "setmem "
    int firstSpace = command.indexOf(' ');
    
    if (firstSpace > 0) {
      int groupNum = command.substring(0, firstSpace).toInt();
      command = command.substring(firstSpace + 1);
      int secondSpace = command.indexOf(' ');
      
      if (secondSpace > 0 && groupNum >= 0 && groupNum <= 9) {
        String param = command.substring(0, secondSpace);
        float value = command.substring(secondSpace + 1).toFloat();
        xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
        xy_sk::GroupRegisterOffset regOffset;
        uint16_t rawValue = 0;
        bool validParam = true;
        
        // Convert to appropriate register and raw value
        if (param == "v" || param == "voltage") {
          regOffset = xy_sk::GroupRegisterOffset::VOLTAGE_SET;
          rawValue = static_cast<uint16_t>(value * 100);
        }
        else if (param == "i" || param == "current") {
          regOffset = xy_sk::GroupRegisterOffset::CURRENT_SET;
          rawValue = static_cast<uint16_t>(value * 1000);
        }
        else if (param == "p" || param == "power") {
          regOffset = xy_sk::GroupRegisterOffset::POWER_SET;
          rawValue = static_cast<uint16_t>(value * 100);
        }
        else if (param == "ovp") {
          regOffset = xy_sk::GroupRegisterOffset::OVP_SET;
          rawValue = static_cast<uint16_t>(value * 100);
        }
        else if (param == "ocp") {
          regOffset = xy_sk::GroupRegisterOffset::OCP_SET;
          rawValue = static_cast<uint16_t>(value * 1000);
        }
        else if (param == "opp") {
          regOffset = xy_sk::GroupRegisterOffset::OPP_SET;
          // Fix the OPP scaling - changed multiplier from 100 to 10 to match device
          rawValue = static_cast<uint16_t>(value * 10);
        }
        else if (param == "oah") {
          regOffset = xy_sk::GroupRegisterOffset::OAH_SET;
          rawValue = static_cast<uint16_t>(value * 1000);
        }
        else if (param == "owh") {
          regOffset = xy_sk::GroupRegisterOffset::OWH_SET;
          rawValue = static_cast<uint16_t>(value * 100);
        }
        else if (param == "uvp") {
          regOffset = xy_sk::GroupRegisterOffset::UVP_SET;
          rawValue = static_cast<uint16_t>(value * 100);
        }
        else if (param == "ucp") {
          regOffset = xy_sk::GroupRegisterOffset::UCP_SET;
          rawValue = static_cast<uint16_t>(value * 1000);
        }
        else {
          validParam = false;
          Serial.println("Invalid parameter. Use v, i, p, ovp, ocp, opp, oah, owh, uvp, ucp");
        }
        
        if (validParam) {
          Serial.print("Setting ");
          Serial.print(param);
          Serial.print(" to ");
          Serial.print(value);
          Serial.print(" in memory group M");
          Serial.println(groupNum);
          
          bool success = xy_sk::DataGroupManager::writeGroupRegister(
            group,
            regOffset,
            rawValue,
            [powerSupply](uint16_t addr, uint16_t value) -> bool {
              // Use the new writeRegister method
              return powerSupply->writeRegister(addr, value);
            });
            
          if (success) {
            Serial.println("Parameter updated successfully");
            // Show the updated memory group
            displayMemoryGroup(powerSupply, group);
          } else {
            Serial.println("Failed to update parameter");
          }
        }
      } else {
        Serial.println("Invalid format. Use: setmem [group 0-9] [param] [value]");
      }
    } else {
      Serial.println("Invalid format. Use: setmem [group 0-9] [param] [value]");
    }
  }
  // Debug commands for direct register access
  else if (command.startsWith("read ")) {
    command = command.substring(5); // Remove "read "
    int spaceIndex = command.indexOf(' ');
    
    if (spaceIndex > 0) {
      uint16_t addr = strtoul(command.substring(0, spaceIndex).c_str(), NULL, 0);
      uint8_t count = command.substring(spaceIndex + 1).toInt();
      
      if (count > 0 && count <= 125) {
        Serial.print("Reading ");
        Serial.print(count);
        Serial.print(" registers starting at address 0x");
        Serial.println(addr, HEX);
        
        uint16_t values[125]; // Maximum read size for Modbus
        if (powerSupply->debugReadRegisters(addr, count, values)) {
          displayRegisterValues(addr, values, count);
        } else {
          Serial.println("Failed to read registers");
        }
      } else {
        Serial.println("Invalid count. Must be between 1 and 125.");
      }
    } else {
      Serial.println("Invalid format. Use: read [address] [count]");
    }
  }
  else if (command.startsWith("write ")) {
    command = command.substring(6); // Remove "write "
    int spaceIndex = command.indexOf(' ');
    
    if (spaceIndex > 0) {
      uint16_t addr = strtoul(command.substring(0, spaceIndex).c_str(), NULL, 0);
      uint16_t value = strtoul(command.substring(spaceIndex + 1).c_str(), NULL, 0);
      
      Serial.print("Writing value 0x");
      Serial.print(value, HEX);
      Serial.print(" (");
      Serial.print(value);
      Serial.print(") to register at address 0x");
      Serial.println(addr, HEX);
      
      if (powerSupply->debugWriteRegister(addr, value)) {
        Serial.println("Success");
        
        // Read back the value to confirm
        uint16_t readback;
        if (powerSupply->debugReadRegisters(addr, 1, &readback)) {
          Serial.print("Readback value: 0x");
          Serial.print(readback, HEX);
          Serial.print(" (");
          Serial.print(readback);
          Serial.println(")");
        }
      } else {
        Serial.println("Failed to write to register");
      }
    } else {
      Serial.println("Invalid format. Use: write [address] [value]");
    }
  }
  else if (command.startsWith("writes ")) {
    command = command.substring(7); // Remove "writes "
    int spaceIndex = command.indexOf(' ');
    
    if (spaceIndex > 0) {
      uint16_t addr = strtoul(command.substring(0, spaceIndex).c_str(), NULL, 0);
      command = command.substring(spaceIndex + 1);
      
      // Parse all remaining values
      uint16_t values[123]; // Maximum write size for Modbus
      uint8_t count = 0;
      
      while (command.length() > 0 && count < 123) {
        spaceIndex = command.indexOf(' ');
        String valueStr;
        
        if (spaceIndex > 0) {
          valueStr = command.substring(0, spaceIndex);
          command = command.substring(spaceIndex + 1);
        } else {
          valueStr = command;
          command = "";
        }
        
        if (valueStr.length() > 0) {
          values[count++] = strtoul(valueStr.c_str(), NULL, 0);
        }
      }
      
      if (count > 0) {
        Serial.print("Writing ");
        Serial.print(count);
        Serial.print(" values to registers starting at address 0x");
        Serial.println(addr, HEX);
        
        if (powerSupply->debugWriteRegisters(addr, count, values)) {
          Serial.println("Success");
          
          // Read back the values to confirm
          uint16_t readback[123];
          if (powerSupply->debugReadRegisters(addr, count, readback)) {
            displayRegisterValues(addr, readback, count);
          }
        } else {
          Serial.println("Failed to write to registers");
        }
      } else {
        Serial.println("No values provided");
      }
    } else {
      Serial.println("Invalid format. Use: writes [address] [value1] [value2] ...");
    }
  }
  else {
    Serial.println("Unknown command. Type 'help' for available commands.");
  }
}

void setupSerialMonitorControl() {
  Serial.println("\nXY-SK120 Serial Monitor Control");
  Serial.println("Type 'help' for available commands");
}

void checkSerialMonitorInput(XY_SKxxx* powerSupply, XYModbusConfig &config) {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    handleSerialCommand(command, powerSupply, config);
  }
}