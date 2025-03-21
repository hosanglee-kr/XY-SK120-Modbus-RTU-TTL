#include "menu_debug.h"
#include "serial_core.h"
#include "serial_interface.h"

void displayDebugMenu() {
  Serial.println("\n==== Debug Menu (Register R/W) ====");
  Serial.println("read [register] - Read register (decimal)");
  Serial.println("readhex [register] - Read register (hex)");
  Serial.println("write [register] [value] - Write register (decimal)");
  Serial.println("writehex [register] [value] - Write register (hex)");
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
  } else if (input.startsWith("raw ")) {
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
    int spacePos = input.indexOf(' ', 5);
    if (spacePos > 0) {
      uint16_t start, end;
      if (parseUInt16(input.substring(5, spacePos), start) &&
          parseUInt16(input.substring(spacePos + 1), end)) {
          
        if (end < start) {
          uint16_t temp = start;
          start = end;
          end = temp;
        }
        
        // Limit scan range
        if (end - start > 50) {
          end = start + 50;
          Serial.println("Limited scan range to 50 registers");
        }
        
        Serial.print("Scanning registers from ");
        Serial.print(start);
        Serial.print(" to ");
        Serial.println(end);
        
        for (uint16_t reg = start; reg <= end; reg++) {
          uint16_t value;
          bool success = ps->readRegisters(reg, 1, &value);
          
          Serial.print(reg);
          Serial.print(" (0x");
          Serial.print(reg, HEX);
          Serial.print("): ");
          
          if (success) {
            Serial.print(value);
            Serial.print(" (0x");
            Serial.print(value, HEX);
            Serial.println(")");
          } else {
            Serial.println("read failed");
          }
          
          // Add a small delay to prevent flooding
          delay(50);
        }
      } else {
        Serial.println("Invalid format. Use: scan [start] [end]");
      }
    } else {
      Serial.println("Invalid format. Use: scan [start] [end]");
    }
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}
