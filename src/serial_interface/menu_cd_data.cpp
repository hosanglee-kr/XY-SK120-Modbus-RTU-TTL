#include "menu_cd_data.h"
#include "serial_core.h"
#include "serial_interface.h"
#include "XY-SKxxx-cd-data-group.h"

void displayCDDataMenu() {
  Serial.println("\n==== Data Group Menu ====");
  Serial.println("list - List all data groups");
  Serial.println("set [group] - Select a data group (0-9)");
  Serial.println("store [group] - Store current settings to a data group (0-9)");
  Serial.println("recall [group] - Recall settings from a data group (0-9)");
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
      if (i > 0) delay(100);
      
      if (ps->readMemoryGroup(group, groupData)) {
        // Extract voltage and current values from the group data
        float voltage = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] / 100.0f;
        float current = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] / 1000.0f;
        
        // Also extract OVP and OCP for more comprehensive information
        float ovp = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::OVP_SET)] / 100.0f;
        float ocp = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::OCP_SET)] / 1000.0f;
        
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
      } else {
        Serial.print("Group ");
        Serial.print(i);
        Serial.println(": Error reading values");
      }
    }
  } else if (input.startsWith("set ")) {
    // Set a data group
    uint8_t groupNum;
    if (parseUInt8(input.substring(4), groupNum) && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      if (ps->callMemoryGroup(group)) {
        Serial.print("Selected data group ");
        Serial.println(groupNum);
        
        // Display the current settings after selection for confirmation
        uint16_t groupData[xy_sk::DATA_GROUP_REGISTERS];
        if (ps->readMemoryGroup(xy_sk::MemoryGroup::M0, groupData, true)) { // Force refresh
          float voltage = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] / 100.0f;
          float current = groupData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] / 1000.0f;
          Serial.print("Active settings: ");
          Serial.print(voltage, 2);
          Serial.print("V, ");
          Serial.print(current, 3);
          Serial.println("A");
        }
      } else {
        Serial.println("Failed to select data group");
      }
    } else {
      Serial.println("Invalid group number. Use 0-9.");
    }
  } else if (input.startsWith("store ")) {
    // Store current settings to a data group
    uint8_t groupNum;
    if (parseUInt8(input.substring(6), groupNum) && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      
      // First read the current active values
      uint16_t activeData[xy_sk::DATA_GROUP_REGISTERS];
      if (ps->readMemoryGroup(xy_sk::MemoryGroup::M0, activeData)) {
        // Then write them to the specified group
        if (ps->writeMemoryGroup(group, activeData)) {
          Serial.print("Current settings stored to group ");
          Serial.println(groupNum);
          
          // Display what was stored
          float voltage = activeData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] / 100.0f;
          float current = activeData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] / 1000.0f;
          Serial.print("Stored: ");
          Serial.print(voltage, 2);
          Serial.print("V, ");
          Serial.print(current, 3);
          Serial.println("A");
        } else {
          Serial.println("Failed to store settings");
        }
      } else {
        Serial.println("Failed to read current settings");
      }
    } else {
      Serial.println("Invalid group number. Use 0-9.");
    }
  } else if (input.startsWith("recall ")) {
    // Recall settings from a data group
    uint8_t groupNum;
    if (parseUInt8(input.substring(7), groupNum) && groupNum <= 9) {
      xy_sk::MemoryGroup group = static_cast<xy_sk::MemoryGroup>(groupNum);
      
      if (ps->callMemoryGroup(group)) {
        Serial.print("Settings recalled from group ");
        Serial.println(groupNum);
        
        // Display the recalled settings by reading M0 (active group)
        uint16_t activeData[xy_sk::DATA_GROUP_REGISTERS];
        if (ps->readMemoryGroup(xy_sk::MemoryGroup::M0, activeData, true)) { // force refresh
          float voltage = activeData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::VOLTAGE_SET)] / 100.0f;
          float current = activeData[static_cast<uint8_t>(xy_sk::GroupRegisterOffset::CURRENT_SET)] / 1000.0f;
          Serial.print("Recalled: ");
          Serial.print(voltage, 2);
          Serial.print("V, ");
          Serial.print(current, 3);
          Serial.println("A");
        } else {
          Serial.println("Failed to read recalled settings");
        }
      } else {
        Serial.println("Failed to recall settings");
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
