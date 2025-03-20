#include <Arduino.h>
#include "XY-SKxxx.h"
#include "XY-SKxxx_Config.h"
#include "serial_monitor_interface.h"

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
    config.baudRate = baud;
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
  else {
    Serial.println("Unknown command. Type 'help' for available commands.");
  }
}

void setupSerialMonitorControl() {
  Serial.println("\nAvailable Commands - type 'help' for full list");
  printHelp();
}

void checkSerialMonitorInput(XY_SKxxx* powerSupply, XYModbusConfig &config) {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    handleSerialCommand(command, powerSupply, config);
  }
}