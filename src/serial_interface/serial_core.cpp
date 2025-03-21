#include "serial_core.h"
#include "menu_main.h"
#include "menu_basic.h"
#include "menu_measurement.h"
#include "menu_protection.h"
#include "menu_settings.h"
#include "menu_debug.h"
#include "menu_cd_data.h"  // Include the new header

// Global variables for serial interface
static MenuState currentMenu = MenuState::MAIN_MENU;
static String serialBuffer = "";
static bool serialInputComplete = false;

MenuState getCurrentMenuState() {
  return currentMenu;
}

void setMenuState(MenuState state) {
  currentMenu = state;
}

void initializeSerialInterface() {
  Serial.println("\n===== XY-SK Power Supply Interface =====");
  Serial.println("Type 'help' for menu, 'status' for current readings, 'prot' for protection settings");
  displayMainMenu();
}

void processSerialCommand(const String& input, XY_SKxxx* ps, XYModbusConfig& config) {
  // Skip empty input
  if (input.length() == 0) {
    return;
  }
  
  Serial.print("Command: ");
  Serial.println(input);
  
  // Global commands that work in any menu
  if (input.equalsIgnoreCase("menu") || input.equalsIgnoreCase("main")) {
    currentMenu = MenuState::MAIN_MENU;
    displayMainMenu();
    return;
  } else if (input.equalsIgnoreCase("info")) {
    displayDeviceInfo(ps);
    return;
  } else if (input.equalsIgnoreCase("help")) {
    switch (currentMenu) {
      case MenuState::MAIN_MENU: displayMainMenu(); break;
      case MenuState::BASIC_CONTROL: displayBasicControlMenu(); break;
      case MenuState::MEASUREMENT_MENU: displayMeasurementMenu(); break;
      case MenuState::PROTECTION_MENU: displayProtectionMenu(); break;
      case MenuState::SETTINGS_MENU: displaySettingsMenu(); break;
      case MenuState::DEBUG_MENU: displayDebugMenu(); break;
      case MenuState::CD_DATA_MENU: displayCDDataMenu(); break;  // Add case for CD Data menu
    }
    return;
  } else if (input.equalsIgnoreCase("status")) {
    displayDeviceStatus(ps);
    return;
  } else if (input.equalsIgnoreCase("prot")) {
    displayDeviceProtectionStatus(ps);
    return;
  }
  
  // Process commands based on current menu
  switch (currentMenu) {
    case MenuState::MAIN_MENU:
      handleMainMenu(input, ps, config);
      break;
    case MenuState::BASIC_CONTROL:
      handleBasicControl(input, ps);
      break;
    case MenuState::MEASUREMENT_MENU:
      handleMeasurementMenu(input, ps);
      break;
    case MenuState::PROTECTION_MENU:
      handleProtectionMenu(input, ps);
      break;
    case MenuState::SETTINGS_MENU:
      handleSettingsMenu(input, ps, config);
      break;
    case MenuState::DEBUG_MENU:
      handleDebugMenu(input, ps);
      break;
    case MenuState::CD_DATA_MENU:  // Add case for handling CD Data menu commands
      handleCDDataMenu(input, ps);
      break;
  }
}

void displayDeviceInfo(XY_SKxxx* ps) {
  // Check if powerSupply is initialized
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }

  uint16_t model = ps->getModel();
  uint16_t version = ps->getVersion();
  
  Serial.println("\n==== Device Information ====");
  Serial.print("Model: ");
  Serial.println(model);
  Serial.print("Firmware Version: ");
  Serial.println(version);
  
  // Get current baudrate
  uint8_t baudCode = ps->getBaudRateCode();
  Serial.print("Baud Rate Code: ");
  Serial.print(baudCode);
  
  // Display the actual baud rate
  long actualBaud = ps->getActualBaudRate();
  if (actualBaud > 0) {
    Serial.print(" (");
    Serial.print(actualBaud);
    Serial.println(" bps)");
  } else {
    Serial.println(" (Unknown)");
  }
}

