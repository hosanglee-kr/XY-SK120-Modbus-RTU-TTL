#include "menu_measurement.h"
#include "serial_core.h"

void displayMeasurementMenu() {
  Serial.println("\n==== Measurement Menu ====");
  Serial.println("volt - Read output voltage");
  Serial.println("curr - Read output current");
  Serial.println("power - Read output power");
  Serial.println("input - Read input voltage");
  Serial.println("temp - Read internal temperature");
  Serial.println("all - Read all measurements");
  Serial.println("menu - Return to main menu");
  Serial.println("help - Show this menu");
}

void handleMeasurementMenu(const String& input, XY_SKxxx* ps) {
  if (!ps) {
    Serial.println("Error: Power supply not initialized");
    return;
  }
  
  if (input == "volt") {
    float voltage = ps->getOutputVoltage(true);
    Serial.print("Output Voltage: ");
    Serial.print(voltage, 2);
    Serial.println(" V");
  } else if (input == "curr") {
    float current = ps->getOutputCurrent(true);
    Serial.print("Output Current: ");
    Serial.print(current, 3);
    Serial.println(" A");
  } else if (input == "power") {
    float power = ps->getOutputPower(true);
    Serial.print("Output Power: ");
    Serial.print(power, 3); // Changed from 2 to 3 decimal places
    Serial.println(" W");
  } else if (input == "input") {
    float inVoltage = ps->getInputVoltage(true);
    Serial.print("Input Voltage: ");
    Serial.print(inVoltage, 2);
    Serial.println(" V");
  } else if (input == "temp") {
    float temp = ps->getInternalTemperature(true);
    Serial.print("Internal Temperature: ");
    Serial.print(temp, 1);
    Serial.println(" °C");
  } else if (input == "all") {
    float voltage = ps->getOutputVoltage(true);
    float current = ps->getOutputCurrent(true);
    float power = ps->getOutputPower(true);
    float inVoltage = ps->getInputVoltage(true);
    float temp = ps->getInternalTemperature(true);
    
    Serial.println("\n==== All Measurements ====");
    Serial.print("Output Voltage: ");
    Serial.print(voltage, 2);
    Serial.println(" V");
    
    Serial.print("Output Current: ");
    Serial.print(current, 3);
    Serial.println(" A");
    
    Serial.print("Output Power: ");
    Serial.print(power, 3); // Changed from 2 to 3 decimal places
    Serial.println(" W");
    
    Serial.print("Input Voltage: ");
    Serial.print(inVoltage, 2);
    Serial.println(" V");
    
    Serial.print("Internal Temperature: ");
    Serial.print(temp, 1);
    Serial.println(" °C");
  } else {
    Serial.println("Unknown command. Type 'help' for options.");
  }
}
