#pragma once

#include <Arduino.h>
#include "XY-SKxxx.h"

// Main debug menu functions
void displayDebugMenu();
void handleDebugMenu(const String& input, XY_SKxxx* ps);

// Basic read/write commands
void handleDebugReadWrite(const String& input, XY_SKxxx* ps);
bool handleDebugRead(const String& input, XY_SKxxx* ps);
bool handleDebugWrite(const String& input, XY_SKxxx* ps);
bool handleDebugMultiWrite(const String& input, XY_SKxxx* ps);
bool handleDebugRaw(const String& input, XY_SKxxx* ps);

// Scan and compare commands
bool handleDebugScan(const String& input, XY_SKxxx* ps);
bool handleDebugCompare(const String& input, XY_SKxxx* ps);

// Write trial command
bool handleDebugWriteTrial(const String& input, XY_SKxxx* ps);

// Write range command
bool handleDebugWriteRange(const String& input, XY_SKxxx* ps);
