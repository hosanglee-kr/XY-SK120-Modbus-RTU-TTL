#include "menu_debug.h"
#include "serial_core.h"

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
