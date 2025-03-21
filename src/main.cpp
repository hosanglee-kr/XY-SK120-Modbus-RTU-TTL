#include <Arduino.h>
#include "XY-SKxxx.h"
#include "XY-SKxxx_Config.h"
#include "serial_monitor_interface.h"
#include "serial_interface/serial_core.h"

// Global configuration instance
XYModbusConfig config;

// Create XY_SKxxx instance with default pins (will be updated from config)
XY_SKxxx* powerSupply = nullptr;

void setup() {
  // Initialize serial communication with computer
  Serial.begin(115200);
  while (!Serial && millis() < 3000); // Wait for Serial to be ready or timeout
  
  Serial.println("\n\n----- XY-SK120 Modbus RTU Control System -----");
  
  // Initialize the configuration manager
  if (!XYConfigManager::begin()) {
    Serial.println("Failed to initialize configuration manager");
  }
  
  // Load configuration from NVS
  config = XYConfigManager::loadConfig();
  
  // Display the loaded configuration
  displayConfig(config);
  
  // Create the power supply instance with the loaded configuration
  powerSupply = new XY_SKxxx(config.rxPin, config.txPin, config.slaveId);
  
  // Initialize the power supply
  powerSupply->begin(config.baudRate);
  delay(500); // Give the device time to initialize
  
  // Test connection
  Serial.println("Testing connection to power supply...");
  if (powerSupply->testConnection()) {
    Serial.println("Connection successful!");
    
    // Read and display device information
    uint16_t model = powerSupply->getModel();
    uint16_t version = powerSupply->getVersion();
    
    Serial.println("\nDevice Information:");
    Serial.print("Model:   "); Serial.println(model);
    Serial.print("Version: "); Serial.println(version);
    
    // Display initial status
    displayDeviceStatus(powerSupply);
    
    // Initialize serial monitor interface - MOVED ALL RELATED CODE TO HERE
    Serial.println("\nInitializing serial monitor interface...");
    setupSerialMonitorControl();
    Serial.println("Enter commands to control the power supply.");
  } else {
    Serial.println("Connection failed. Please check wiring and settings.");
  }
}

void loop() {
  // Process serial monitor commands
  checkSerialMonitorInput(powerSupply, config);
  
  // You can process other interfaces here in the future:
  // processWebSocketMessages();
  // processRestApiRequests();
  // processMqttMessages();
  
  // Add any periodic tasks here
  // For example, you could update a status display every few seconds
  static unsigned long lastStatusUpdate = 0;
  if (millis() - lastStatusUpdate > 5000) { // Every 5 seconds
    lastStatusUpdate = millis();
    // Perform any periodic updates here
  }
  
  // Add a small delay to prevent throttling the CPU
  delay(10);
}