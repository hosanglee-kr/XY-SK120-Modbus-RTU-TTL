#ifndef LOG_UTILS_H
#define LOG_UTILS_H

#include <Arduino.h>

/**
 * Returns a formatted timestamp string for logging
 * Format: [HH:MM:SS.mmm]
 * 
 * Using 'inline' to prevent multiple definition errors when included in multiple files
 */
inline String getLogTimestamp() {
  // Create a timestamp in the format [HH:MM:SS.mmm]
  unsigned long ms = millis();
  unsigned long seconds = ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  char buffer[20];
  sprintf(buffer, "[%02lu:%02lu:%02lu.%03lu] ",
          hours % 24, minutes % 60, seconds % 60, ms % 1000);
  
  return String(buffer);
}

// Macro for standardized logging
#define LOG_INFO(msg) Serial.print(getLogTimestamp()); Serial.println(msg)
#define LOG_ERROR(msg) Serial.print(getLogTimestamp()); Serial.print("ERROR: "); Serial.println(msg)
#define LOG_DEBUG(msg) Serial.print(getLogTimestamp()); Serial.print("DEBUG: "); Serial.println(msg)
#define LOG_WARNING(msg) Serial.print(getLogTimestamp()); Serial.print("WARNING: "); Serial.println(msg)

#endif // LOG_UTILS_H
