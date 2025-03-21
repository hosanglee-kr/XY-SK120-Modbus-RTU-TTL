#include "menu_debug.h"
#include "serial_core.h"
#include "serial_interface.h"

void displayDebugMenu() {
  Serial.println("\n==== Debug Menu (Register R/W) ====");
  Serial.println("read [register] - Read register (decimal)");
  Serial.println("readhex [register] - Read register (hex)");
  Serial.println("write [register] [value] - Write register (decimal)");
  Serial.println("writehex [register] [value] - Write register (hex)");
  Serial.println("mwrite [reg1] [val1] [reg2] [val2] ... - Write multiple registers (decimal)");
  Serial.println("mwritehex [reg1] [val1] [reg2] [val2] ... - Write multiple registers (hex)");
  Serial.println("raw [function] [register] [count] - Read raw register block");
  Serial.println("scan [start] [end] - Scan register range");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleDebugMenu(const String& input, XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  if (input.startsWith("read ")) {
    uint16_t reg;
    if (parseUInt16(input.substring(5), reg)) {
      uint16_t value;
      if (ps->readRegisters(reg, 1, &value)) {
        Serial.print("Register ");
        Serial.print(reg);
        Serial.print(" (0x");
        Serial.print(reg, HEX);
        Serial.print("): ");
        Serial.print(value);
        Serial.print(" (0x");
        Serial.print(value, HEX);
        Serial.println(")");
      } else {
        Serial.println("Failed to read register");
      }
    }
  } else if (input.startsWith("readhex ")) {
    uint16_t reg;
    if (parseHex(input.substring(8), reg)) {
      uint16_t value;
      if (ps->readRegisters(reg, 1, &value)) {
        Serial.print("Register 0x");
        Serial.print(reg, HEX);
        Serial.print(" (");
        Serial.print(reg);
        Serial.print("): 0x");
        Serial.print(value, HEX);
        Serial.print(" (");
        Serial.print(value);
        Serial.println(")");
      } else {
        Serial.println("Failed to read register");
      }
    }
  } else if (input.startsWith("write ")) {
    int spacePos = input.indexOf(' ', 6);
    if (spacePos > 0) {
      uint16_t reg, value;
      if (parseUInt16(input.substring(6, spacePos), reg) &&
          parseUInt16(input.substring(spacePos + 1), value)) {
        if (ps->writeRegister(reg, value)) {
          Serial.print("Register ");
          Serial.print(reg);
          Serial.print(" written with value: ");
          Serial.println(value);
        } else {
          Serial.println("Failed to write register");
        }
      }
    } else {
      Serial.println("Invalid format. Use: write [register] [value]");
    }
  } else if (input.startsWith("writehex ")) {
    int spacePos = input.indexOf(' ', 9);
    if (spacePos > 0) {
      uint16_t reg, value;
      if (parseHex(input.substring(9, spacePos), reg) &&
          parseHex(input.substring(spacePos + 1), value)) {
        if (ps->writeRegister(reg, value)) {
          Serial.print("Register 0x");
          Serial.print(reg, HEX);
          Serial.print(" written with value: 0x");
          Serial.println(value, HEX);
        } else {
          Serial.println("Failed to write register");
        }
      }
    } else {
      Serial.println("Invalid format. Use: writehex [register] [value]");
    }
  } else if (input.startsWith("mwrite ")) {
    // Format: mwrite [reg1] [val1] [reg2] [val2] ...
    String args = input.substring(7);
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
        if (!parseUInt16(token, registers[pairCount])) {
          Serial.println("Invalid register address: " + token);
          return;
        }
      } else {
        // Register value
        if (!parseUInt16(token, values[pairCount])) {
          Serial.println("Invalid register value: " + token);
          return;
        }
        pairCount++;
      }
      
      index++;
    }
    
    if (index % 2 != 0 || pairCount == 0) {
      Serial.println("Invalid format. Need register-value pairs.");
      return;
    }
    
    Serial.print("Writing to ");
    Serial.print(pairCount);
    Serial.println(" registers:");
    
    // Write each register-value pair
    bool allSuccess = true;
    for (int i = 0; i < pairCount; i++) {
      if (ps->writeRegister(registers[i], values[i])) {
        Serial.print("Register ");
        Serial.print(registers[i]);
        Serial.print(" (0x");
        Serial.print(registers[i], HEX);
        Serial.print(") = ");
        Serial.print(values[i]);
        Serial.print(" (0x");
        Serial.print(values[i], HEX);
        Serial.println(")");
      } else {
        Serial.print("Failed to write register ");
        Serial.println(registers[i]);
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
  }
  
  else if (input.startsWith("mwritehex ")) {
    // Format: mwritehex [reg1] [val1] [reg2] [val2] ...
    String args = input.substring(10);
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
        // Register address in hex
        if (!parseHex(token, registers[pairCount])) {
          Serial.println("Invalid hex register address: " + token);
          return;
        }
      } else {
        // Register value in hex
        if (!parseHex(token, values[pairCount])) {
          Serial.println("Invalid hex register value: " + token);
          return;
        }
        pairCount++;
      }
      
      index++;
    }
    
    if (index % 2 != 0 || pairCount == 0) {
      Serial.println("Invalid format. Need register-value pairs.");
      return;
    }
    
    Serial.print("Writing to ");
    Serial.print(pairCount);
    Serial.println(" registers (hex):");
    
    // Write each register-value pair
    bool allSuccess = true;
    for (int i = 0; i < pairCount; i++) {
      if (ps->writeRegister(registers[i], values[i])) {
        Serial.print("Register 0x");
        Serial.print(registers[i], HEX);
        Serial.print(" = 0x");
        Serial.println(values[i], HEX);
      } else {
        Serial.print("Failed to write register 0x");
        Serial.println(registers[i], HEX);
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
  }
  
  else if (input.startsWith("raw ")) {
    // Format: raw [function] [register] [count]
    int space1 = input.indexOf(' ', 4);
    int space2 = input.indexOf(' ', space1 + 1);
    
    if (space1 > 0 && space2 > 0) {
      uint8_t function;
      uint16_t reg, count;
      
      if (parseUInt8(input.substring(4, space1), function) &&
          parseUInt16(input.substring(space1 + 1, space2), reg) &&
          parseUInt16(input.substring(space2 + 1), count)) {
          
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
        } else {
          Serial.println("Failed to read registers");
        }
        
        delete[] results;
      } else {
        Serial.println("Invalid format. Use: raw [function] [register] [count]");
      }
    } else {
      Serial.println("Invalid format. Use: raw [function] [register] [count]");
    }
  } else if (input.startsWith("scan ")) {
    // Extract start and end addresses from the input
    int spacePos1 = input.indexOf(' ');
    int spacePos2 = input.indexOf(' ', spacePos1 + 1);
    
    if (spacePos2 <= 0) {
      Serial.println("Invalid format. Use: scan [start] [end]");
      return;
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
      return;
    }
    
    // Validate address range
    if (endAddr < startAddr) {
      Serial.println("End address must be greater than or equal to start address");
      return;
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
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}
