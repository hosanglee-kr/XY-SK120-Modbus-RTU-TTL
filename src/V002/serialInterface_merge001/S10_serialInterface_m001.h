// S10_serialInterface_m001.h

#ifndef SERIAL_INTERFACE_H
#define SERIAL_INTERFACE_H

#include <Arduino.h>
#include <WiFi.h>
#include <Preferences.h>
#include <ArduinoJson.h>

#include "XY-SKxxx.h"
#include "XY-SKxxx_Config.h" // Make sure XYModbusConfig is included
#include "../wifi_interface/wifi_settings.h"


// Menu states for navigation
enum class MenuState {
  MAIN_MENU,
  BASIC_CONTROL,
  MEASUREMENT_MENU,
  PROTECTION_MENU,
  SETTINGS_MENU,
  DEBUG_MENU,
  CD_DATA_MENU,  // Add new menu state for CD Data Groups
  WIFI_MENU      // Add new menu state for WiFi Settings
};



namespace serial_interface {
void displayBasicControlMenu();
void handleBasicControl(const String& input, XY_SKxxx* ps);
void displayCDDataMenu();
void handleCDDataMenu(const String& input, XY_SKxxx* ps);
void displayDebugMenu();
void handleDebugMenu(const String& input, XY_SKxxx* ps);
void handleDebugReadWrite(const String& input, XY_SKxxx* ps);
bool handleDebugRead(const String& input, XY_SKxxx* ps);
bool handleDebugWrite(const String& input, XY_SKxxx* ps);
bool handleDebugMultiWrite(const String& input, XY_SKxxx* ps);
bool handleDebugRaw(const String& input, XY_SKxxx* ps);
bool handleDebugScan(const String& input, XY_SKxxx* ps);
bool handleDebugCompare(const String& input, XY_SKxxx* ps);
bool handleDebugWriteTrial(const String& input, XY_SKxxx* ps);
bool handleDebugWriteRange(const String& input, XY_SKxxx* ps);
void handleMainMenu(const String& input, XY_SKxxx* ps, XYModbusConfig& config);
void displayMainMenu();
void displayMeasurementMenu();
void handleMeasurementMenu(const String& input, XY_SKxxx* ps);
void displayProtectionMenu();
void handleProtectionMenu(const String& input, XY_SKxxx* ps);
void displaySettingsMenu();
void handleSettingsMenu(const String& input, XY_SKxxx* ps, XYModbusConfig& config);
void displayDeviceSettings(XY_SKxxx* ps);
void displayAllDeviceSettings(XY_SKxxx* ps);
void displayWiFiMenu();
void handleWiFiMenu(const String& input, XY_SKxxx* ps);
void scanWiFiNetworks();
void displayWiFiStatus();
bool connectToWiFi(const String& ssid, const String& password);
bool setupWiFiAP(const String& ssid, const String& password);
void displaySavedWiFiNetworks();
bool extractQuotedParameters(const String& input, String& param1, String& param2, String& remaining);
bool exitAPMode();
void handleSaveCurrentWiFi();
void displayIPInfo();
void syncCurrentWiFi();
void handleAddWifi(const String& input, String ssid, String password, int priority);
extern void displayMainMenu();
MenuState getCurrentMenuState();
void setMenuState(MenuState state);
void initializeSerialInterface();
void processSerialInput();
void processSerialCommand(const String& input, XY_SKxxx* ps, XYModbusConfig& config);
void displayDeviceInfo(XY_SKxxx* ps);
void displayDeviceStatus(XY_SKxxx* ps);
void displayDeviceProtectionStatus(XY_SKxxx* ps);
bool parseFloat(const String& input, float& value);
bool parseUInt8(const String& input, uint8_t& value);
bool parseUInt16(const String& input, uint16_t& value);
bool parseHex(const String& input, uint16_t& value);
void setupSerialMonitorControl();
void checkSerialMonitorInput(XY_SKxxx* ps, XYModbusConfig& config);
void displayConfig(XYModbusConfig& config);
} // namespace serial_interface

#endif // SERIAL_INTERFACE_H
