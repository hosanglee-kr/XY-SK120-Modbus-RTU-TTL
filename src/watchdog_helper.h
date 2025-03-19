#ifndef WATCHDOG_HELPER_H
#define WATCHDOG_HELPER_H

#include <Arduino.h>
#include <esp_task_wdt.h>

// Default timeout is 30 seconds
#define WDT_TIMEOUT_SECONDS 30

// Initialize the watchdog with increased timeout
void initWatchdog() {
  // Increase Watchdog timeout to prevent false triggering during file operations
  esp_task_wdt_init(WDT_TIMEOUT_SECONDS, true);
  Serial.printf("Watchdog initialized with %d second timeout\n", WDT_TIMEOUT_SECONDS);
}

// Feed the watchdog from main tasks
void feedWatchdog() {
  esp_task_wdt_reset();
}

#endif // WATCHDOG_HELPER_H
