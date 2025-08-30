#include "menu_cd_data.h"
#include "serial_core.h"
#include "serial_interface.h"
#include "XY-SKxxx-cd-data-group.h"

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
