#include "menu_debug.h"
#include "serial_core.h"

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