// Main implementation of status display
void displayDeviceStatus(XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }

  Serial.println("\n==== Power Supply Status ====");
  
  // Check if output is enabled
  bool outputEnabled = ps->isOutputEnabled(true);
  Serial.print("Power Supply Output: ");
  Serial.println(outputEnabled ? "ON" : "OFF");
  
  // Read current output values
  float voltage = ps->getOutputVoltage(true);
  float current = ps->getOutputCurrent(true);
  float power = ps->getOutputPower(true);
  
  Serial.print("Output Voltage: ");
  Serial.print(voltage, 2);
  Serial.println(" V");
  
  Serial.print("Output Current: ");
  Serial.print(current, 3);
  Serial.println(" A");
  
  Serial.print("Output Power: ");
  Serial.print(power, 2);
  Serial.println(" W");
  
  // Check operating mode
  bool ccMode = ps->isInConstantCurrentMode(false);
  Serial.print("Operating Mode: ");
  Serial.println(ccMode ? "Constant Current (CC)" : "Constant Voltage (CV)");
  
  // Front panel keys status - IMPORTANT ADDITION
  bool keyLocked = ps->isKeyLocked(true); // Force refresh
  Serial.print("Front Panel Keys: ");
  Serial.println(keyLocked ? "LOCKED" : "UNLOCKED");
  
  // Read settings
  float setVoltage = ps->getSetVoltage(true);
  float setCurrent = ps->getSetCurrent(true);
  
  Serial.print("Set Voltage: ");
  Serial.print(setVoltage, 2);
  Serial.println(" V");
  
  Serial.print("Set Current: ");
  Serial.print(setCurrent, 3);
  Serial.println(" A");
  
  // Read input voltage
  float inputVoltage = ps->getInputVoltage(true);
  Serial.print("Input Voltage: ");
  Serial.print(inputVoltage, 2);
  Serial.println(" V");
  
  // Read temperature
  float internalTemp = ps->getInternalTemperature(true);
  bool isCelsius;
  ps->getTemperatureUnit(isCelsius);
  
  Serial.print("Internal Temperature: ");
  Serial.print(internalTemp, 1);
  Serial.println(isCelsius ? " °F" : " °C"); // Flip the interpretation: 0=Celsius, 1=Fahrenheit
}

void displayDeviceProtectionStatus(XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }

  Serial.println("\n==== Protection Settings ====");
  
  // Update all protection settings first
  ps->updateAllProtectionSettings(true);
  
  // Voltage protection settings
  float ovp = ps->getCachedOverVoltageProtection(true);
  float lvp = ps->getCachedLowVoltageProtection(true);
  Serial.print("Input Low Voltage Protection (LVP): ");
  Serial.print(lvp, 2);
  Serial.println(" V");
  Serial.print("Over Voltage Protection (OVP): ");
  Serial.print(ovp, 2);
  Serial.println(" V");
  
  // Current protection
  float ocp = ps->getCachedOverCurrentProtection(true);
  Serial.print("Over Current Protection (OCP): ");
  Serial.print(ocp, 3);
  Serial.println(" A");
  
  // Power protection
  float opp = ps->getCachedOverPowerProtection(true);
  Serial.print("Over Power Protection (OPP): ");
  Serial.print(opp, 1); // Show only 1 decimal place to match the precision
  Serial.println(" W");
  
  // Energy-based protection
  uint16_t ahLow, ahHigh;
  ps->getCachedOverAmpHourProtection(ahLow, ahHigh, true);
  Serial.print("Over Amp-Hour Protection (OAH): ");
  if (ahHigh > 0) {
    Serial.print(ahLow + (ahHigh * 65536));
  } else {
    Serial.print(ahLow);
  }
  Serial.println(" mAh");
  
  uint16_t whLow, whHigh;
  ps->getCachedOverWattHourProtection(whLow, whHigh, true);
  Serial.print("Over Power-Hour Protection (OPH): ");
  if (whHigh > 0) {
    Serial.print((whLow + (whHigh * 65536)) * 10); // Multiply by 10 to get mWh
  } else {
    Serial.print(whLow * 10);
  }
  Serial.println(" mWh");
  
  // Time-based protection
  uint16_t hours, minutes;
  ps->getCachedHighPowerProtectionTime(hours, minutes, true);
  Serial.print("High Power Protection Time: ");
  Serial.print(hours);
  Serial.print(" hours, ");
  Serial.print(minutes);
  Serial.println(" minutes");
  
  // Temperature protection
  float otp = ps->getCachedOverTemperatureProtection(true);
  bool isCelsius;
  ps->getTemperatureUnit(isCelsius);
  
  Serial.print("Over Temperature Protection (OTP): ");
  Serial.print((int)otp);
  Serial.println(isCelsius ? " °F" : " °C");
  
  // Startup behavior
  bool onAtStartup = ps->getCachedPowerOnInitialization(true);
  Serial.print("Power-On Output State: ");
  Serial.println(onAtStartup ? "ON" : "OFF");
  
  // Protection status register
  uint16_t protStatus = ps->getProtectionStatus(true);
  Serial.print("Protection Status Register: 0x");
  Serial.println(protStatus, HEX);
  
  // Note on protection status interpretation
  if (protStatus > 0) {
    Serial.println("\nActive Protections:");
    if (protStatus & 0x0001) Serial.println("- Output Over Voltage Protection (OVP) triggered");
    if (protStatus & 0x0002) Serial.println("- Output Over Current Protection (OCP) triggered");
    if (protStatus & 0x0004) Serial.println("- Output Over Power Protection (OPP) triggered");
    if (protStatus & 0x0008) Serial.println("- Input Low Voltage Protection (LVP) triggered");
    if (protStatus & 0x0010) Serial.println("- Over Temperature Protection (OTP) triggered");
    if (protStatus & 0x0020) Serial.println("- Over Amp-Hour Protection (OAH) triggered");
    if (protStatus & 0x0040) Serial.println("- Over Power-Hour Protection (OPH) triggered");
    if (protStatus & 0x0080) Serial.println("- High Power Protection Time exceeded");
  } else {
    Serial.println("\nNo active protections.");
  }
}

