// S10_serialInterface_m001.cpp

#include "S10_serialInterface_m001.h"
#include <vector>


using serial_interface::sanitizeString;
// ===== BEGIN menu_basic.cpp =====
namespace serial_interface {


// Add this helper function to sanitize input strings
String sanitizeString(const String& input) {
    String result = "";
    for (size_t i = 0; i < input.length(); i++) {
        char c = input.charAt(i);
        // Only allow printable ASCII characters, skip control chars
        if (c >= 32 && c <= 126) {
            result += c;
        }
    }
    return result;
}

void displayBasicControlMenu() {
  Serial.println("\n==== Basic Control ====");
  Serial.println("v [value] - Set voltage (V)");
  Serial.println("i [value] - Set current (A)");
  Serial.println("vi [voltage] [current] - Set both voltage and current");
  Serial.println("on - Turn output on");
  Serial.println("off - Turn output off");
  Serial.println("read - Read live output values");
  Serial.println("lock - Lock front panel keys");
  Serial.println("unlock - Unlock front panel keys");
  Serial.println("cv [value] - Set constant voltage mode");
  Serial.println("cc [value] - Set constant current mode");
  Serial.println("cp [value] - Set constant power mode");  // Add CP mode command
  Serial.println("cpmode [on/off] - Enable/disable constant power mode");  // Add CP mode toggle
  Serial.println("group [0-9] - Activate memory group (0-9)");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleBasicControl(const String& input, XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }

  if (input.startsWith("v ")) {
    float voltage;
    if (parseFloat(input.substring(2), voltage)) {
      if (ps->setVoltage(voltage)) {
        Serial.print("Voltage set to: ");
        Serial.println(voltage, 2);
      } else {
        Serial.println("Failed to set voltage");
      }
    }
  } else if (input.startsWith("i ")) {
    float current;
    if (parseFloat(input.substring(2), current)) {
      if (ps->setCurrent(current)) {
        Serial.print("Current set to: ");
        Serial.println(current, 3);
      } else {
        Serial.println("Failed to set current");
      }
    }
  } else if (input.startsWith("vi ")) {
    // Extract voltage and current values
    int spacePos = input.indexOf(' ', 3);
    if (spacePos > 0) {
      float voltage, current;
      if (parseFloat(input.substring(3, spacePos), voltage) &&
          parseFloat(input.substring(spacePos + 1), current)) {
        if (ps->setVoltageAndCurrent(voltage, current)) {
          Serial.print("Voltage set to: ");
          Serial.print(voltage, 2);
          Serial.print("V, Current set to: ");
          Serial.print(current, 3);
          Serial.println("A");
        } else {
          Serial.println("Failed to set voltage and current");
        }
      } else {
        Serial.println("Invalid format. Use: vi [voltage] [current]");
      }
    } else {
      Serial.println("Invalid format. Use: vi [voltage] [current]");
    }
  } else if (input == "on") {
    if (ps->turnOutputOn()) {
      Serial.println("Output turned ON");
    } else {
      Serial.println("Failed to turn output on");
    }
  } else if (input == "off") {
    if (ps->turnOutputOff()) {
      Serial.println("Output turned OFF");
    } else {
      Serial.println("Failed to turn output off");
    }
  } else if (input == "read") {
    float voltage, current, power;
    bool isOn;
    
    if (ps->getOutputStatus(voltage, current, power, isOn)) {
      Serial.print("Output: ");
      Serial.print(isOn ? "ON" : "OFF");
      Serial.print(", Voltage: ");
      Serial.print(voltage, 2);
      Serial.print("V, Current: ");
      Serial.print(current, 3);
      Serial.print("A, Power: ");
      Serial.print(power, 3);
      Serial.println("W");
    } else {
      Serial.println("Failed to read output values");
    }
  } else if (input == "lock") {
    if (ps->setKeyLock(true)) {
      Serial.println("Front panel keys locked");
    } else {
      Serial.println("Failed to lock keys");
    }
  } else if (input == "unlock") {
    if (ps->setKeyLock(false)) {
      Serial.println("Front panel keys unlocked");
    } else {
      Serial.println("Failed to unlock keys");
    }
  } else if (input.startsWith("cv ")) {
    float voltage;
    if (parseFloat(input.substring(3), voltage)) {
      if (ps->setConstantVoltage(voltage)) {
        Serial.print("Constant voltage set to: ");
        Serial.println(voltage, 2);
      } else {
        Serial.println("Failed to set constant voltage");
      }
    }
  } else if (input.startsWith("cc ")) {
    float current;
    if (parseFloat(input.substring(3), current)) {
      if (ps->setConstantCurrent(current)) {
        Serial.print("Constant current set to: ");
        Serial.println(current, 3);
      } else {
        Serial.println("Failed to set constant current");
      }
    }
  } else if (input.startsWith("cp ")) {
    float power;
    if (parseFloat(input.substring(3), power)) {
      if (ps->setConstantPower(power)) {
        Serial.print("Constant power set to: ");
        Serial.print(power, 2);
        Serial.println(" W");
      } else {
        Serial.println("Failed to set constant power");
      }
    }
  } else if (input.startsWith("cpmode ")) {
    String mode = input.substring(7);
    mode.trim();
    
    if (mode == "on") {
      if (ps->setConstantPowerMode(true)) {
        Serial.println("Constant Power mode enabled");
      } else {
        Serial.println("Failed to enable Constant Power mode");
      }
    } 
    else if (mode == "off") {
      if (ps->setConstantPowerMode(false)) {
        Serial.println("Constant Power mode disabled");
      } else {
        Serial.println("Failed to disable Constant Power mode");
      }
    }
    else {
      Serial.println("Invalid option. Use 'on' or 'off'");
    }
  } else if (input == "status") {
    // Get current readings
    float voltage, current, power;
    bool isOn;
    
    if (ps->getOutputStatus(voltage, current, power, isOn)) {
      Serial.println("\n==== Output Status ====");
      
      Serial.print("Voltage: ");
      Serial.print(voltage, 2);
      Serial.println(" V");
      
      Serial.print("Current: ");
      Serial.print(current, 3);
      Serial.println(" A");
      
      Serial.print("Power:   ");
      Serial.print(power, 2);
      Serial.println(" W");
      
      Serial.print("Output:  ");
      if (isOn) {
        Serial.println("ON");
      } else {
        Serial.println("OFF");
      }
      
      // Front panel keys status
      bool keyLocked = ps->isKeyLocked(true); // Force refresh
      Serial.print("Keypad:  ");
      Serial.println(keyLocked ? "LOCKED" : "UNLOCKED");
      
      // Display CC/CV mode
      uint16_t cvccMode = ps->getCVCCState(true); // Force refresh
      Serial.print("Mode:    ");
      Serial.println(cvccMode == 0 ? "Constant Voltage (CV)" : "Constant Current (CC)");

      // After displaying the CC/CV mode, also display CP mode
      bool cpMode = ps->isConstantPowerModeEnabled(true);
      if (cpMode) {
        float cpValue = ps->getCachedConstantPower(true);
        Serial.print("CP Mode:  ");
        Serial.println("ENABLED");
        Serial.print("CP Value: ");
        Serial.print(cpValue, 2);
        Serial.println(" W");
      }
    } else {
      Serial.println("Failed to retrieve output status");
    }
  } else if (input.startsWith("group ")) {
    uint8_t groupNum;
    if (parseUInt8(input.substring(6), groupNum)) {
      if (groupNum <= 9) {
        xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
        if (ps->callMemoryGroup(group)) {
          Serial.print("Memory group M");
          Serial.print(groupNum);
          Serial.println(" activated");
          
          // Show the settings from the newly activated group
          delay(100); // Give device time to switch
          float voltage = ps->getSetVoltage(true);
          float current = ps->getSetCurrent(true);
          Serial.print("Voltage: ");
          Serial.print(voltage, 2);
          Serial.println(" V");
          Serial.print("Current: ");
          Serial.print(current, 3);
          Serial.println(" A");
        } else {
          Serial.println("Failed to switch to memory group");
        }
      } else {
        Serial.println("Invalid group number. Must be between 0 and 9.");
      }
    }
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

} // namespace serial_interface
// ===== END menu_basic.cpp =====


// ===== BEGIN menu_cd_data.cpp =====
namespace serial_interface {





void displayCDDataMenu() {
  Serial.println("\n==== Data Group Menu ====");
  Serial.println("list - List all data groups");
  Serial.println("set [group] - Select a data group (0-9) without applying settings");
  Serial.println("store [group] - Store current settings to a data group (0-9)");
  Serial.println("recall [group] - Recall settings from a data group (0-9) and apply them");
  Serial.println("readc [group] - Read current from a group (0-9)");
  Serial.println("readv [group] - Read voltage from a group (0-9)");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleCDDataMenu(const String& input, XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  if (input == "list") {
    // List all available data groups
    Serial.println("\n==== Available Data Groups ====");
    
    for (uint8_t i = 0; i <= 9; i++) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(i);
      uint16_t groupData[xy_sk::DATA_GROUP_REGISTERS];
      
      // Add a small delay between reads to avoid overwhelming the device
      if (i > 0) delay(200);
      
      // Force a refresh - don't use cached values since they may be incorrect
      bool success = false;
      for (int attempt = 0; attempt < 3 && !success; attempt++) {
        if (attempt > 0) {
          delay(200);  // Wait longer between retries
          Serial.print(".");
        }
        
        // Read directly from device, bypassing cache
        uint16_t addr = xy_sk::DataGroupManager::getGroupStartAddress(group);
        success = ps->readRegisters(addr, xy_sk::DATA_GROUP_REGISTERS, groupData);
      }
      
      if (success) {
        // Extract voltage and current values from the group data
        // Make sure we're using the correct offsets based on the actual device memory layout
        float voltage = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] / 100.0f;
        float current = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] / 1000.0f;
        
        // Use explicit offsets for OVP and OCP rather than enum values which might be incorrect
        float ovp = groupData[3] / 100.0f;  // OVP is at offset 3
        float ocp = groupData[4] / 1000.0f; // OCP is at offset 4
        
        // Apply sanity checks on values to detect corruption
        if (voltage > 100 || current > 10 || ovp > 100 || ocp > 10) {
          Serial.print("Group ");
          Serial.print(i);
          Serial.println(": Potentially invalid data");
        } else {
          Serial.print("Group ");
          Serial.print(i);
          Serial.print(": V=");
          Serial.print(voltage, 2);
          Serial.print("V, I=");
          Serial.print(current, 3);
          Serial.print("A, OVP=");
          Serial.print(ovp, 2);
          Serial.print("V, OCP=");
          Serial.print(ocp, 3);
          Serial.println("A");
        }
      } else {
        Serial.print("Group ");
        Serial.print(i);
        Serial.println(": Error reading values");
      }
    }
  } else if (input.startsWith("set ")) {
    // Set a data group - ONLY SELECTS without applying settings
    uint8_t groupNum;
    if (parseUInt8(input.substring(4), groupNum) && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      
      // Read the group data directly without calling the memory group
      uint16_t groupData[xy_sk::DATA_GROUP_REGISTERS];
      bool success = ps->readMemoryGroup(group, groupData, true);
      
      if (success) {
        Serial.print("Selected data group ");
        Serial.println(groupNum);
        
        // Display the selected group's stored values (not making them active)
        float voltage = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] / 100.0f;
        float current = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] / 1000.0f;
        Serial.print("Stored settings: ");
        Serial.print(voltage, 2);
        Serial.print("V, ");
        Serial.print(current, 3);
        Serial.println("A");
        Serial.println("Note: Settings are NOT applied. Use 'recall' to apply settings.");
      } else {
        Serial.println("Failed to read data group");
      }
    } else {
      Serial.println("Invalid group number. Use 0-9.");
    }
  } else if (input.startsWith("store ")) {
    // Store current settings to a data group
    uint8_t groupNum;
    if (parseUInt8(input.substring(6), groupNum) && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      
      // First read current device settings directly from registers instead of memory group
      float voltage = ps->getSetVoltage(true);  // Get directly from device
      float current = ps->getSetCurrent(true);  // Get directly from device
      
      // Create data array with valid values
      uint16_t activeData[xy_sk::DATA_GROUP_REGISTERS] = {0};
      
      // Set the values we care about (voltage and current)
      activeData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] = (uint16_t)(voltage * 100.0f);
      activeData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] = (uint16_t)(current * 1000.0f);
      
      // Write the prepared data to the specified group
      if (ps->writeMemoryGroup(group, activeData)) {
        Serial.print("Current settings stored to group ");
        Serial.println(groupNum);
        
        // Display what was stored
        Serial.print("Stored: ");
        Serial.print(voltage, 2);
        Serial.print("V, ");
        Serial.print(current, 3);
        Serial.println("A");
      } else {
        Serial.println("Failed to store settings");
      }
    } else {
      Serial.println("Invalid group number. Use 0-9.");
    }
  } else if (input.startsWith("recall ")) {
    // Recall settings from a data group
    uint8_t groupNum;
    if (parseUInt8(input.substring(7), groupNum) && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      
      // First read the values directly from the group registers
      uint16_t groupData[xy_sk::DATA_GROUP_REGISTERS];
      bool readSuccess = ps->readMemoryGroup(group, groupData, true);
      
      if (readSuccess) {
        // Extract voltage and current with proper divisors
        float voltage = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] / 100.0f;
        float current = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] / 1000.0f;
        
        // Check for invalid values that might indicate data corruption
        if (voltage > 60.0f || current > 10.0f) {
          Serial.println("Warning: Retrieved values appear invalid.");
          Serial.print("Raw voltage register: 0x");
          Serial.print(groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)], HEX);
          Serial.print(", Raw current register: 0x");
          Serial.println(groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)], HEX);
          
          // Attempt to use default safe values
          voltage = 5.0f;
          current = 1.0f;
          Serial.println("Using safe default values instead.");
        }
        
        // Check against device limits (XY-SK120 likely can't go above 5A)
        if (current > 5.0f) {
          float originalCurrent = current;
          current = 5.0f;
          Serial.print("Warning: Current value (");
          Serial.print(originalCurrent, 3);
          Serial.print("A) exceeds device limit, reduced to ");
          Serial.print(current, 3);
          Serial.println("A");
        }
        
        // Now try to apply the validated values
        bool success = ps->setVoltageAndCurrent(voltage, current);
        
        if (success) {
          Serial.print("Settings recalled from group ");
          Serial.println(groupNum);
          Serial.print("Applied: ");
          Serial.print(voltage, 2);
          Serial.print("V, ");
          Serial.print(current, 3);
          Serial.println("A");
        } else {
          Serial.println("Failed to apply settings");
        }
      } else {
        Serial.println("Failed to read memory group data");
      }
    } else {
      Serial.println("Invalid group number. Use 0-9.");
    }
  } else if (input.startsWith("readv ")) {
    // Read voltage from a group
    uint8_t groupNum;
    if (parseUInt8(input.substring(6), groupNum) && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      uint16_t value;
      
      if (ps->readGroupRegister(group, xy_sk::GroupRegisterOffset::VOLTAGE_SET, value)) {
        float voltage = value / 100.0f;
        Serial.print("Group ");
        Serial.print(groupNum);
        Serial.print(" voltage: ");
        Serial.print(voltage, 2);
        Serial.println("V");
      } else {
        Serial.println("Failed to read voltage");
      }
    } else {
      Serial.println("Invalid group number. Use 0-9.");
    }
  } else if (input.startsWith("readc ")) {
    // Read current from a group
    uint8_t groupNum;
    if (parseUInt8(input.substring(6), groupNum) && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      uint16_t value;
      
      if (ps->readGroupRegister(group, xy_sk::GroupRegisterOffset::CURRENT_SET, value)) {
        float current = value / 1000.0f;
        Serial.print("Group ");
        Serial.print(groupNum);
        Serial.print(" current: ");
        Serial.print(current, 3);
        Serial.println("A");
      } else {
        Serial.println("Failed to read current");
      }
    } else {
      Serial.println("Invalid group number. Use 0-9.");
    }
  } else if (input == "help") {
    displayCDDataMenu();
  } else if (input == "menu") {
    // Handle in the calling function
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

} // namespace serial_interface
// ===== END menu_cd_data.cpp =====


