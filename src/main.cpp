#include <Arduino.h>
#include "XY-SKxxx.h"

// Define hardware serial pins for XIAO ESP32S3 Serial1
#define RX_PIN D7 // D7 for Serial1 RX on XIAO ESP32S3
#define TX_PIN D6 // D6 for Serial1 TX on XIAO ESP32S3

// Define Modbus baud rate, XY-SK120 default is 115200
#define MODBUS_BAUD_RATE 115200

// Create XY_SKxxx instance with the hardware serial pins
XY_SKxxx XY_SK120(RX_PIN, TX_PIN, 1);

// Helper functions for cleaner code
void printStatus(const char* operation, bool success) {
  Serial.print(operation);
  Serial.println(success ? " successful." : " failed.");
}

// Inside the printValue function, modify to show 3 decimals for both current and power
void printValue(const char* label, float value, const char* unit = "") {
  Serial.print(label);
  
  // Use 3 decimal places for current and power values
  if (strstr(label, "Current") || strstr(label, "Power")) {
    Serial.print(value, 3);  // Display 3 decimal places for current and power
  } else {
    Serial.print(value);     // Default display for other values (voltages)
  }
  
  if (unit && unit[0] != '\0') {
    Serial.print(" ");
    Serial.print(unit);
  }
  Serial.println();
}

// Additional helper function to read and display all current settings
void displayCurrentSettings() {
  float voltage, current, power;
  bool isOn;
  
  Serial.println("\nCurrent Device Settings:");
  
  if (XY_SK120.getOutputStatus(voltage, current, power, isOn)) {
    printValue("Output Voltage: ", voltage, "V");
    printValue("Output Current: ", current, "A");
    printValue("Output Power: ", power, "W");
    
    Serial.print("Output State: ");
    Serial.println(isOn ? "ON" : "OFF");
    
    // Add mode information
    if (isOn) {
      Serial.print("Operating Mode: ");
      if (XY_SK120.isInConstantCurrentMode()) {
        Serial.println("Constant Current (CC)");
      } else if (XY_SK120.isInConstantVoltageMode()) {
        Serial.println("Constant Voltage (CV)");
      } else {
        Serial.println("Unknown");
      }
    }
  } else {
    Serial.println("Failed to read settings.");
  }
  
  Serial.println("--------------------");
}

// Add the function prototype before setup()
void printHelp();  // Function prototype declaration

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    ; // Wait for Serial to be ready
  }

  // Initialize the XY-SK120X library (it will configure Serial1 internally)
  delay(1000); // Wait for the XY-SK120X to initialize
  XY_SK120.begin(MODBUS_BAUD_RATE);
  delay(1000); // Wait for the XY-SK120X to initialize

  Serial.println("XIAO ESP32S3 Modbus-RTU Communication with XY-SK120");
  Serial.println("Testing Modbus-RTU connection...");
  if (XY_SK120.testConnection()) {
    Serial.println("Connection successful.");
  } else {
    Serial.println("Connection failed.");
  }

  // Read and display device information
  printValue("Model Number: ", XY_SK120.readModel());
  printValue("Version Number: ", XY_SK120.readVersion());
  printValue("Baud Rate: ", XY_SK120.readBaudRate());
  
  // Display initial settings
  displayCurrentSettings();

  // Print help information
  printHelp();
  
  Serial.println("\nEnter command:");
}

void printHelp() {
  Serial.println("\nAvailable Commands:");
  Serial.println("  <voltage> <current> - Set voltage and current");
  Serial.println("  cv <voltage>        - Set constant voltage mode value");
  Serial.println("  cc <current>        - Set constant current mode value");
  Serial.println("  on                  - Turn output ON");
  Serial.println("  off                 - Turn output OFF");
  Serial.println("  lock                - Lock keypad");
  Serial.println("  unlock              - Unlock keypad");
  Serial.println("  status              - Read current status");
  Serial.println("  help                - Show this help message");
}

void loop() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    Serial.println("--------------------");
    
    if (command.equalsIgnoreCase("help")) {
      // Print help information
      printHelp();
    }
    else if (command.equalsIgnoreCase("on")) {
      // Turn output ON
      Serial.println("Turning output ON...");
      
      if (XY_SK120.turnOutputOn()) {
        Serial.println("Output turned ON successfully.");
      } else {
        Serial.println("Failed to turn output ON.");
      }
      
      displayCurrentSettings();
    } 
    else if (command.equalsIgnoreCase("off")) {
      // Turn output OFF
      Serial.println("Turning output OFF...");
      
      if (XY_SK120.turnOutputOff()) {
        Serial.println("Output turned OFF successfully.");
      } else {
        Serial.println("Failed to turn output OFF.");
      }
      
      displayCurrentSettings();
    }
    else if (command.equalsIgnoreCase("lock")) {
      // Lock the keypad
      Serial.println("Locking keypad...");
      
      if (XY_SK120.setKeyLock(true)) {
        Serial.println("Keypad locked successfully.");
      } else {
        Serial.println("Failed to lock keypad.");
      }
    }
    else if (command.equalsIgnoreCase("unlock")) {
      // Unlock the keypad
      Serial.println("Unlocking keypad...");
      
      if (XY_SK120.setKeyLock(false)) {
        Serial.println("Keypad unlocked successfully.");
      } else {
        Serial.println("Failed to unlock keypad.");
      }
    }
    else if (command.equalsIgnoreCase("status")) {
      // Read current status
      displayCurrentSettings();
    }
    else if (command.startsWith("cv ")) {
      // Handle constant voltage command
      float voltage = command.substring(3).toFloat();
      
      printValue("Setting constant voltage to: ", voltage, "V");
      
      if (XY_SK120.setConstantVoltage(voltage)) {
        Serial.println("Constant voltage set successfully.");
      } else {
        Serial.println("Failed to set constant voltage.");
      }
      
      displayCurrentSettings();
    }
    else if (command.startsWith("cc ")) {
      // Handle constant current command
      float current = command.substring(3).toFloat();
      
      printValue("Setting constant current to: ", current, "A");
      
      if (XY_SK120.setConstantCurrent(current)) {
        Serial.println("Constant current set successfully.");
      } else {
        Serial.println("Failed to set constant current.");
      }
      
      displayCurrentSettings();
    }
    else {
      // Parse voltage and current values
      int spaceIndex = command.indexOf(' ');
      if (spaceIndex > 0) {
        float voltage = command.substring(0, spaceIndex).toFloat();
        float current = command.substring(spaceIndex + 1).toFloat();
        
        printValue("Setting voltage to: ", voltage, "V");
        printValue("Setting current to: ", current, "A");
        
        if (XY_SK120.setVoltageAndCurrent(voltage, current)) {
          Serial.println("Voltage and current set successfully.");
        } else {
          Serial.println("Failed to set voltage and/or current.");
        }
        
        displayCurrentSettings();
      } else {
        Serial.println("Invalid command format.");
      }
    }
    
    Serial.println("Enter command:");
  }
}