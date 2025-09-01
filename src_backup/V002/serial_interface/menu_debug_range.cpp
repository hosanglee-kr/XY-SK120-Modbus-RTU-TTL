#include "menu_debug.h"
#include "serial_core.h"

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
