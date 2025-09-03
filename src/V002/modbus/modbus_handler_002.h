#ifndef MODBUS_HANDLER_H
#define MODBUS_HANDLER_H

#include <ModbusMaster.h>
#include <ArduinoJson.h>

extern ModbusMaster modbus;

void setupModbus();
void updateModbusData();
void getModbusDataJson(JsonDocument &doc);

#endif // MODBUS_HANDLER_H
