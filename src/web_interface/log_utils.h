#ifndef WEB_INTERFACE_LOG_UTILS_H
#define WEB_INTERFACE_LOG_UTILS_H

#include <Arduino.h>
#include <WiFi.h>
#include <time.h>

// NTP server details
#define NTP_SERVER1 "pool.ntp.org"
#define NTP_SERVER2 "time.nist.gov"
#define GMT_OFFSET_SEC 0      // GMT offset (adjust based on timezone)
#define DAYLIGHT_OFFSET_SEC 0 // Daylight saving time offset

// Flags to track NTP configuration
extern bool ntpConfigured;
extern bool ntpSynced;

/**
 * Configure NTP time synchronization
 * Should be called after WiFi is connected
 */
inline bool configureNTP() {
    if (ntpConfigured) return true;
    
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Cannot configure NTP - WiFi not connected");
        return false;
    }
    
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER1, NTP_SERVER2);
    Serial.println("NTP client configured");
    ntpConfigured = true;
    return true;
}

/**
 * Returns a formatted timestamp string for logging
 * Format: [HH:MM:SS.mmm] or [YYYY-MM-DD HH:MM:SS] if NTP synced
 * 
 * Using 'inline' to prevent multiple definition errors when included in multiple files
 */
inline String getLogTimestamp() {
    char buffer[32];
    
    if (ntpConfigured && !ntpSynced) {
        // Check if NTP time is available
        time_t now;
        struct tm timeinfo;
        if (time(&now) && getLocalTime(&timeinfo)) {
            ntpSynced = true;
        }
    }
    
    if (ntpSynced) {
        // Use real-time clock if NTP is synced
        time_t now;
        struct tm timeinfo;
        time(&now);
        localtime_r(&now, &timeinfo);
        
        // Format as [YYYY-MM-DD HH:MM:SS]
        sprintf(buffer, "[%04d-%02d-%02d %02d:%02d:%02d] ", 
                timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday,
                timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    } else {
        // Fallback to millis-based time if NTP not synced
        unsigned long ms = millis();
        unsigned long seconds = ms / 1000;
        unsigned long minutes = seconds / 60;
        unsigned long hours = minutes / 60;
        
        // Format as [HH:MM:SS.mmm]
        sprintf(buffer, "[%02lu:%02lu:%02lu.%03lu] ",
                hours % 24, minutes % 60, seconds % 60, ms % 1000);
    }
    
    return String(buffer);
}

/**
 * Format a WebSocket message log with source and destination IP addresses
 * Format: [timestamp] (src_ip) > (dst_ip) message
 */
inline String formatWebSocketLog(const IPAddress& srcIP, const IPAddress& dstIP, const String& message) {
    String timestamp = getLogTimestamp();
    String srcIPStr = srcIP.toString();
    String dstIPStr = dstIP.toString();
    
    return timestamp + "(" + srcIPStr + ") > (" + dstIPStr + ") " + message;
}

// Standard logging macros
#define LOG_INFO(msg) Serial.print(getLogTimestamp()); Serial.println(msg)
#define LOG_ERROR(msg) Serial.print(getLogTimestamp()); Serial.print("ERROR: "); Serial.println(msg)
#define LOG_DEBUG(msg) Serial.print(getLogTimestamp()); Serial.print("DEBUG: "); Serial.println(msg)
#define LOG_WARNING(msg) Serial.print(getLogTimestamp()); Serial.print("WARNING: "); Serial.println(msg)

// WebSocket-specific logging with source and destination IPs
#define LOG_WS(srcIP, dstIP, msg) Serial.println(formatWebSocketLog(srcIP, dstIP, msg))

#endif // WEB_INTERFACE_LOG_UTILS_H
