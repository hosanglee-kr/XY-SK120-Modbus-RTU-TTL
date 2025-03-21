#include "menu_basic.h"
#include "serial_core.h"
#include "serial_interface.h"

void displayBasicControlMenu() {
  Serial.println("\n==== Basic Control ====");
  Serial.println("v [value] - Set voltage (V)");
  Serial.println("i [value] - Set current (A)");
  Serial.println("vi [voltage] [current] - Set both voltage and current");
  Serial.println("on - Turn output on");
  Serial.println("off - Turn output off");
  Serial.println("read - Read current output values");
  Serial.println("lock - Lock front panel keys");
  Serial.println("unlock - Unlock front panel keys");
  Serial.println("cv [value] - Set constant voltage mode");
  Serial.println("cc [value] - Set constant current mode");
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
      Serial.print(power, 2);
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
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}
