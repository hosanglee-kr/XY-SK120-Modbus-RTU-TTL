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
  toggleOutput: document.getElementById('power-toggle'), // Changed from 'toggle-output'
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
  themeColorMeta: document.getElementById('theme-color'),
  // New elements for expanded basic control
  outputOn: document.getElementById('output-on'),
  outputOff: document.getElementById('output-off'),
  keysLock: document.getElementById('keys-lock'),
  keysUnlock: document.getElementById('keys-unlock'),
  setCvVoltage: document.getElementById('set-cv-voltage'),
  setCcCurrent: document.getElementById('set-cc-current'),
  setCpPower: document.getElementById('set-cp-power'),
  applyCv: document.getElementById('apply-cv'),
  applyCc: document.getElementById('apply-cc'),
  applyCp: document.getElementById('apply-cp'),
  cpModeOn: document.getElementById('cp-mode-on'),
  cpModeOff: document.getElementById('cp-mode-off'),
  modeTabs: document.querySelectorAll('.tw-mode-tab, .mode-tab'), // Support both class names
  // Power control
  powerCheckbox: document.getElementById('power-toggle'), // Changed from power-checkbox
  keyLockSlider: document.getElementById('key-lock-slider'),
  // Operating mode elements
  operatingMode: document.getElementById('operatingMode'),
  operatingModeValue: document.getElementById('operatingModeValue'),
  voltageSetValue: document.getElementById('voltageSetValue'),
  currentSetValue: document.getElementById('currentSetValue'),
  powerSetValue: document.getElementById('powerSetValue'),
  powerSetSection: document.getElementById('powerSetSection'),
  modeSettings: document.querySelectorAll('.mode-settings'),
  // Configuration elements
  deviceName: document.getElementById('deviceName'),
  modbusId: document.getElementById('modbusId'),
  baudRate: document.getElementById('baudRate'),
  dataBits: document.getElementById('dataBits'),
  parity: document.getElementById('parity'),
  stopBits: document.getElementById('stopBits'),
  updateInterval: document.getElementById('updateInterval'),
  // Theme toggle
  themeCheckbox: document.getElementById('theme-checkbox')
};

// Initialize elements on DOM content loaded to fix timing issues
document.addEventListener('DOMContentLoaded', () => {
  // Re-initialize elements after DOM is fully loaded
  Object.keys(elements).forEach(key => {
    if (key.toLowerCase().includes('queryselector')) {
      elements[key] = document.querySelectorAll(elements[key]?.selector || '.tw-mode-tab, .mode-tab');
    } else {
      elements[key] = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
    }
  });
  
  console.log('Elements registry re-initialized after DOM loaded');
});

// Swipe elements
export const swipeElements = {
  cardsContainer: document.getElementById('cards-container'),
  dots: document.querySelectorAll('.tw-dot, .dot'),
  cards: document.querySelectorAll('.card, .tw-card, .card-panel'),
  dotsIndicator: document.getElementById('dots-indicator')
};