void displayConfig(XYModbusConfig& config) {
  Serial.println("\n==== Configuration ====");
  Serial.print("RX Pin: ");
  Serial.println(config.rxPin);
  Serial.print("TX Pin: ");
  Serial.println(config.txPin);
  Serial.print("Slave ID: ");
  Serial.println(config.slaveId);
  Serial.print("Baud Rate: ");
  Serial.println(config.baudRate);
}

void setupSerialMonitorControl() {
  // Clear any previous state
  serialBuffer = "";
  serialInputComplete = false;
  
  // Show the initial menu
  initializeSerialInterface();
  
  // Debug message to confirm initialization
  Serial.println("Serial monitor control initialized");
}

void checkSerialMonitorInput(XY_SKxxx* ps, XYModbusConfig& config) {
  // Process any complete input
  if (serialInputComplete) {
    // Trim whitespace
    serialBuffer.trim();
    if (serialBuffer.length() > 0) {
      processSerialCommand(serialBuffer, ps, config);
    }
    serialBuffer = "";
    serialInputComplete = false;
  }
  
  // Check for new serial input
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    
    // Process on newline
    if (inChar == '\n' || inChar == '\r') {
      if (serialBuffer.length() > 0) {
        serialInputComplete = true;
        break;
      }
    } else {
      // Add character to buffer
      serialBuffer += inChar;
    }
  }
}

// Helper function to parse float values from input string
bool parseFloat(const String& input, float& value) {
  char* endPtr;
  value = strtof(input.c_str(), &endPtr);
  
  if (endPtr == input.c_str() || *endPtr != '\0') {
    Serial.println("Invalid number format");
    return false;
  }
  
  return true;
}

// Helper function to parse uint8_t values from input string
bool parseUInt8(const String& input, uint8_t& value) {
  char* endPtr;
  long val = strtol(input.c_str(), &endPtr, 10);
  
  if (endPtr == input.c_str() || *endPtr != '\0' || val < 0 || val > 255) {
    Serial.println("Invalid number format");
    return false;
  }
  
  value = (uint8_t)val;
  return true;
}

// Helper function to parse uint16_t values from input string
bool parseUInt16(const String& input, uint16_t& value) {
  char* endPtr;
  long val = strtol(input.c_str(), &endPtr, 10);
  
  if (endPtr == input.c_str() || *endPtr != '\0' || val < 0 || val > 65535) {
    Serial.println("Invalid number format");
    return false;
  }
  
  value = (uint16_t)val;
  return true;
}

// Helper function to parse hex values from input string
bool parseHex(const String& input, uint16_t& value) {
  char* endPtr;
  long val = strtol(input.c_str(), &endPtr, 16);
  
  if (endPtr == input.c_str() || *endPtr != '\0' || val < 0 || val > 65535) {
    Serial.println("Invalid hex format");
    return false;
  }
  
  value = (uint16_t)val;
  return true;
}