// ===== BEGIN menu_debug.cpp =====
namespace serial_interface {




void displayDebugMenu() {
  Serial.println("\n==== Debug Menu (Register R/W) ====");
  Serial.println("read [register] - Read register (decimal)");
  Serial.println("readhex [register] - Read register (hex)");
  Serial.println("write [register] [value] - Write register (decimal)");
  Serial.println("writehex [register] [value] - Write register (hex)");
  Serial.println("writerange [start] [end] [value] [delay_ms] - Write value to range of registers");
  Serial.println("mwrite [reg1] [val1] [reg2] [val2] ... - Write multiple registers (decimal)");
  Serial.println("mwritehex [reg1] [val1] [reg2] [val2] ... - Write multiple registers (hex)");
  Serial.println("writetrial [register] [start] [end] [delay_ms] - Try writing range of values to register");
  Serial.println("raw [function] [register] [count] - Read raw register block");
  Serial.println("scan [start] [end] - Scan register range");
  Serial.println("compare [start] [end] - Scan and compare register values before/after changing settings");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleDebugMenu(const String& input, XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  // Handle basic read/write commands
  if (input.startsWith("read") || input.startsWith("write") || 
      input.startsWith("mwrite") || input.startsWith("raw")) {
    handleDebugReadWrite(input, ps);
    return;
  }
  
  // Handle scan and compare commands
  if (input.startsWith("scan ")) {
    handleDebugScan(input, ps);
    return;
  }
  
  if (input.startsWith("compare ")) {
    handleDebugCompare(input, ps);
    return;
  }
  
  // Handle write trial command
  if (input.startsWith("writetrial ")) {
    handleDebugWriteTrial(input, ps);
    return;
  }
  
  // Handle write range command
  if (input.startsWith("writerange ")) {
    handleDebugWriteRange(input, ps);
    return;
  }
  
  // Handle help or unknown command
  if (input == "help") {
    displayDebugMenu();
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

} // namespace serial_interface
// ===== END menu_debug.cpp =====


// ===== BEGIN menu_debug_range.cpp =====
namespace serial_interface {



bool handleDebugWriteRange(const String& input, XY_SKxxx* ps) {
  // Format: writerange [start] [end] [value] [delay_ms]
  String params = input.substring(11);
  params.trim();
  
  // Parse parameters
  int firstSpace = params.indexOf(' ');
  int secondSpace = -1;
  int thirdSpace = -1;
  
  if (firstSpace > 0) {
    secondSpace = params.indexOf(' ', firstSpace + 1);
    if (secondSpace > 0) {
      thirdSpace = params.indexOf(' ', secondSpace + 1);
    }
  }
  
  if (firstSpace <= 0 || secondSpace <= 0) {
    Serial.println("Invalid format. Use: writerange [start] [end] [value] [delay_ms]");
    return false;
  }
  
  String startStr = params.substring(0, firstSpace);
  String endStr = params.substring(firstSpace + 1, secondSpace);
  String valueStr = thirdSpace > 0 ? 
                  params.substring(secondSpace + 1, thirdSpace) : 
                  params.substring(secondSpace + 1);
  
  // Parse delay if provided, otherwise use default
  uint16_t delayMs = 50; // Default delay of 50ms
  if (thirdSpace > 0) {
    String delayStr = params.substring(thirdSpace + 1);
    if (!parseUInt16(delayStr, delayMs)) {
      Serial.println("Invalid delay value. Using default 50ms.");
      delayMs = 50;
    }
  }
  
  // Parse hexadecimal addresses and value
  uint16_t startAddr, endAddr, value;
  if (!parseHex(startStr, startAddr) || !parseHex(endStr, endAddr) || !parseHex(valueStr, value)) {
    Serial.println("Invalid format. Use hexadecimal values (e.g. 0x001E)");
    return false;
  }
  
  // Validate range
  if (endAddr < startAddr) {
    Serial.println("End address must be greater than or equal to start address");
    return false;
  }
  
  // Limit range to prevent excessive writes
  if (endAddr - startAddr > 50) {
    Serial.println("Warning: Range too large. Limiting to 50 registers.");
    endAddr = startAddr + 50;
  }
  
  // Safety check for system registers
  if (startAddr < 0x0050) {
    Serial.print("Warning: You are about to write 0x");
    Serial.print(value, HEX);
    Serial.print(" to ");
    Serial.print(endAddr - startAddr + 1);
    Serial.println(" system registers.");
    Serial.println("This operation cannot be undone and might affect device operation.");
    Serial.println("Type 'y' and press Enter to proceed, or press any other key to abort.");
    Serial.println("Waiting for your input...");
    
    // Clear any existing input
    while (Serial.available()) {
      Serial.read();
    }
    
    // Wait for confirmation
    bool confirmed = false;
    unsigned long startTime = millis();
    
    while (millis() - startTime < 30000) { // 30 second timeout
      if (Serial.available()) {
        char c = Serial.read();
        
        if (c == 'y' || c == 'Y') {
          // Consume the rest of the line
          while (Serial.available()) {
            Serial.read();
          }
          confirmed = true;
          Serial.println("\nConfirmed. Proceeding with operation...");
          break;
        } else {
          Serial.println("\nOperation aborted by user");
          return false;
        }
      }
      delay(100);
    }
    
    if (!confirmed) {
      Serial.println("\nTimeout waiting for confirmation. Operation aborted.");
      return false;
    }
  }
  
  // Perform the writes
  Serial.print("Writing value 0x");
  Serial.print(value, HEX);
  Serial.print(" to registers 0x");
  Serial.print(startAddr, HEX);
  Serial.print(" - 0x");
  Serial.print(endAddr, HEX);
  Serial.print(" with ");
  Serial.print(delayMs);
  Serial.println("ms delay between writes");
  
  Serial.println("Register\tResult");
  Serial.println("--------\t------");
  
  int successCount = 0;
  int failureCount = 0;
  
  for (uint16_t addr = startAddr; addr <= endAddr; addr++) {
    // Write value to current register
    bool success = ps->writeRegister(addr, value);
    
    // Display result
    Serial.print("0x");
    if (addr < 0x1000) Serial.print("0");
    if (addr < 0x0100) Serial.print("0");
    if (addr < 0x0010) Serial.print("0");
    Serial.print(addr, HEX);
    Serial.print("\t");
    
    if (success) {
      Serial.println("OK");
      successCount++;
    } else {
      Serial.println("FAIL");
      failureCount++;
    }
    
    // Use the user-provided delay between writes
    delay(delayMs);
    
    // Check for abort
    if (Serial.available()) {
      Serial.read(); // Clear the character
      Serial.println("\nOperation aborted by user");
      break;
    }
  }
  
  Serial.println();
  Serial.print("Summary: ");
  Serial.print(successCount);
  Serial.print(" successful, ");
  Serial.print(failureCount);
  Serial.println(" failed");
  
  return true;
}

} // namespace serial_interface
// ===== END menu_debug_range.cpp =====


// ===== BEGIN menu_debug_readwrite.cpp =====
namespace serial_interface {



void handleDebugReadWrite(const String& input, XY_SKxxx* ps) {
  // Basic read commands
  if (input.startsWith("read ")) {
    handleDebugRead(input, ps);
  } 
  else if (input.startsWith("readhex ")) {
    handleDebugRead(input, ps);
  } 
  // Basic write commands
  else if (input.startsWith("write ") || input.startsWith("writehex ")) {
    handleDebugWrite(input, ps);
  }
  // Multi-write commands
  else if (input.startsWith("mwrite ") || input.startsWith("mwritehex ")) {
    handleDebugMultiWrite(input, ps);
  }
  // Raw read command
  else if (input.startsWith("raw ")) {
    handleDebugRaw(input, ps);
  }
}

bool handleDebugRead(const String& input, XY_SKxxx* ps) {
  bool isHex = input.startsWith("readhex ");
  int cmdLen = isHex ? 8 : 5;
  uint16_t reg;
  
  if (isHex) {
    if (!parseHex(input.substring(cmdLen), reg)) {
      Serial.println("Invalid hex register address");
      return false;
    }
  } else {
    if (!parseUInt16(input.substring(cmdLen), reg)) {
      Serial.println("Invalid register address");
      return false;
    }
  }
  
  uint16_t value;
  if (ps->readRegisters(reg, 1, &value)) {
    if (isHex) {
      Serial.print("Register 0x");
      Serial.print(reg, HEX);
      Serial.print(" (");
      Serial.print(reg);
      Serial.print("): 0x");
      Serial.print(value, HEX);
    } else {
      Serial.print("Register ");
      Serial.print(reg);
      Serial.print(" (0x");
      Serial.print(reg, HEX);
      Serial.print("): ");
      Serial.print(value);
      Serial.print(" (0x");
      Serial.print(value, HEX);
    }
    Serial.print(" (");
    Serial.print(value);
    Serial.println(")");
    return true;
  } else {
    Serial.println("Failed to read register");
    return false;
  }
}

bool handleDebugWrite(const String& input, XY_SKxxx* ps) {
  bool isHex = input.startsWith("writehex ");
  int cmdLen = isHex ? 9 : 6;
  int spacePos = input.indexOf(' ', cmdLen);
  
  if (spacePos <= 0) {
    Serial.println("Invalid format. Use: " + String(isHex ? "writehex" : "write") + " [register] [value]");
    return false;
  }
  
  uint16_t reg, value;
  if (isHex) {
    if (!parseHex(input.substring(cmdLen, spacePos), reg) ||
        !parseHex(input.substring(spacePos + 1), value)) {
      Serial.println("Invalid hex values");
      return false;
    }
  } else {
    if (!parseUInt16(input.substring(cmdLen, spacePos), reg) ||
        !parseUInt16(input.substring(spacePos + 1), value)) {
      Serial.println("Invalid values");
      return false;
    }
  }
  
  if (ps->writeRegister(reg, value)) {
    if (isHex) {
      Serial.print("Register 0x");
      Serial.print(reg, HEX);
      Serial.print(" written with value: 0x");
      Serial.println(value, HEX);
    } else {
      Serial.print("Register ");
      Serial.print(reg);
      Serial.print(" written with value: ");
      Serial.println(value);
    }
    return true;
  } else {
    Serial.println("Failed to write register");
    return false;
  }
}

bool handleDebugMultiWrite(const String& input, XY_SKxxx* ps) {
  bool isHex = input.startsWith("mwritehex ");
  String args = input.substring(isHex ? 10 : 7);
  args.trim();
  
  int maxPairs = 10; // Maximum number of register-value pairs to process
  uint16_t registers[maxPairs];
  uint16_t values[maxPairs];
  int pairCount = 0;
  
  int index = 0;
  while (args.length() > 0 && pairCount < maxPairs) {
    int spacePos = args.indexOf(' ');
    String token;
    
    if (spacePos > 0) {
      token = args.substring(0, spacePos);
      args = args.substring(spacePos + 1);
    } else {
      token = args;
      args = "";
    }
    
    token.trim();
    if (token.length() == 0) continue;
    
    if (index % 2 == 0) {
      // Register address
      if (isHex) {
        if (!parseHex(token, registers[pairCount])) {
          Serial.println("Invalid hex register address: " + token);
          return false;
        }
      } else {
        if (!parseUInt16(token, registers[pairCount])) {
          Serial.println("Invalid register address: " + token);
          return false;
        }
      }
    } else {
      // Register value
      if (isHex) {
        if (!parseHex(token, values[pairCount])) {
          Serial.println("Invalid hex register value: " + token);
          return false;
        }
      } else {
        if (!parseUInt16(token, values[pairCount])) {
          Serial.println("Invalid register value: " + token);
          return false;
        }
      }
      pairCount++;
    }
    
    index++;
  }
  
  if (index % 2 != 0 || pairCount == 0) {
    Serial.println("Invalid format. Need register-value pairs.");
    return false;
  }
  
  Serial.print("Writing to ");
  Serial.print(pairCount);
  Serial.println(isHex ? " registers (hex):" : " registers:");
  
  // Write each register-value pair
  bool allSuccess = true;
  for (int i = 0; i < pairCount; i++) {
    if (ps->writeRegister(registers[i], values[i])) {
      if (isHex) {
        Serial.print("Register 0x");
        Serial.print(registers[i], HEX);
        Serial.print(" = 0x");
        Serial.println(values[i], HEX);
      } else {
        Serial.print("Register ");
        Serial.print(registers[i]);
        Serial.print(" (0x");
        Serial.print(registers[i], HEX);
        Serial.print(") = ");
        Serial.print(values[i]);
        Serial.print(" (0x");
        Serial.print(values[i], HEX);
        Serial.println(")");
      }
    } else {
      if (isHex) {
        Serial.print("Failed to write register 0x");
        Serial.println(registers[i], HEX);
      } else {
        Serial.print("Failed to write register ");
        Serial.println(registers[i]);
      }
      allSuccess = false;
    }
    
    // Small delay between writes
    delay(50);
  }
  
  if (allSuccess) {
    Serial.println("All registers written successfully.");
  } else {
    Serial.println("Some registers failed to write.");
  }
  
  return allSuccess;
}

bool handleDebugRaw(const String& input, XY_SKxxx* ps) {
  int space1 = input.indexOf(' ', 4);
  int space2 = input.indexOf(' ', space1 + 1);
  
  if (space1 <= 0 || space2 <= 0) {
    Serial.println("Invalid format. Use: raw [function] [register] [count]");
    return false;
  }
  
  uint8_t function;
  uint16_t reg, count;
  
  if (!parseUInt8(input.substring(4, space1), function) ||
      !parseUInt16(input.substring(space1 + 1, space2), reg) ||
      !parseUInt16(input.substring(space2 + 1), count)) {
    Serial.println("Invalid format. Use: raw [function] [register] [count]");
    return false;
  }
  
  // Limit count to prevent buffer overflow
  if (count > 20) {
    count = 20;
    Serial.println("Limited count to 20 registers");
  }
  
  uint16_t* results = new uint16_t[count];
  
  if (ps->readRegisters(reg, count, results)) {
    Serial.print("Read registers starting at: ");
    Serial.print(reg);
    Serial.print(", count: ");
    Serial.println(count);
    
    for (uint16_t i = 0; i < count; i++) {
      Serial.print(reg + i);
      Serial.print(" (0x");
      Serial.print(reg + i, HEX);
      Serial.print("): ");
      Serial.print(results[i]);
      Serial.print(" (0x");
      Serial.print(results[i], HEX);
      Serial.println(")");
    }
    
    delete[] results;
    return true;
  } else {
    Serial.println("Failed to read registers");
    delete[] results;
    return false;
  }
}

} // namespace serial_interface
// ===== END menu_debug_readwrite.cpp =====


// ===== BEGIN menu_debug_scan.cpp =====
namespace serial_interface {



bool handleDebugScan(const String& input, XY_SKxxx* ps) {
  // Extract start and end addresses from the input
  int spacePos1 = input.indexOf(' ');
  int spacePos2 = input.indexOf(' ', spacePos1 + 1);
  
  if (spacePos2 <= 0) {
    Serial.println("Invalid format. Use: scan [start] [end]");
    return false;
  }
  
  String startStr = input.substring(spacePos1 + 1, spacePos2);
  String endStr = input.substring(spacePos2 + 1);
  
  // Remove any leading/trailing whitespace
  startStr.trim();
  endStr.trim();
  
  // Parse the hexadecimal addresses
  uint16_t startAddr, endAddr;
  if (!parseHex(startStr, startAddr) || !parseHex(endStr, endAddr)) {
    Serial.println("Invalid format. Use: scan 0x0000 0x00FF");
    return false;
  }
  
  // Validate address range
  if (endAddr < startAddr) {
    Serial.println("End address must be greater than or equal to start address");
    return false;
  }
  
  // Limit the range to prevent scanning too many registers at once
  if (endAddr - startAddr > 50) {
    Serial.println("Warning: Limiting scan to 50 registers maximum");
    endAddr = startAddr + 50;
  }
  
  // Perform the scan
  Serial.println("\n==== Register Scan ====");
  Serial.println("Addr \t| Value (Hex) | Value (Dec)");
  Serial.println("----------------------------");
  
  for (uint16_t addr = startAddr; addr <= endAddr; addr++) {
    uint16_t value;
    
    if (ps->readRegister(addr, value)) {
      Serial.print("0x");
      if (addr < 0x1000) Serial.print("0");
      if (addr < 0x0100) Serial.print("0");
      if (addr < 0x0010) Serial.print("0");
      Serial.print(addr, HEX);
      
      Serial.print("\t| 0x");
      if (value < 0x1000) Serial.print("0");
      if (value < 0x0100) Serial.print("0");
      if (value < 0x0010) Serial.print("0");
      Serial.print(value, HEX);
      
      Serial.print("\t| ");
      Serial.println(value);
    } else {
      Serial.print("0x");
      if (addr < 0x1000) Serial.print("0");
      if (addr < 0x0100) Serial.print("0");
      if (addr < 0x0010) Serial.print("0");
      Serial.print(addr, HEX);
      Serial.println("\t| ERROR");
    }
    
    // Small delay to avoid overwhelming the device
    delay(50);
  }
  
  return true;
}

bool handleDebugCompare(const String& input, XY_SKxxx* ps) {
  // Extract start and end addresses
  int spacePos1 = input.indexOf(' ');
  int spacePos2 = input.indexOf(' ', spacePos1 + 1);
  
  if (spacePos2 <= 0) {
    Serial.println("Invalid format. Use: compare [start] [end]");
    return false;
  }
  
  String startStr = input.substring(spacePos1 + 1, spacePos2);
  String endStr = input.substring(spacePos2 + 1);
  
  // Parse the hexadecimal addresses
  uint16_t startAddr, endAddr;
  if (!parseHex(startStr, startAddr) || !parseHex(endStr, endAddr)) {
    Serial.println("Invalid format. Use: compare 0x0000 0x00FF");
    return false;
  }
  
  // Validate address range
  if (endAddr < startAddr) {
    Serial.println("End address must be greater than or equal to start address");
    return false;
  }
  
  // Limit scan range
  if (endAddr - startAddr > 100) {
    Serial.println("Range too large. Limiting to 100 registers maximum");
    endAddr = startAddr + 100;
  }
  
  // Store initial values
  uint16_t* initialValues = new uint16_t[endAddr - startAddr + 1];
  bool* readSuccess = new bool[endAddr - startAddr + 1];
  
  Serial.println("\n==== REGISTER DISCOVERY TOOL ====");
  Serial.println("This tool helps identify undocumented registers by detecting changes");
  Serial.println("Step 1: Reading initial register values...");
  
  // Read initial values
  for (uint16_t addr = startAddr; addr <= endAddr; addr++) {
    uint16_t value;
    readSuccess[addr - startAddr] = ps->readRegister(addr, value);
    
    if (readSuccess[addr - startAddr]) {
      initialValues[addr - startAddr] = value;
      
      Serial.print("0x");
      if (addr < 0x1000) Serial.print("0");
      if (addr < 0x0100) Serial.print("0");
      if (addr < 0x0010) Serial.print("0");
      Serial.print(addr, HEX);
      Serial.print(" = 0x");
      if (value < 0x1000) Serial.print("0");
      if (value < 0x0100) Serial.print("0");
      if (value < 0x0010) Serial.print("0");
      Serial.println(value, HEX);
    }
    
    delay(25); // Small delay between reads
  }
  
  Serial.println("\nStep 2: Make a change on the device (examples):");
  Serial.println("         - Change mode (CV/CC/OFF/CP)");
  Serial.println("         - Adjust a knob or setting");
  Serial.println("         - Connect/disconnect a load");
  Serial.println("         Then press Enter to detect which registers changed...");
  
  // Clear existing input
  while (Serial.available()) {
    Serial.read();
  }
  
  // Wait for user input with better feedback
  bool timeout = true;
  unsigned long startTime = millis();
  String inputLine = "";
  
  while (millis() - startTime < 30000) { // 30 second timeout
    if (Serial.available()) {
      char c = Serial.read();
      Serial.print(c); // Echo character back to user for feedback
      
      if (c == '\n' || c == '\r') {
        timeout = false;
        Serial.println("\nInput received. Detecting register changes...");
        delay(500); // Add a short delay for user to see the acknowledgment
        break;
      } else {
        inputLine += c;
      }
    }
    delay(50);
  }
  
  if (timeout) {
    Serial.println("\nTimeout waiting for input. Discovery aborted.");
    delete[] initialValues;
    delete[] readSuccess;
    return false;
  }
  
  Serial.println("\nStep 3: Reading new values and identifying changed registers...");
  
  // Use fixed width columns instead of tabs for better alignment
  Serial.println("\nRegister   | Old Value  | New Value  | Change");
  Serial.println("------------|------------|------------|-------");
  
  // Read new values and compare
  for (uint16_t addr = startAddr; addr <= endAddr; addr++) {
    if (!readSuccess[addr - startAddr]) {
      continue; // Skip addresses that couldn't be read initially
    }
    
    uint16_t newValue;
    bool success = ps->readRegister(addr, newValue);
    
    if (success && newValue != initialValues[addr - startAddr]) {
      // Format register address
      char buffer[50];
      sprintf(buffer, "0x%04X     | 0x%04X     | 0x%04X     | +%d", 
              addr, 
              initialValues[addr - startAddr], 
              newValue, 
              newValue - initialValues[addr - startAddr]);
      Serial.println(buffer);
    }
    
    delay(25); // Small delay between reads
  }
  
  Serial.println("\nDiscovery complete. Registers that changed are shown above.");
  Serial.println("These may be undocumented registers controlling the function you modified.");
  Serial.println("\nSuggested ranges to try next:");
  Serial.println("- compare 0x0000 0x00FF (Common control registers)");
  Serial.println("- compare 0x0400 0x04FF (Extended function area)");
  Serial.println("- compare 0x1000 0x10FF (Manufacturer special functions)");
  Serial.println("- compare 0x0800 0x08FF (Alternative register space)");
  
  // Clean up
  delete[] initialValues;
  delete[] readSuccess;
  
  return true;
}

} // namespace serial_interface
// ===== END menu_debug_scan.cpp =====


// ===== BEGIN menu_debug_trial.cpp =====
namespace serial_interface {



bool handleDebugWriteTrial(const String& input, XY_SKxxx* ps) {
  // Format: writetrial [register] [start] [end] [delay_ms]
  String args = input.substring(11);
  args.trim();
  
  int argCount = 0;
  uint16_t reg = 0;
  uint16_t startVal = 0;
  uint16_t endVal = 0;
  uint16_t delayMs = 500; // Default delay

  // Parse arguments
  while (args.length() > 0) {
    int spacePos = args.indexOf(' ');
    String token;
    
    if (spacePos > 0) {
      token = args.substring(0, spacePos);
      args = args.substring(spacePos + 1);
    } else {
      token = args;
      args = "";
    }
    
    token.trim();
    if (token.length() == 0) continue;
    
    switch (argCount) {
      case 0: // Register address (hex)
        if (!parseHex(token, reg)) {
          Serial.println("Invalid hex register address: " + token);
          return false;
        }
        break;
      case 1: // Start value (hex)
        if (!parseHex(token, startVal)) {
          Serial.println("Invalid hex start value: " + token);
          return false;
        }
        break;
      case 2: // End value (hex)
        if (!parseHex(token, endVal)) {
          Serial.println("Invalid hex end value: " + token);
          return false;
        }
        break;
      case 3: // Delay in ms (decimal)
        uint16_t tempDelay;
        if (!parseUInt16(token, tempDelay)) {
          Serial.println("Invalid delay value: " + token);
          return false;
        }
        delayMs = tempDelay;
        break;
    }
    
    argCount++;
  }
  
  // Validate arguments
  if (argCount < 3) {
    Serial.println("Not enough arguments. Format: writetrial [register] [start] [end] [delay_ms]");
    return false;
  }
  
  if (startVal > endVal) {
    Serial.println("Start value must be less than or equal to end value");
    return false;
  }
  
  // Safety check - confirm with user for large ranges or system registers
  if ((endVal - startVal) > 10 || reg < 0x0050) {
    Serial.print("Warning: You are about to write ");
    Serial.print(endVal - startVal + 1);
    Serial.print(" values to register 0x");
    Serial.println(reg, HEX);
    
    if (reg == 0x001E) {
      Serial.println("This is REG_SYS_STATUS which may affect system operation.");
    }
    
    Serial.println("This operation cannot be undone and might affect device operation.");
    Serial.println("Type 'y' and press Enter to proceed, or press any other key to abort.");
    Serial.println("Waiting for your input...");
    
    // Clear any existing input
    while (Serial.available()) {
      Serial.read();
    }
    
    // Wait for input
    bool timeout = true;
    unsigned long startTime = millis();
    
    while (millis() - startTime < 30000) { // 30 second timeout
      if (Serial.available()) {
        // Read a single character
        char c = Serial.read();
        timeout = false;
        
        // Check if it's a 'y' or 'Y'
        if (c == 'y' || c == 'Y') {
          // Consume the rest of the line
          while (Serial.available()) {
            Serial.read();
          }
          Serial.println("\nConfirmed. Proceeding with operation...");
          break;
        } else {
          Serial.println("\nOperation aborted by user");
          return false;
        }
      }
      delay(100); // Less aggressive polling
    }
    
    // Handle timeout
    if (timeout) {
      Serial.println("\nTimeout waiting for confirmation. Operation aborted.");
      return false;
    }
  }
  
  // Read current value first for reference
  uint16_t currentValue;
  if (ps->readRegister(reg, currentValue)) {
    Serial.print("Current value of register 0x");
    Serial.print(reg, HEX);
    Serial.print(": 0x");
    Serial.print(currentValue, HEX);
    Serial.print(" (");
    Serial.print(currentValue);
    Serial.println(")");
  }
  
  // Proceed with writing values
  Serial.print("Writing values 0x");
  Serial.print(startVal, HEX);
  Serial.print(" to 0x");
  Serial.print(endVal, HEX);
  Serial.print(" to register 0x");
  Serial.println(reg, HEX);
  
  Serial.println("Press any key to abort...");
  Serial.println("\nValue\tResult\tObservations");
  Serial.println("-----\t------\t-----------");
  
  for (uint16_t val = startVal; val <= endVal; val++) {
    // Check for abort
    if (Serial.available()) {
      Serial.read(); // Clear the character
      Serial.println("\nOperation aborted by user");
      break;
    }
    
    // Write value
    Serial.print("0x");
    Serial.print(val, HEX);
    Serial.print("\t");
    
    bool success = ps->writeRegister(reg, val);
    
    if (success) {
      Serial.print("OK");
    } else {
      Serial.print("FAIL");
    }
    
    Serial.print("\t");
    Serial.println(); // Leave space for manual observations
    
    // Wait for specified delay
    delay(delayMs);
  }
  
  Serial.println("\nTrial completed. Record any observed effects on the device.");
  Serial.println("To read current register value, use 'readhex 0x" + String(reg, HEX) + "'");
  
  return true;
}

} // namespace serial_interface
// ===== END menu_debug_trial.cpp =====


// ===== BEGIN menu_main.cpp =====
namespace serial_interface {








  // Include the new WiFi menu header

void displayMainMenu() {
  Serial.println("\n==== Main Menu ====");
  Serial.println("1. Basic Control");
  Serial.println("2. Measurement");
  Serial.println("3. Protection");
  Serial.println("4. Settings");
  Serial.println("5. Debug (Register R/W)");
  Serial.println("6. CD Data Groups");
  Serial.println("7. WiFi Settings");  // Add the new menu option
  Serial.println("status - Show power supply status");
  Serial.println("prot - Show protection settings and status");
  Serial.println("config - Show current configuration");
  Serial.println("info - Display device information");
  Serial.println("help - Show this menu");
  Serial.println("Enter option number or command:");
}

void handleMainMenu(const String& input, XY_SKxxx* ps, XYModbusConfig& config) {
  if (input == "1") {
    setMenuState(MenuState::BASIC_CONTROL);
    displayBasicControlMenu();
  } else if (input == "2") {
    setMenuState(MenuState::MEASUREMENT_MENU);
    displayMeasurementMenu();
  } else if (input == "3") {
    setMenuState(MenuState::PROTECTION_MENU);
    displayProtectionMenu();
  } else if (input == "4") {
    setMenuState(MenuState::SETTINGS_MENU);
    displaySettingsMenu();
  } else if (input == "5") {
    setMenuState(MenuState::DEBUG_MENU);
    displayDebugMenu();
  } else if (input == "6") {
    setMenuState(MenuState::CD_DATA_MENU);
    displayCDDataMenu();
  } else if (input == "7") {  // Add handler for the new WiFi menu option
    setMenuState(MenuState::WIFI_MENU);
    displayWiFiMenu();
  } else if (input.equalsIgnoreCase("status")) {
    // Call the displayDeviceStatus function from serial_core.cpp
    displayDeviceStatus(ps);
  } else if (input.equalsIgnoreCase("config")) {
    displayConfig(config);
    return;
  } else if (input.equalsIgnoreCase("help")) {
    displayMainMenu();
  } else if (input.equalsIgnoreCase("info")) {
    displayDeviceInfo(ps);
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

} // namespace serial_interface
// ===== END menu_main.cpp =====


// ===== BEGIN menu_measurement.cpp =====
namespace serial_interface {



void displayMeasurementMenu() {
  Serial.println("\n==== Measurement Menu ====");
  Serial.println("volt - Read output voltage");
  Serial.println("curr - Read output current");
  Serial.println("power - Read output power");
  Serial.println("input - Read input voltage");
  Serial.println("temp - Read internal temperature");
  Serial.println("all - Read all measurements");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleMeasurementMenu(const String& input, XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  if (input == "volt") {
    float voltage = ps->getOutputVoltage(true);
    Serial.print("Output Voltage: ");
    Serial.print(voltage, 2);
    Serial.println(" V");
  } else if (input == "curr") {
    float current = ps->getOutputCurrent(true);
    Serial.print("Output Current: ");
    Serial.print(current, 3);
    Serial.println(" A");
  } else if (input == "power") {
    float power = ps->getOutputPower(true);
    Serial.print("Output Power: ");
    Serial.print(power, 3); // Changed from 2 to 3 decimal places
    Serial.println(" W");
  } else if (input == "input") {
    float inVoltage = ps->getInputVoltage(true);
    Serial.print("Input Voltage: ");
    Serial.print(inVoltage, 2);
    Serial.println(" V");
  } else if (input == "temp") {
    float temp = ps->getInternalTemperature(true);
    Serial.print("Internal Temperature: ");
    Serial.print(temp, 1);
    Serial.println(" 째C");
  } else if (input == "all") {
    float voltage = ps->getOutputVoltage(true);
    float current = ps->getOutputCurrent(true);
    float power = ps->getOutputPower(true);
    float inVoltage = ps->getInputVoltage(true);
    float temp = ps->getInternalTemperature(true);
    
    Serial.println("\n==== All Measurements ====");
    Serial.print("Output Voltage: ");
    Serial.print(voltage, 2);
    Serial.println(" V");
    
    Serial.print("Output Current: ");
    Serial.print(current, 3);
    Serial.println(" A");
    
    Serial.print("Output Power: ");
    Serial.print(power, 3); // Changed from 2 to 3 decimal places
    Serial.println(" W");
    
    Serial.print("Input Voltage: ");
    Serial.print(inVoltage, 2);
    Serial.println(" V");
    
    Serial.print("Internal Temperature: ");
    Serial.print(temp, 1);
    Serial.println(" 째C");
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

} // namespace serial_interface
// ===== END menu_measurement.cpp =====


// ===== BEGIN menu_protection.cpp =====
namespace serial_interface {




void displayProtectionMenu() {
  Serial.println("\n==== Protection Settings ====");
  Serial.println("get - Display all protection settings");
  Serial.println("ovp [value] - Set Over Voltage Protection (V)");
  Serial.println("ocp [value] - Set Over Current Protection (A)");
  Serial.println("opp [value] - Set Over Power Protection (W)");
  Serial.println("lvp [value] - Set Input Low Voltage Protection (V)");
  Serial.println("otp [value] - Set Over Temperature Protection (째C)");
  Serial.println("status - Read protection settings and status");
  Serial.println("prot - Show protection settings and status");
  Serial.println("clear - Clear protection triggers");
  Serial.println("btf [value] - Set Battery cutoff current (A, 0=off)");
  Serial.println("btf? - Get Battery cutoff current");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleProtectionMenu(const String& input, XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  if (input == "get") {
    // Display all protection settings
    displayDeviceProtectionStatus(ps);
  } else if (input.startsWith("ovp ")) {
    float voltage;
    if (parseFloat(input.substring(4), voltage)) {
      if (ps->setOverVoltageProtection(voltage)) {
        Serial.print("Over Voltage Protection set to: ");
        Serial.print(voltage, 2);
        Serial.println(" V");
      } else {
        Serial.println("Failed to set Over Voltage Protection");
      }
    }
  } else if (input.startsWith("ocp ")) {
    float current;
    if (parseFloat(input.substring(4), current)) {
      if (ps->setOverCurrentProtection(current)) {
        Serial.print("Over Current Protection set to: ");
        Serial.print(current, 3);
        Serial.println(" A");
      } else {
        Serial.println("Failed to set Over Current Protection");
      }
    }
  } else if (input.startsWith("opp ")) {
    float power;
    if (parseFloat(input.substring(4), power)) {
      if (ps->setOverPowerProtection(power)) {
        Serial.print("Over Power Protection set to: ");
        Serial.print(power, 2);
        Serial.println(" W");
      } else {
        Serial.println("Failed to set Over Power Protection");
      }
    }
  } else if (input.startsWith("lvp ")) {
    float voltage;
    if (parseFloat(input.substring(4), voltage)) {
      if (ps->setLowVoltageProtection(voltage)) {
        Serial.print("Input Low Voltage Protection set to: ");
        Serial.print(voltage, 2);
        Serial.println(" V");
      } else {
        Serial.println("Failed to set Input Low Voltage Protection");
      }
    }
  } else if (input.startsWith("otp ")) {
    float temp;
    if (parseFloat(input.substring(4), temp)) {
      if (ps->setOverTemperatureProtection(temp)) {
        Serial.print("Over Temperature Protection set to: ");
        Serial.print(temp, 1);
        Serial.println(" 째C");
      } else {
        Serial.println("Failed to set over-temperature protection");
      }
    }
  } else if (input == "status") {
    // Read protection settings
    float ovp, ocp, opp, otp;
    
    Serial.println("\n==== Protection Settings ====");
    
    if (ps->getOverVoltageProtection(ovp)) {
      Serial.print("Over Voltage Protection: ");
      Serial.print(ovp, 2);
      Serial.println(" V");
    } else {
      Serial.println("Failed to read OVP value");
    }
    
    if (ps->getOverCurrentProtection(ocp)) {
      Serial.print("Over Current Protection: ");
      Serial.print(ocp, 3);
      Serial.println(" A");
    } else {
      Serial.println("Failed to read OCP value");
    }
    
    if (ps->getOverPowerProtection(opp)) {
      Serial.print("Over Power Protection: ");
      Serial.print(opp, 2);
      Serial.println(" W");
    } else {
      Serial.println("Failed to read OPP value");
    }
    
    if (ps->getOverTemperatureProtection(otp)) {
      Serial.print("Over Temperature Protection: ");
      Serial.print(otp, 1);
      Serial.println(" 째C");
    } else {
      Serial.println("Failed to read OTP value");
    }
    
    // Check for triggered protections
    uint8_t protStatus = ps->getProtectionStatus();
    Serial.println("\n==== Protection Status ====");
    Serial.print("OVP triggered: ");
    Serial.println((protStatus & 0x01) ? "YES" : "NO");
    
    Serial.print("OCP triggered: ");
    Serial.println((protStatus & 0x02) ? "YES" : "NO");
    
    Serial.print("OPP triggered: ");
    Serial.println((protStatus & 0x04) ? "YES" : "NO");
    
    Serial.print("OTP triggered: ");
    Serial.println((protStatus & 0x08) ? "YES" : "NO");
  } else if (input == "clear") {
    // Since clearProtection doesn't exist, we'll try to write to a register
    // that might clear protections (this is a guess)
    if (ps->writeRegister(0x2001, 0x0001)) {
      Serial.println("Protection clear command sent");
    } else {
      Serial.println("Failed to clear protection triggers");
    }
  } else if (input.startsWith("btf ")) {
    float current;
    if (parseFloat(input.substring(4), current)) {
      if (ps->setBatteryCutoffCurrent(current)) {
        Serial.print("Battery cutoff current set to: ");
        if (current > 0) {
          Serial.print(current, 3);
          Serial.println(" A");
        } else {
          Serial.println("OFF");
        }
      } else {
        Serial.println("Failed to set battery cutoff current");
      }
    }
  } else if (input == "btf?") {
    float current;
    if (ps->getBatteryCutoffCurrent(current)) {
      Serial.print("Battery cutoff current: ");
      if (current > 0) {
        Serial.print(current, 3);
        Serial.println(" A");
      } else {
        Serial.println("OFF");
      }
    } else {
      Serial.println("Failed to read battery cutoff current");
    }
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

void displayDeviceProtectionStatus(XY_SKxxx* ps) {
  // Display all protection settings
  float ovp, ocp, opp, otp;
  
  Serial.println("\n==== Protection Settings ====");
  
  if (ps->getOverVoltageProtection(ovp)) {
    Serial.print("Over Voltage Protection: ");
    Serial.print(ovp, 2);
    Serial.println(" V");
  } else {
    Serial.println("Failed to read OVP value");
  }
  
  if (ps->getOverCurrentProtection(ocp)) {
    Serial.print("Over Current Protection: ");
    Serial.print(ocp, 3);
    Serial.println(" A");
  } else {
    Serial.println("Failed to read OCP value");
  }
  
  if (ps->getOverPowerProtection(opp)) {
    Serial.print("Over Power Protection: ");
    Serial.print(opp, 2);
    Serial.println(" W");
  } else {
    Serial.println("Failed to read OPP value");
  }
  
  if (ps->getOverTemperatureProtection(otp)) {
    Serial.print("Over Temperature Protection: ");
    Serial.print(otp, 1);
    Serial.println(" 째C");
  } else {
    Serial.println("Failed to read OTP value");
  }
  
  // Add battery cutoff current display
  float btf;
  if (ps->getBatteryCutoffCurrent(btf)) {
    Serial.print("Battery cutoff current: ");
    if (btf > 0) {
      Serial.print(btf, 3);
      Serial.println(" A");
    } else {
      Serial.println("OFF");
    }
  } else {
    Serial.println("Battery cutoff current: FAILED TO READ");
  }
  
  // Check for triggered protections
  uint8_t protStatus = ps->getProtectionStatus();
  Serial.println("\n==== Protection Status ====");
  Serial.print("OVP triggered: ");
  Serial.println((protStatus & 0x01) ? "YES" : "NO");
  
  Serial.print("OCP triggered: ");
  Serial.println((protStatus & 0x02) ? "YES" : "NO");
  
  Serial.print("OPP triggered: ");
  Serial.println((protStatus & 0x04) ? "YES" : "NO");
  
  Serial.print("OTP triggered: ");
  Serial.println((protStatus & 0x08) ? "YES" : "NO");
}

} // namespace serial_interface
// ===== END menu_protection.cpp =====


// ===== BEGIN menu_settings.cpp =====
namespace serial_interface {



  // Add this include to access displayMainMenu()

void displaySettingsMenu() {
  Serial.println("\n==== Device Settings ====");
  Serial.println("beeper [on/off] - Enable/disable beeper");
  Serial.println("brightness [level] - Set display brightness (1-5, 5 = brightest)");
  Serial.println("tempunit [c/f] - Set temperature unit (Celsius/Fahrenheit)");
  Serial.println("sleep [0-30] - Set sleep timeout (minutes, 0:off)");
  Serial.println("--------------------------");
  Serial.println("slave [1-247] - Set Modbus slave address");
  Serial.println("baud [0-8] - Set baudrate (0:9600, 1:14400, 2:19200, 3:38400,");
  Serial.println("              4:56000, 5:57600, 6:115200, 7:2400, 8:4800)");
  Serial.println("rxpin [pin] - Set Modbus RX pin number");
  Serial.println("txpin [pin] - Set Modbus TX pin number");
  Serial.println("--------------------------");
  Serial.println("mppt [on/off] - Enable/disable MPPT (Maximum Power Point Tracking)");
  Serial.println("mpptthr [value] - Set MPPT threshold (0-100%, default 80%)");
  Serial.println("--------------------------");
  Serial.println("default - Restore device to factory defaults");
  Serial.println("--------------------------");
  Serial.println("save - Save current settings to device");
  Serial.println("saveconfig - Save local configuration to flash");
  Serial.println("--------------------------");
  Serial.println("showsettings - Display all device settings");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleSettingsMenu(const String& input, XY_SKxxx* ps, XYModbusConfig& config) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  if (input == "showsettings") {
    displayAllDeviceSettings(ps);
  } else if (input.startsWith("baudrate ")) {
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
      if (ps->setSlaveAddress(address)) {
        Serial.print("Modbus address set to: ");
        Serial.println(address);
        Serial.println("You must save and restart the device for this to take effect");
      } else {
        Serial.println("Failed to set Modbus address");
      }
    }
  } else if (input.startsWith("slave ")) {
    uint8_t address;
    if (parseUInt8(input.substring(6), address)) {
      if (address >= 1 && address <= 247) {
        if (ps->setSlaveAddress(address)) {
          Serial.print("Slave address set to: ");
          Serial.println(address);
          Serial.println("You must save settings for this to take effect");
        } else {
          Serial.println("Failed to set slave address");
        }
      } else {
        Serial.println("Invalid address. Must be between 1-247.");
      }
    }
  } else if (input.startsWith("brightness ")) {
    uint8_t level;
    if (parseUInt8(input.substring(11), level)) {
      if (level >= 1 && level <= 5) {
        if (ps->setBacklightBrightness(level)) {
          Serial.print("Display brightness set to: ");
          Serial.println(level);
        } else {
          Serial.println("Failed to set display brightness");
        }
      } else {
        Serial.println("Invalid brightness level. Must be between 1-5.");
      }
    }
  } else if (input.startsWith("tempunit ")) {
    String unit = input.substring(9);
    unit.toLowerCase();
    unit.trim();
    
    if (unit == "c") {
      if (ps->setTemperatureUnit(false)) {
        Serial.println("Temperature unit set to Celsius");
      } else {
        Serial.println("Failed to set temperature unit");
      }
    } else if (unit == "f") {
      if (ps->setTemperatureUnit(true)) {
        Serial.println("Temperature unit set to Fahrenheit");
      } else {
        Serial.println("Failed to set temperature unit");
      }
    } else {
      Serial.println("Invalid unit. Use 'c' for Celsius or 'f' for Fahrenheit");
    }
  } else if (input.startsWith("sleep ")) {
    uint8_t timeout;
    if (parseUInt8(input.substring(6), timeout)) {
      if (timeout <= 30) {
        if (ps->setSleepTimeout(timeout)) {
          if (timeout == 0) {
            Serial.println("Sleep function disabled");
          } else {
            Serial.print("Sleep timeout set to ");
            Serial.print(timeout);
            Serial.println(" minutes");
          }
        } else {
          Serial.println("Failed to set sleep timeout");
        }
      } else {
        Serial.println("Invalid timeout. Must be between 0-30.");
      }
    }
  } else if (input.startsWith("rxpin ")) {
    uint8_t pin;
    String pinStr = input.substring(6);
    if (parseUInt8(pinStr, pin)) {
      config.rxPin = pin;
      Serial.println("RX pin set to " + String(pin));
    }
  } else if (input.startsWith("txpin ")) {
    uint8_t pin;
    String pinStr = input.substring(6);
    if (parseUInt8(pinStr, pin)) {
      config.txPin = pin;
      Serial.println("TX pin set to " + String(pin));
    }
  } else if (input == "save") {
    if (ps->updateDeviceSettings()) {
      Serial.println("Settings saved to device");
    } else {
      Serial.println("Failed to save settings");
    }
  } else if (input == "default") {
    if (ps->restoreFactoryDefaults()) {
      Serial.println("Factory defaults restored");
      Serial.println("Device will restart. Please reconnect with default settings.");
    } else {
      Serial.println("Failed to restore factory defaults");
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
  } else if (input.startsWith("mppt ")) {
    String subCmd = input.substring(5);
    subCmd.trim();
    
    if (subCmd == "on") {
      if (ps->setMPPTEnable(true)) {
        Serial.println("MPPT mode enabled");
      } else {
        Serial.println("Failed to enable MPPT mode");
      }
    } else if (subCmd == "off") {
      if (ps->setMPPTEnable(false)) {
        Serial.println("MPPT mode disabled");
      } else {
        Serial.println("Failed to disable MPPT mode");
      }
    } else {
      Serial.println("Invalid option. Use 'on' or 'off'");
    }
  } else if (input.startsWith("mpptthr ")) {
    float threshold;
    if (parseFloat(input.substring(8), threshold)) {
      // Convert from percentage (0-100) to decimal (0-1)
      if (threshold >= 0 && threshold <= 100) {
        threshold /= 100.0f;
        if (ps->setMPPTThreshold(threshold)) {
          Serial.print("MPPT threshold set to ");
          Serial.print(threshold * 100, 0);
          Serial.println("%");
        } else {
          Serial.println("Failed to set MPPT threshold");
        }
      } else {
        Serial.println("Invalid threshold. Must be between 0-100%.");
      }
    }
  } else if (input.startsWith("baud ")) {
    uint8_t baudCode;
    if (parseUInt8(input.substring(5), baudCode)) {
      if (baudCode <= 8) {
        if (ps->setBaudRate(baudCode)) {
          Serial.print("Baud rate code set to: ");
          Serial.println(baudCode);
          
          long newBaud;
          switch (baudCode) {
            case 0: newBaud = 9600; break;
            case 1: newBaud = 14400; break;
            case 2: newBaud = 19200; break;
            case 3: newBaud = 38400; break;
            case 4: newBaud = 56000; break;
            case 5: newBaud = 57600; break;
            case 6: newBaud = 115200; break;
            case 7: newBaud = 2400; break;
            case 8: newBaud = 4800; break;
            default: newBaud = 9600;
          }
          
          Serial.print("New baud rate will be: ");
          Serial.print(newBaud);
          Serial.println(" bps");
          Serial.println("You must save settings and restart the device for this to take effect");
          
          // Update the local config too
          config.baudRate = newBaud;
        } else {
          Serial.println("Failed to set baud rate");
        }
      } else {
        Serial.println("Invalid baud code. Must be between 0-8.");
      }
    }
  } else if (input == "help") {
    displaySettingsMenu();
  } else if (input == "menu") {
    setMenuState(MenuState::MAIN_MENU);
    displayMainMenu();
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

// Keep the existing displayDeviceSettings function for backward compatibility
void displayDeviceSettings(XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  // Basic device settings
  Serial.println("\n==== Device Settings ====");
  
  // Beeper status
  bool beeperEnabled;
  if (ps->getBeeper(beeperEnabled)) {
    Serial.print("Beeper: ");
    Serial.println(beeperEnabled ? "ENABLED" : "DISABLED");
  }
  
  // Brightness
  uint8_t brightness = ps->getBacklightBrightness();
  if (brightness > 0) {
    Serial.print("Display Brightness: ");
    Serial.print(brightness);
    Serial.println(" (1-5)");
  }
  
  // Sleep timeout
  uint8_t sleepTimeout = ps->getSleepTimeout();
  if (sleepTimeout != 255) {
    Serial.print("Sleep Timeout: ");
    if (sleepTimeout == 0) {
      Serial.println("Never");
    } else {
      Serial.print(sleepTimeout);
      Serial.println(" minutes");
    }
  }
}

// New comprehensive settings display function
void displayAllDeviceSettings(XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  Serial.println("\n===== All Device Settings =====");
  
  // Basic device settings
  bool beeperEnabled;
  if (ps->getBeeper(beeperEnabled)) {
    Serial.print("Beeper: ");
    Serial.println(beeperEnabled ? "ENABLED" : "DISABLED");
  }
  
  // Display settings
  uint8_t brightness = ps->getBacklightBrightness();
  if (brightness > 0) {
    Serial.print("Display Brightness: ");
    Serial.print(brightness);
    Serial.println(" (1-5)");
  }
  
  // Sleep settings
  uint8_t sleepTimeout = ps->getSleepTimeout();
  if (sleepTimeout != 255) {
    Serial.print("Sleep Timeout: ");
    if (sleepTimeout == 0) {
      Serial.println("Never");
    } else {
      Serial.print(sleepTimeout);
      Serial.println(" minutes");
    }
  }
  
  // Temperature settings
  bool isCelsius;
  if (ps->getTemperatureUnit(isCelsius)) {
    Serial.print("Temperature Unit: ");
    Serial.println(isCelsius ? "Fahrenheit" : "Celsius");
  }
  
  // Key lock status
  bool keyLocked = ps->isKeyLocked(true);
  Serial.print("Front Panel Keys: ");
  Serial.println(keyLocked ? "LOCKED" : "UNLOCKED");
  
  // Beeper settings
  if (ps->getBeeper(beeperEnabled)) {
    Serial.print("Beeper: ");
    Serial.println(beeperEnabled ? "ENABLED" : "DISABLED");
  }
  
  // MPPT settings
  bool mpptEnabled;
  if (ps->getMPPTEnable(mpptEnabled)) {
    Serial.print("MPPT Mode: ");
    Serial.println(mpptEnabled ? "ENABLED" : "DISABLED");
    
    if (mpptEnabled) {
      float mpptThreshold;
      if (ps->getMPPTThreshold(mpptThreshold)) {
        Serial.print("MPPT Threshold: ");
        Serial.print(mpptThreshold * 100, 0);
        Serial.println("%");
      }
    }
  }
  
  // Battery settings
  float btfCurrent;
  if (ps->getBatteryCutoffCurrent(btfCurrent)) {
    Serial.print("Battery Cutoff Current: ");
    if (btfCurrent > 0) {
      Serial.print(btfCurrent, 3);
      Serial.println(" A");
    } else {
      Serial.println("OFF");
    }
  }
  
  // Power-on initialization setting
  bool outputOnAtStartup;
  if (ps->getPowerOnInitialization(outputOnAtStartup)) {
    Serial.print("Output On At Startup: ");
    Serial.println(outputOnAtStartup ? "YES" : "NO");
  }
  
  Serial.println();
}

} // namespace serial_interface
// ===== END menu_settings.cpp =====


// ===== BEGIN menu_wifi.cpp =====
namespace serial_interface {
// This file is now just a stub that includes the functionality 
// from the refactored modules.









// Display WiFi menu
void displayWiFiMenu() {
  Serial.println("\n==== WiFi Settings ====");
  Serial.println("scan - Scan for WiFi networks");
  Serial.println("connect \"ssid\" \"password\" - Connect to a WiFi network");
  Serial.println("ap \"ssid\" \"password\" - Set up a WiFi access point");
  Serial.println("exit - Exit AP mode and return to station mode");
  Serial.println("status - Show current WiFi status");
  Serial.println("ip - Show IP configuration");
  Serial.println("savedwifi - Display saved WiFi networks");
  Serial.println("addwifi \"ssid\" \"password\" [priority] - Add network to saved list");
  Serial.println("syncwifi - Sync current WiFi to saved networks");
  Serial.println("repairwifi - Repair corrupted WiFi credentials");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
  Serial.println("Note: Use quotes for SSIDs containing spaces (e.g., connect \"My WiFi\" \"pass123\")");
}

// Handle WiFi menu commands
void handleWiFiMenu(const String& input, XY_SKxxx* ps) {
  if (input == "scan") {
    scanWiFiNetworks();
  } else if (input == "status") {
    displayWiFiStatus();
  } else if (input == "ip") {
    displayIPInfo();
  } else if (input == "savedwifi") {
    displaySavedWiFiNetworks();
  } else if (input == "syncwifi") {
    syncCurrentWiFi();
  } else if (input == "repairwifi") {
    Serial.println("Attempting to repair WiFi credentials...");
    if (repairWiFiCredentials()) {
      Serial.println("WiFi credentials repaired successfully.");
      displaySavedWiFiNetworks();
    } else {
      Serial.println("Failed to repair WiFi credentials.");
    }
  } else if (input.startsWith("connect ")) {
    String remainingInput = input.substring(8);
    String ssid, password;
    String unused;
    bool quoted = extractQuotedParameters(remainingInput, ssid, password, unused);
    
    if (!quoted) {
      // Try space-based parsing as fallback
      int spaceIndex = remainingInput.indexOf(' ');
      if (spaceIndex > 0) {
        ssid = remainingInput.substring(0, spaceIndex);
        password = remainingInput.substring(spaceIndex + 1);
      } else {
        ssid = remainingInput;
        password = "";
      }
    }
    
    if (ssid.isEmpty()) {
      Serial.println("Invalid format. Use: connect \"Your SSID\" \"Your Password\"");
      return;
    }
    
    Serial.println("Command: connect \"" + ssid + "\" \"" + password + "\"");
    connectToWiFi(ssid, password);
  } else if (input.startsWith("ap ")) {
    String remainingInput = input.substring(3);
    String ssid, password;
    String unused;
    bool quoted = extractQuotedParameters(remainingInput, ssid, password, unused);
    
    if (!quoted) {
      // Try space-based parsing as fallback
      int spaceIndex = remainingInput.indexOf(' ');
      if (spaceIndex > 0) {
        ssid = remainingInput.substring(0, spaceIndex);
        password = remainingInput.substring(spaceIndex + 1);
      } else {
        ssid = remainingInput;
        password = "";
      }
    }
    
    if (ssid.isEmpty()) {
      Serial.println("Invalid format. Use: ap \"Your AP SSID\" \"Your AP Password\"");
      return;
    }
    
    Serial.println("Command: ap \"" + ssid + "\" \"" + password + "\"");
    setupWiFiAP(ssid, password);
  } else if (input.startsWith("addwifi ")) {
    String remainingInput = input.substring(8);
    String ssid, password;
    String leftover;
    
    bool quoted = extractQuotedParameters(remainingInput, ssid, password, leftover);
    
    if (!quoted) {
      // Try space-based parsing as fallback
      int firstSpace = remainingInput.indexOf(' ');
      if (firstSpace > 0) {
        ssid = remainingInput.substring(0, firstSpace);
        remainingInput = remainingInput.substring(firstSpace + 1);
        
        int secondSpace = remainingInput.indexOf(' ');
        if (secondSpace > 0) {
          password = remainingInput.substring(0, secondSpace);
          leftover = remainingInput.substring(secondSpace + 1);
        } else {
          password = remainingInput;
          leftover = "";
        }
      } else {
        Serial.println("Invalid format. Use: addwifi \"Your SSID\" \"Your Password\" [priority]");
        return;
      }
    }
    
    // Check for priority (optional parameter)
    int priority = 1; // Default priority
    leftover.trim();
    if (leftover.length() > 0 && isDigit(leftover.charAt(0))) {
      priority = leftover.toInt();
    }
    
    Serial.println("Command: addwifi \"" + ssid + "\" \"" + password + "\" " + priority);
    
    // Call the handler function
    handleAddWifi(input, ssid, password, priority);
  } else if (input == "help") {
    displayWiFiMenu();
  } else if (input == "menu") {
    setMenuState(MenuState::MAIN_MENU);
    displayMainMenu();
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}

// Helper function to extract quoted parameters from a command
bool extractQuotedParameters(const String& input, String& param1, String& param2, String& remaining) {
  // Reset parameters
  param1 = "";
  param2 = "";
  remaining = input;
  
  // First quoted parameter
  int firstQuoteStart = input.indexOf('"');
  if (firstQuoteStart < 0) return false;
  
  int firstQuoteEnd = input.indexOf('"', firstQuoteStart + 1);
  if (firstQuoteEnd < 0) return false;
  
  param1 = input.substring(firstQuoteStart + 1, firstQuoteEnd);
  
  // Second quoted parameter (optional)
  int secondQuoteStart = input.indexOf('"', firstQuoteEnd + 1);
  if (secondQuoteStart >= 0) {
    int secondQuoteEnd = input.indexOf('"', secondQuoteStart + 1);
    if (secondQuoteEnd >= 0) {
      param2 = input.substring(secondQuoteStart + 1, secondQuoteEnd);
      
      // Extract remaining text after second quote
      if (secondQuoteEnd + 1 < input.length()) {
        remaining = input.substring(secondQuoteEnd + 1);
      } else {
        remaining = "";
      }
    }
  } else {
    // No second parameter, extract remaining text after first quote
    if (firstQuoteEnd + 1 < input.length()) {
      remaining = input.substring(firstQuoteEnd + 1);
    } else {
      remaining = "";
    }
  }
  
  return true;
}

} // namespace serial_interface
// ===== END menu_wifi.cpp =====


// ===== BEGIN menu_wifi_connect.cpp =====
namespace serial_interface {



bool exitAPMode() {
  if (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA) {
    // Stop the AP
    bool success = WiFi.softAPdisconnect(true);
    // Set to station mode
    WiFi.mode(WIFI_STA);
    // Ensure any ongoing scans are stopped
    WiFi.scanDelete();
    delay(100);
    return success;
  }
  // Already in station mode or off
  WiFi.mode(WIFI_STA);
  return false;
}

bool connectToWiFi(const String& ssid, const String& password) {
  // Disconnect if already connected
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect();
    delay(100);
  }
  
  // Set to station mode
  WiFi.mode(WIFI_STA);
  delay(100);
  
  // Connect to WiFi network
  WiFi.begin(ssid.c_str(), password.c_str());
  
  // Wait up to 20 seconds for connection
  Serial.print("Connecting to WiFi");
  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 40) {
    delay(500);
    Serial.print(".");
    attempt++;
  }
  Serial.println();
  
  // Return true if connected
  return WiFi.status() == WL_CONNECTED;
}

bool setupWiFiAP(const String& ssid, const String& password) {
  // Disconnect if in station mode
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect();
    delay(100);
  }
  
  // Set to AP mode
  WiFi.mode(WIFI_AP);
  delay(100);
  
  // Configure and start the AP
  return WiFi.softAP(ssid.c_str(), password.c_str());
}

} // namespace serial_interface
// ===== END menu_wifi_connect.cpp =====


// ===== BEGIN menu_wifi_core.cpp =====
namespace serial_interface {





  // Add this include for ArduinoJson functionality


// Function declarations for functions defined in this file
void handleSaveCurrentWiFi();
void displayIPInfo();
void syncCurrentWiFi();
void handleAddWifi(const String& input, String ssid, String password, int priority);

// External declarations for functions in other files
extern bool extractQuotedParameters(const String& input, String& command, String& param1, String& param2);
extern bool exitConfigPortal();
extern String sanitizeString(const String& input);

// Helper function to handle saving current WiFi
void handleSaveCurrentWiFi() {
  // Check if connected to WiFi
  if (WiFi.status() == WL_CONNECTED) {
    String currentSSID = WiFi.SSID();
    
    Serial.print("Currently connected to: ");
    Serial.println(currentSSID);
    Serial.println("Saving this network to saved networks...");
    
    // Ask for password
    Serial.println("Current password cannot be retrieved from the ESP32.");
    Serial.println("Please enter the password for this network: ");
    
    // Wait for user to input password
    String userPassword = "";
    unsigned long startTime = millis();
    while ((millis() - startTime) < 30000) { // 30 second timeout
      if (Serial.available()) {
        userPassword = Serial.readStringUntil('\n');
        userPassword.trim();
        break;
      }
      delay(100);
    }
    
    if (userPassword.length() == 0) {
      Serial.println("No password entered or timeout occurred. Aborting save operation.");
      return;
    }
    
    // Save to NVS with highest priority (1)
    if (saveWiFiCredentialsToNVS(currentSSID, userPassword, 1)) {
      Serial.println("WiFi credentials saved successfully!");
      Serial.println("Network will be used with priority 1 (highest) for future connections.");
    } else {
      Serial.println("Failed to save WiFi credentials.");
    }
  } else {
    Serial.println("Not connected to any WiFi network. Cannot save.");
  }
}

// Display IP information
void displayIPInfo() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Subnet Mask: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("DNS: ");
    Serial.println(WiFi.dnsIP());
  } else if (WiFi.getMode() == WIFI_AP) {
    Serial.print("AP IP Address: ");
    Serial.println(WiFi.softAPIP());
  } else {
    Serial.println("Not connected to WiFi or AP mode not active");
  }
}

// Enhanced syncCurrentWiFi function
void syncCurrentWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    String currentSSID = WiFi.SSID();
    
    Serial.print("Force syncing current WiFi (");
    Serial.print(currentSSID);
    Serial.println(") to saved networks...");
    
    // Get password from user
    Serial.println("Please enter the password for this network:");
    String password = "";
    unsigned long startTime = millis();
    while ((millis() - startTime) < 30000) { // 30 second timeout
      if (Serial.available()) {
        password = Serial.readStringUntil('\n');
        password.trim();
        break;
      }
      delay(100);
    }
    
    if (password.isEmpty()) {
      Serial.println("No password entered, aborting sync.");
      return;
    }
    
    // First, check if we have valid JSON in WiFi credentials
    Preferences prefs;
    bool needsReset = false;
    
    if (prefs.begin(WIFI_NAMESPACE, true)) {
      String existingJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
      prefs.end();
      
      // Test if it's valid JSON
      DynamicJsonDocument testDoc(WIFI_CREDENTIALS_JSON_SIZE);
      DeserializationError error = deserializeJson(testDoc, existingJson);
      
      if (error) {
        Serial.println("Found invalid JSON in saved WiFi credentials. Resetting.");
        needsReset = true;
      }
    }
    
    // If JSON is invalid, reset it
    if (needsReset) {
      if (prefs.begin(WIFI_NAMESPACE, false)) {
        prefs.putString(WIFI_CREDENTIALS_KEY, "[]");
        prefs.end();
        Serial.println("Reset WiFi credentials storage to empty array.");
      }
    }
    
    // Now explicitly create the proper JSON structure and save
    String wifiListJson = loadWiFiCredentialsFromNVS();
    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    
    if (wifiListJson == "[]") {
      // Create a new array
      JsonArray networks = doc.to<JsonArray>();
      
      // Add the network with priority 1
      JsonObject network = networks.createNestedObject();
      network["ssid"] = currentSSID;
      network["password"] = password;
      network["priority"] = 1;
    } else {
      // Parse existing JSON
      DeserializationError error = deserializeJson(doc, wifiListJson);
      if (!error) {
        // Get networks array
        JsonArray networks = doc.as<JsonArray>();
        
        // Check if this network already exists
        bool networkExists = false;
        for (JsonObject network : networks) {
          String savedSSID = network["ssid"].as<String>();
          if (savedSSID == currentSSID) {
            // Update the password and priority
            network["password"] = password;
            network["priority"] = 1;
            networkExists = true;
            break;
          }
        }
        
        // If network doesn't exist, add it with priority 1
        if (!networkExists) {
          // First increment all priorities
          for (JsonObject network : networks) {
            int priority = network["priority"];
            network["priority"] = priority + 1;
          }
          
          // Add the new network
          JsonObject network = networks.createNestedObject();
          network["ssid"] = currentSSID;
          network["password"] = password;
          network["priority"] = 1;
        }
      }
    }
    
    // Serialize and save
    String jsonOutput;
    serializeJson(doc, jsonOutput);
    
    // Log the JSON for debugging
    Serial.print("New JSON to save: ");
    Serial.println(jsonOutput);
    
    // Save to NVS
    if (prefs.begin(WIFI_NAMESPACE, false)) {
      bool success = prefs.putString(WIFI_CREDENTIALS_KEY, jsonOutput);
      prefs.end();
      
      if (success) {
        Serial.println("Successfully saved WiFi to NVS with proper format!");
      } else {
        Serial.println("Failed to save WiFi credentials. Check NVS storage.");
      }
    }
    
    // Verify save
    if (prefs.begin(WIFI_NAMESPACE, true)) {
      String jsonAfter = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
      prefs.end();
      
      Serial.println("Current saved WiFi data: " + jsonAfter);
    }
  } else {
    Serial.println("Not connected to WiFi. Cannot sync.");
  }
}

// New command to add WiFi without connecting
void handleAddWifi(const String& input, String ssid, String password, int priority) {
  // Sanitize inputs
  String cleanSsid = sanitizeString(ssid);
  String cleanPassword = sanitizeString(password);
  
  // Alert if there was sanitization
  if (ssid != cleanSsid || password != cleanPassword) {
    Serial.println("Input sanitized: Control characters removed from WiFi credentials");
    
    // Update to use clean versions
    ssid = cleanSsid;
    password = cleanPassword;
  }
  
  Serial.print("Adding WiFi network to saved list: ");
  Serial.print(ssid);
  Serial.print(" with priority: ");
  Serial.println(priority);
  
  // Get saved networks JSON
  Preferences prefs;
  String wifiListJson;
  
  if (prefs.begin(WIFI_NAMESPACE, true)) { // Read-only mode first
    wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    prefs.end();
  } else {
    Serial.println("Failed to access saved WiFi information.");
    return;
  }
  
  // Parse existing JSON
  DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
  DeserializationError error = deserializeJson(doc, wifiListJson);
  
  if (error) {
    Serial.println("Error parsing saved WiFi networks. Creating new list.");
    doc.clear();
    doc = JsonArray(); // Ensure it's initialized as an array
  }
  
  // Check if this network already exists
  JsonArray networks = doc.as<JsonArray>();
  bool networkExists = false;
  
  for (JsonObject network : networks) {
    String savedSSID = network["ssid"].as<String>();
    if (savedSSID == ssid) {
      // Update existing network
      network["password"] = password;
      network["priority"] = priority;
      networkExists = true;
      break;
    }
  }
  
  // If network doesn't exist, add it
  if (!networkExists) {
    JsonObject network = networks.createNestedObject();
    network["ssid"] = ssid;
    network["password"] = password;
    network["priority"] = priority;
  }
  
  // Serialize back to string
  String updatedJson;
  serializeJson(doc, updatedJson);
  
  // Debug output
  Serial.print("WiFi credentials JSON size: ");
  Serial.println(updatedJson.length());
  Serial.print("WiFi credentials JSON content: ");
  Serial.println(updatedJson);
  
  // Save back to NVS
  if (prefs.begin(WIFI_NAMESPACE, false)) { // Write mode
    bool success = prefs.putString(WIFI_CREDENTIALS_KEY, updatedJson);
    prefs.end();
    
    if (success) {
      Serial.println("WiFi credentials saved successfully!");
      Serial.println("Network will be automatically tried when in range.");
    } else {
      Serial.println("Failed to save WiFi credentials.");
    }
  } else {
    Serial.println("Failed to access WiFi storage for writing.");
  }
}

} // namespace serial_interface
// ===== END menu_wifi_core.cpp =====


// ===== BEGIN menu_wifi_display.cpp =====
namespace serial_interface {




#include <vector>


void scanWiFiNetworks() {
  Serial.println("Scanning for WiFi networks...");
  
  int networksFound = WiFi.scanNetworks();
  
  if (networksFound == 0) {
    Serial.println("No WiFi networks found");
  } else {
    Serial.print(networksFound);
    Serial.println(" WiFi networks found:");
    Serial.println("SSID                             | RSSI | Channel | Encryption");
    Serial.println("----------------------------------|------|---------|----------");
    
    for (int i = 0; i < networksFound; ++i) {
      // Print SSID (padded to 34 characters)
      String ssid = WiFi.SSID(i);
      Serial.print(ssid);
      for (int j = ssid.length(); j < 34; j++) {
        Serial.print(" ");
      }
      
      // Print RSSI
      Serial.print("| ");
      Serial.print(WiFi.RSSI(i));
      Serial.print("  ");
      
      // Print channel
      Serial.print("| ");
      Serial.print(WiFi.channel(i));
      for (int j = String(WiFi.channel(i)).length(); j < 9; j++) {
        Serial.print(" ");
      }
      
      // Print encryption type
      Serial.print("| ");
      switch (WiFi.encryptionType(i)) {
        case WIFI_AUTH_OPEN:
          Serial.println("Open");
          break;
        case WIFI_AUTH_WEP:
          Serial.println("WEP");
          break;
        case WIFI_AUTH_WPA_PSK:
          Serial.println("WPA-PSK");
          break;
        case WIFI_AUTH_WPA2_PSK:
          Serial.println("WPA2-PSK");
          break;
        case WIFI_AUTH_WPA_WPA2_PSK:
          Serial.println("WPA/WPA2-PSK");
          break;
        default:
          Serial.println("Unknown");
          break;
      }
      
      // Add a small delay to avoid overflowing the serial output
      delay(10);
    }
  }
  
  // Delete the scan result to free memory
  WiFi.scanDelete();
}

void displayWiFiStatus() {
  Serial.println("\n==== WiFi Status ====");
  
  if (WiFi.getMode() == WIFI_AP) {
    Serial.println("Mode: Access Point");
    Serial.print("AP SSID: ");
    Serial.println(WiFi.softAPSSID());
    Serial.print("AP IP Address: ");
    Serial.println(WiFi.softAPIP());
    Serial.print("Connected clients: ");
    Serial.println(WiFi.softAPgetStationNum());
  } else {
    Serial.println("Mode: Station");
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("Connected to: ");
      Serial.println(WiFi.SSID());
      Serial.print("Signal strength: ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      Serial.print("IP Address: ");
      Serial.println(WiFi.localIP());
      Serial.print("MAC Address: ");
      Serial.println(WiFi.macAddress());
    } else {
      Serial.println("Not connected to any WiFi network");
    }
  }
}

// Function to display saved WiFi networks
void displaySavedWiFiNetworks() {
  Serial.println("\n==== Saved WiFi Networks ====");
  
  Preferences prefs;
  
  // Use the correct namespace and key defined in wifi_settings.h
  if (prefs.begin(WIFI_NAMESPACE, true)) { // Read-only mode
    // Get the JSON string containing all WiFi networks
    String wifiListJson = prefs.getString(WIFI_CREDENTIALS_KEY, "[]");
    
    // Log the raw JSON for debugging
    Serial.println("Raw saved data: " + wifiListJson);
    
    // Parse the JSON
    DynamicJsonDocument doc(WIFI_CREDENTIALS_JSON_SIZE);
    DeserializationError error = deserializeJson(doc, wifiListJson);
    
    if (error) {
      Serial.println("Error parsing saved WiFi networks: " + String(error.c_str()));
      prefs.end();
      return;
    }
    
    JsonArray networks = doc.as<JsonArray>();
    
    if (networks.size() == 0) {
      Serial.println("No WiFi networks have been saved yet.");
    } else {
      Serial.print(networks.size());
      Serial.println(" WiFi network(s) found:");
      Serial.println("----------------------------------------------");
      Serial.println("Priority | SSID                | Password");
      Serial.println("----------------------------------------------");
      
      // Sort networks by priority
      // Create a structure to hold network info
      struct NetworkInfo {
        String ssid;
        String password;
        int priority;
        bool isPlaceholder;
      };
      
      std::vector<NetworkInfo> sortedNetworks;
      
      for (JsonObject network : networks) {
        NetworkInfo info;
        info.ssid = network["ssid"].as<String>();
        info.password = network["password"].as<String>();
        info.priority = network["priority"] | 999; // Default high number if not set
        
        // Check if this is likely a placeholder password
        info.isPlaceholder = info.password.startsWith("temp_password_");
        
        sortedNetworks.push_back(info);
      }
      
      // Sort by priority (lower number = higher priority)
      std::sort(sortedNetworks.begin(), sortedNetworks.end(), 
        [](const NetworkInfo& a, const NetworkInfo& b) {
          return a.priority < b.priority;
        }
      );
      
      // Display the networks
      for (const auto& network : sortedNetworks) {
        // Format priority with padding
        String priorityStr = String(network.priority);
        while (priorityStr.length() < 8) priorityStr += " ";
        
        // Format SSID with padding
        String ssidStr = network.ssid;
        while (ssidStr.length() < 20) ssidStr += " ";
        
        // Don't show actual password for security
        String passwordStr = "";
        if (network.password.length() > 0) {
          if (network.isPlaceholder) {
            passwordStr = "[PLACEHOLDER - uses ESP32 internal credentials]";
          } else {
            passwordStr = "[Set - " + String(network.password.length()) + " chars]";
          }
        } else {
          passwordStr = "[Not set]";
        }
        
        Serial.println(priorityStr + "| " + ssidStr + "| " + passwordStr);
      }
      
      // Display a note about placeholder passwords
      bool hasPlaceholders = false;
      for (const auto& network : sortedNetworks) {
        if (network.isPlaceholder) {
          hasPlaceholders = true;
          break;
        }
      }
      
      if (hasPlaceholders) {
        Serial.println("\nNOTE: Networks marked as [PLACEHOLDER] will use ESP32's internal WiFi Manager");
        Serial.println("credentials when connecting. These have the HIGHEST connection priority.");
        Serial.println("You don't need to update them unless you want to use these credentials on");
        Serial.println("another device, in which case use 'syncwifi' to set the actual password.");
      }
    }
    
    // Additional info - show currently connected network
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nCurrently connected to: " + WiFi.SSID());
    }
    
    prefs.end();
  } else {
    Serial.println("Failed to access saved network information.");
  }
}

} // namespace serial_interface
// ===== END menu_wifi_display.cpp =====


// ===== BEGIN serial_core.cpp =====
namespace serial_interface {








  // Add this include for WiFi menu functions

// Global variables for serial interface
static MenuState currentMenu = MenuState::MAIN_MENU;
static String serialBuffer = "";
static bool serialInputComplete = false;

MenuState getCurrentMenuState() {
  return currentMenu;
}

void setMenuState(MenuState state) {
  currentMenu = state;
}

void initializeSerialInterface() {
  Serial.println("\n===== XY-SK Power Supply Interface =====");
  Serial.println("Type 'help' for menu, 'status' for current readings, 'prot' for protection settings");
  displayMainMenu();
}

void processSerialInput() {
  static String command = "";
  
  // Check for new serial input
  if (Serial.available()) {
    char c = Serial.read();
    
    // Process command when newline received
    if (c == '\n' || c == '\r') {
      if (command.length() > 0) {
        XYModbusConfig config;
        processSerialCommand(command, nullptr, config);
        command = "";
      }
    } else {
      // Add character to buffer
      command += c;
    }
  }
}

void processSerialCommand(const String& input, XY_SKxxx* ps, XYModbusConfig& config) {
  // Skip empty input
  if (input.length() == 0) {
    return;
  }
  
  Serial.print("Command: ");
  Serial.println(input);
  
  // Global commands that work in any menu
  if (input.equalsIgnoreCase("menu") || input.equalsIgnoreCase("main")) {
    currentMenu = MenuState::MAIN_MENU;
    displayMainMenu();
    return;
  } else if (input.equalsIgnoreCase("info")) {
    displayDeviceInfo(ps);
    return;
  } else if (input.equalsIgnoreCase("help")) {
    switch (currentMenu) {
      case MenuState::MAIN_MENU: displayMainMenu(); break;
      case MenuState::BASIC_CONTROL: displayBasicControlMenu(); break;
      case MenuState::MEASUREMENT_MENU: displayMeasurementMenu(); break;
      case MenuState::PROTECTION_MENU: displayProtectionMenu(); break;
      case MenuState::SETTINGS_MENU: displaySettingsMenu(); break;
      case MenuState::DEBUG_MENU: displayDebugMenu(); break;
      case MenuState::CD_DATA_MENU: displayCDDataMenu(); break;
      case MenuState::WIFI_MENU: displayWiFiMenu(); break;  // Add case for WiFi menu
    }
    return;
  } else if (input.equalsIgnoreCase("status")) {
    displayDeviceStatus(ps);
    return;
  } else if (input.equalsIgnoreCase("prot")) {
    displayDeviceProtectionStatus(ps);
    return;
  } else if (input.equalsIgnoreCase("reset")) {
    // Add factory reset command
    Serial.println("\n==== FACTORY RESET ====");
    Serial.println("WARNING: This will reset ALL device settings to factory defaults!");
    Serial.println("All custom configurations, calibrations, and saved presets will be lost.");
    Serial.println("Type 'y' and press Enter to confirm, or any other key to cancel.");
    Serial.print("Proceed with factory reset? ");
    
    // Clear any pending input
    while (Serial.available()) {
      Serial.read();
    }
    
    // Wait for user confirmation
    bool timeout = true;
    unsigned long startTime = millis();
    
    while (millis() - startTime < 30000) { // 30 second timeout
      if (Serial.available()) {
        char c = Serial.read();
        Serial.print(c); // Echo character
        timeout = false;
        
        if (c == 'y' || c == 'Y') {
          // Consume the rest of the line
          while (Serial.available()) {
            Serial.read();
          }
          
          Serial.println("\n\nExecuting factory reset...");
          if (ps->restoreFactoryDefaults()) {
            Serial.println("Factory reset command sent successfully.");
            Serial.println("Device will restart with default settings.");
            Serial.println("You may need to reconnect using the default baud rate (115200).");
          } else {
            Serial.println("Failed to execute factory reset command.");
          }
        } else {
          Serial.println("\nFactory reset cancelled.");
        }
        break;
      }
      delay(100);
    }
    
    if (timeout) {
      Serial.println("\nTimeout waiting for confirmation. Factory reset cancelled.");
    }
    return;
  }
  
  // Process commands based on current menu
  switch (currentMenu) {
    case MenuState::MAIN_MENU:
      handleMainMenu(input, ps, config);
      break;
    case MenuState::BASIC_CONTROL:
      handleBasicControl(input, ps);
      break;
    case MenuState::MEASUREMENT_MENU:
      handleMeasurementMenu(input, ps);
      break;
    case MenuState::PROTECTION_MENU:
      handleProtectionMenu(input, ps);
      break;
    case MenuState::SETTINGS_MENU:
      handleSettingsMenu(input, ps, config);
      break;
    case MenuState::DEBUG_MENU:
      handleDebugMenu(input, ps);
      break;
    case MenuState::CD_DATA_MENU:
      handleCDDataMenu(input, ps);
      break;
    case MenuState::WIFI_MENU:  // Add case for handling WiFi menu commands
      handleWiFiMenu(input, ps);
      break;
  }
}

void displayDeviceInfo(XY_SKxxx* ps) {
  // Check if powerSupply is initialized
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }

  uint16_t model = ps->getModel();
  uint16_t version = ps->getVersion();
  
  Serial.println("\n==== Device Information ====");
  Serial.print("Model: ");
  Serial.println(model);
  Serial.print("Firmware Version: ");
  Serial.println(version);
  
  // Get current baudrate
  uint8_t baudCode = ps->getBaudRateCode();
  Serial.print("Baud Rate Code: ");
  Serial.print(baudCode);
  
  // Display the actual baud rate
  long actualBaud = ps->getActualBaudRate();
  if (actualBaud > 0) {
    Serial.print(" (");
    Serial.print(actualBaud);
    Serial.println(" bps)");
  } else {
    Serial.println(" (Unknown)");
  }
}

// Main implementation of status display
void displayDeviceStatus(XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }

  Serial.println("\n==== Power Supply Status ====");
  
  // Check if output is enabled
  bool outputEnabled = ps->isOutputEnabled(true);
  Serial.print("Power Supply Output: ");
  Serial.println(outputEnabled ? "ON" : "OFF");
  
  // Read current output values
  float voltage = ps->getOutputVoltage(true);
  float current = ps->getOutputCurrent(true);
  float power = ps->getOutputPower(true);
  
  Serial.print("Output Voltage: ");
  Serial.print(voltage, 2);
  Serial.println(" V");
  
  Serial.print("Output Current: ");
  Serial.print(current, 3);
  Serial.println(" A");
  
  Serial.print("Output Power: ");
  Serial.print(power, 3); // Changed from 2 to 3 decimal places
  Serial.println(" W");
  
  // Check operating mode
  Serial.print("Operating Mode: ");
  OperatingMode mode = ps->getOperatingMode(true);
  float cpValue; // Move variable declaration outside of switch statement

  switch (mode) {
    case MODE_CP:
      Serial.println("Constant Power (CP)");
      cpValue = ps->getCachedConstantPower(false); // Already refreshed in getOperatingMode
      Serial.print("CP Setting: ");
      Serial.print(cpValue, 2);
      Serial.println(" W");
      break;
    case MODE_CC:
      Serial.println("Constant Current (CC)");
      break;
    case MODE_CV:
      Serial.println("Constant Voltage (CV)");
      break;
  }
  
  // Front panel keys status - IMPORTANT ADDITION
  bool keyLocked = ps->isKeyLocked(true); // Force refresh
  Serial.print("Front Panel Keys: ");
  Serial.println(keyLocked ? "LOCKED" : "UNLOCKED");
  
  // Read settings
  float setVoltage = ps->getSetVoltage(true);
  float setCurrent = ps->getSetCurrent(true);
  
  Serial.print("Set Voltage: ");
  Serial.print(setVoltage, 2);
  Serial.println(" V");
  
  Serial.print("Set Current: ");
  Serial.print(setCurrent, 3);
  Serial.println(" A");
  
  // Read input voltage
  float inputVoltage = ps->getInputVoltage(true);
  Serial.print("Input Voltage: ");
  Serial.print(inputVoltage, 2);
  Serial.println(" V");
  
  // Read MPPT status and threshold
  bool mpptEnabled;
  if (ps->getMPPTEnable(mpptEnabled)) {
    Serial.print("MPPT Status: ");
    Serial.println(mpptEnabled ? "ENABLED" : "DISABLED");
    
    if (mpptEnabled) {
      float mpptThreshold;
      if (ps->getMPPTThreshold(mpptThreshold)) {
        Serial.print("MPPT Threshold: ");
        Serial.print(mpptThreshold * 100, 0); // Convert to percentage
        Serial.println("%");
      }
    }
  }
  
  // Read temperature
  float internalTemp = ps->getInternalTemperature(true);
  bool isCelsius;
  ps->getTemperatureUnit(isCelsius);
  
  Serial.print("Internal Temperature: ");
  Serial.print(internalTemp, 1);
  Serial.println(isCelsius ? " 째F" : " 째C"); // Flip the interpretation: 0=Celsius, 1=Fahrenheit
}

void displayConfig(XYModbusConfig& config) {
  Serial.println("\n==== Configuration ====");
  Serial.print("RX Pin: ");
  Serial.println(config.rxPin);
  Serial.print("TX Pin: ");
  Serial.println(config.txPin);
  Serial.print("Slave ID: ");
  Serial.println(config.slaveId);
  Serial.print("Baud Rate: ");
  Serial.println(config.baudRate);
}

void setupSerialMonitorControl() {
  // Clear any previous state
  serialBuffer = "";
  serialInputComplete = false;
  
  // Show the initial menu
  initializeSerialInterface();
  
  // Debug message to confirm initialization
  Serial.println("Serial monitor control initialized");
}

void checkSerialMonitorInput(XY_SKxxx* ps, XYModbusConfig& config) {
  // Process any complete input
  if (serialInputComplete) {
    // Trim whitespace
    serialBuffer.trim();
    if (serialBuffer.length() > 0) {
      processSerialCommand(serialBuffer, ps, config);
    }
    serialBuffer = "";
    serialInputComplete = false;
  }
  
  // Check for new serial input
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    
    // Process on newline
    if (inChar == '\n' || inChar == '\r') {
      if (serialBuffer.length() > 0) {
        serialInputComplete = true;
        break;
      }
    } else {
      // Add character to buffer
      serialBuffer += inChar;
    }
  }
}

// Helper function to parse float values from input string
bool parseFloat(const String& input, float& value) {
  char* endPtr;
  value = strtof(input.c_str(), &endPtr);
  
  if (endPtr == input.c_str() || *endPtr != '\0') {
    Serial.println("Invalid number format");
    return false;
  }
  
  return true;
}

// Helper function to parse uint8_t values from input string
bool parseUInt8(const String& input, uint8_t& value) {
  char* endPtr;
  long val = strtol(input.c_str(), &endPtr, 10);
  
  if (endPtr == input.c_str() || *endPtr != '\0' || val < 0 || val > 255) {
    Serial.println("Invalid number format");
    return false;
  }
  
  value = (uint8_t)val;
  return true;
}

// Helper function to parse uint16_t values from input string
bool parseUInt16(const String& input, uint16_t& value) {
  char* endPtr;
  long val = strtol(input.c_str(), &endPtr, 10);
  
  if (endPtr == input.c_str() || *endPtr != '\0' || val < 0 || val > 65535) {
    Serial.println("Invalid number format");
    return false;
  }
  
  value = (uint16_t)val;
  return true;
}

// Helper function to parse hex values from input string
bool parseHex(const String& input, uint16_t& value) {
  char* endPtr;
  long val = strtol(input.c_str(), &endPtr, 16);
  
  if (endPtr == input.c_str() || *endPtr != '\0' || val < 0 || val > 65535) {
    Serial.println("Invalid hex format");
    return false;
  }
  
  value = (uint16_t)val;
  return true;
}

} // namespace serial_interface
// ===== END serial_core.cpp =====
