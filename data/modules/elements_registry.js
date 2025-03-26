// DOM elements
export const elements = {
  configForm: document.getElementById('configForm'),
  resetBtn: document.getElementById('resetBtn'),
  // WiFi elements
  wifiStatus: document.getElementById('wifi-status'),
  wifiSsid: document.getElementById('wifi-ssid'),
  wifiIp: document.getElementById('wifi-ip'),
  wifiRssi: document.getElementById('wifi-rssi'),
  wifiResetBtn: document.getElementById('wifiResetBtn'),
  wifiRefreshBtn: document.getElementById('wifiRefreshBtn'),
  deviceIp: document.getElementById('device-ip'),
  // Power Supply elements
  outputStatus: document.getElementById('output-status'),
  toggleOutput: document.getElementById('toggle-output'),
  psuVoltage: document.getElementById('psu-voltage'),
  psuCurrent: document.getElementById('psu-current'),
  psuPower: document.getElementById('psu-power'),
  setVoltage: document.getElementById('set-voltage'),
  applyVoltage: document.getElementById('apply-voltage'),
  setCurrent: document.getElementById('set-current'),
  applyCurrent: document.getElementById('apply-current'),
  refreshPsu: document.getElementById('refresh-psu'),
  themeToggle: document.getElementById('theme-toggle'),
  sunIcon: document.querySelector('.sun-icon'),
  moonIcon: document.querySelector('.moon-icon'),
  themeColorMeta: document.getElementById('theme-color')
};

// Swipe elements
export const swipeElements = {
  cardsContainer: document.getElementById('cards-container'),
  dots: document.querySelectorAll('.dot'),
  cards: document.querySelectorAll('.card')
};