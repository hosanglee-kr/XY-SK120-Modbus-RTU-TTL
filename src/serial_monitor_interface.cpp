#include <Arduino.h>
#include "XY-SKxxx.h"
#include "XY-SKxxx_Config.h"
#include "serial_monitor_interface.h"

// Include all the interface components
#include "serial_interface/serial_interface.h"
#include "serial_interface/serial_core.h"

// Changed from object to pointer to match main.cpp
extern XY_SKxxx* powerSupply;

// Use inline to avoid multiple definition errors at link time
// These inline functions allow main.cpp to call the real implementations

inline void displayStatus(XY_SKxxx* ps) {
  // Fully qualify the function call with a global scope operator (::)
  ::displayStatus(ps);  // Call the function in serial_core.cpp
}

inline void displayConfig(XYModbusConfig& config) {
  ::displayConfig(config);  // Call the function in serial_core.cpp
}

inline void setupSerialMonitorControl() {
  ::setupSerialMonitorControl();  // Call the function in serial_core.cpp
}

inline void checkSerialMonitorInput(XY_SKxxx* ps, XYModbusConfig& config) {
  ::checkSerialMonitorInput(ps, config);  // Call the function in serial_core.cpp
}