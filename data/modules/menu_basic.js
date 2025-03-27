import { elements } from './elements_registry.js';
import { sendCommand, requestPsuStatus } from './menu_connection.js';
import { initWebSocket } from './menu_connection.js';

// Fixed power toggle function - using direct DOM access instead of elements registry
function togglePowerOutput() {
  // Get output status element directly from DOM
  const outputStatus = document.getElementById('output-status');
  const currentState = outputStatus ? outputStatus.textContent === "ON" : false;
  
  console.log("Current output state:", currentState, "Toggling to:", !currentState);
  
  // Send command with direct action name
  const success = sendCommand({ 
    action: "setOutputState",  // Use the correct action name
    enabled: !currentState 
  });
  
  if (success) {
    console.log("Power toggle command sent successfully");
    
    // Update UI immediately for better user feedback
    if (outputStatus) {
      outputStatus.textContent = !currentState ? "ON" : "OFF";
      outputStatus.className = !currentState ? "status-on" : "status-off";
    }
    
    // Update power toggle
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
      powerToggle.checked = !currentState;
    }
  } else {
    console.error("Failed to send power toggle command");
  }
}

// Fixed setVoltageValue with better error handling
function setVoltageValue() {
  console.log("Setting voltage value");
  const voltageInput = document.getElementById('set-voltage');
  
  if (!voltageInput) {
    console.error("Voltage input element not found");
    return;
  }
  
  const voltage = parseFloat(voltageInput.value);
  if (isNaN(voltage) || voltage < 0 || voltage > 30) {
    alert("Please enter a valid voltage between 0 and 30V");
    return;
  }
  
  console.log(`Setting voltage to ${voltage}V`);
  const success = sendCommand({ 
    action: "setVoltage", 
    voltage: voltage 
  });
  
  if (!success) {
    console.error("Failed to send voltage command");
    alert("WebSocket not connected. Cannot set voltage.");
  } else {
    console.log("Voltage command sent successfully");
  }
}

// Set voltage using preset value
function setVoltagePreset(voltage) {
  if (voltage < 0 || voltage > 30) {
    alert("Invalid voltage preset value");
    return;
  }
  
  // Update the input field
  const voltageInput = document.getElementById('set-voltage');
  if (voltageInput) {
    voltageInput.value = voltage;
  }
  
  // Send the command
  const success = sendCommand({ 
    action: "setVoltage", 
    voltage: parseFloat(voltage) 
  });
  
  if (!success) {
    alert("WebSocket not connected. Cannot set voltage.");
  }
}

// Initialize voltage preset popup menu - position to match card
function initVoltagePresetMenu() {
  const presetBtn = document.getElementById('voltage-preset-btn');
  const popup = document.getElementById('voltage-popup');
  const overlay = document.getElementById('voltage-overlay');
  
  if (!presetBtn || !popup || !overlay) return;
  
  // Ensure popup is hidden initially
  popup.style.display = 'none';
  overlay.style.display = 'none';
  
  // Store scroll position
  let scrollPosition = 0;
  
  // Show popup function - modified for consistent stacking
  function showPopup() {
    // Store the current scroll position before locking
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add popup-open class first to prevent flickering
    document.body.classList.add('popup-open');
    
    // Move popup and overlay to be direct children of body if needed
    if (popup.parentElement !== document.body) {
      document.body.appendChild(popup);
    }
    if (overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
    }
    
    // Position popup with clean styles for clarity - fixed positioning works with z-index
    popup.style.position = 'fixed';
    popup.style.zIndex = '100000';
    
    // Add other positioning - check if we're in mobile or PWA mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = window.innerWidth <= 600;
    
    if (isMobile || isPWA) {
      // Mobile/PWA positioning logic
      const readingsContainer = document.querySelector('.readings-container');
      if (readingsContainer) {
        const readingsRect = readingsContainer.getBoundingClientRect();
        popup.style.top = `${readingsRect.bottom + 10}px`;
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        
        // Calculate available height
        const availableHeight = window.innerHeight - readingsRect.bottom - 20;
        popup.style.maxHeight = `${Math.min(availableHeight, window.innerHeight * 0.6)}px`;
      } else {
        // Fallback to center positioning
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
      }
    } else {
      // Desktop centered positioning
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
    }
    
    // Ensure overlay covers everything
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '99999';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    
    // Add active classes to show elements
    overlay.classList.add('active');
    popup.classList.add('active');
    
    // Reset popup scroll to top
    popup.scrollTop = 0;
    
    // Add touchmove prevention for iOS Safari
    document.addEventListener('touchmove', preventScroll, { passive: false });
  }
  
  // Hide popup function
  function hidePopup() {
    // First, remove the active classes
    popup.classList.remove('active');
    overlay.classList.remove('active');
    
    // Remove PWA flag if it exists
    popup.removeAttribute('data-pwa-mode');
    
    // Remove touchmove prevention
    document.removeEventListener('touchmove', preventScroll);
    
    // Small delay before restoring body scroll to ensure smooth transition
    setTimeout(() => {
      // Remove the popup-open class and restore scroll
      document.body.classList.remove('popup-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollPosition);
    }, 10);
  }
  
  // Improved prevent scroll function - allow scrolling inside popup
  function preventScroll(e) {
    // Check if we clicked/touch within the popup content
    if (!popup.contains(e.target)) {
      e.preventDefault();
    }
  }
  
  // Handle button press
  presetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showPopup();
  });
  
  // Handle overlay click to close - improved touch handling
  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hidePopup();
  });
  
  // Touch-specific overlay close handler
  overlay.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hidePopup();
  });
  
  // Add direct click handler for options
  const voltageOptions = popup.querySelectorAll('.voltage-option');
  voltageOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from reaching overlay
      const voltage = option.getAttribute('data-voltage');
      if (voltage) {
        setVoltagePreset(voltage);
        hidePopup();
      }
    });
    
    // Add hover effect for desktop
    option.addEventListener('mouseenter', () => {
      voltageOptions.forEach(opt => opt.classList.remove('highlighted'));
      option.classList.add('highlighted');
    });
    
    option.addEventListener('mouseleave', () => {
      option.classList.remove('highlighted');
    });
  });
  
  // Update touch movement handler for new content structure
  const contentArea = popup.querySelector('.voltage-popup-content');
  if (contentArea) {
    contentArea.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
      
      const voltageOptions = popup.querySelectorAll('.voltage-option');
      voltageOptions.forEach(opt => opt.classList.remove('highlighted'));
      
      if (elementAtPoint && elementAtPoint.classList.contains('voltage-option')) {
        elementAtPoint.classList.add('highlighted');
      }
    });
  }
  
  // Add escape key handler to close popup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('active')) {
      hidePopup();
    }
  });
  
  // Add specific touch handlers for the content area
  contentArea.addEventListener('touchstart', (e) => {
    // Allow the event to bubble - don't call preventDefault
    // This ensures proper scrolling behavior in the content area
  }, { passive: true });
  
  // Ensure content area scrolls properly in PWA mode
  contentArea.addEventListener('scroll', (e) => {
    e.stopPropagation(); // Prevent scroll event from bubbling
  }, { passive: true });
}

// Fixed setCurrentValue with better error handling
function setCurrentValue() {
  console.log("Setting current value");
  const currentInput = document.getElementById('set-current');
  
  if (!currentInput) {
    console.error("Current input element not found");
    return;
  }
  
  const current = parseFloat(currentInput.value);
  if (isNaN(current) || current < 0 || current > 5) {
    alert("Please enter a valid current between 0 and 5A");
    return;
  }
  
  console.log(`Setting current to ${current}A`);
  const success = sendCommand({ 
    action: "setCurrent", 
    current: current 
  });
  
  if (!success) {
    console.error("Failed to send current command");
    alert("WebSocket not connected. Cannot set current.");
  } else {
    console.log("Current command sent successfully");
  }
}

// Turn output ON
function turnOutputOn() {
  const success = sendCommand({ 
    action: "powerOutput", 
    enable: true 
  });
  
  if (!success) {
    alert("WebSocket not connected. Cannot turn output on.");
  }
}

// Turn output OFF
function turnOutputOff() {
  const success = sendCommand({ 
    action: "powerOutput", 
    enable: false 
  });
  
  if (!success) {
    alert("WebSocket not connected. Cannot turn output off.");
  }
}

// Lock front panel keys
function toggleKeyLock(shouldLock) {
  const success = sendCommand({ 
    action: "setKeyLock", 
    lock: shouldLock 
  });
  
  if (success) {
    console.log("Front panel keys " + (shouldLock ? "locked" : "unlocked"));
  } else {
    alert("WebSocket not connected. Cannot control keys.");
  }
}

// Update key lock status from device
function updateKeyLockStatus(isLocked) {
  const keyLockSlider = document.getElementById('key-lock-slider');
  
  if (keyLockSlider) {
    if (isLocked) {
      keyLockSlider.classList.add('active');
    } else {
      keyLockSlider.classList.remove('active');
    }
  }
}

// Set Constant Voltage (CV) mode
function setConstantVoltage() {
  const voltage = parseFloat(document.getElementById('set-cv-voltage').value);
  if (isNaN(voltage) || voltage < 0 || voltage > 30) {
    alert("Please enter a valid voltage between 0 and 30V");
    return;
  }
  
  const success = sendCommand({ 
    action: "setConstantVoltage", 
    voltage: voltage 
  });
  
  if (success) {
    console.log("Constant voltage mode set to", voltage, "V");
  } else {
    alert("WebSocket not connected. Cannot set constant voltage.");
  }
}

// Set Constant Current (CC) mode
function setConstantCurrent() {
  const current = parseFloat(document.getElementById('set-cc-current').value);
  if (isNaN(current) || current < 0 || current > 5) {
    alert("Please enter a valid current between 0 and 5A");
    return;
  }
  
  const success = sendCommand({ 
    action: "setConstantCurrent", 
    current: current 
  });
  
  if (success) {
    console.log("Constant current mode set to", current, "A");
  } else {
    alert("WebSocket not connected. Cannot set constant current.");
  }
}

// Set Constant Power (CP) mode
function setConstantPower() {
  const power = parseFloat(document.getElementById('set-cp-power').value);
  if (isNaN(power) || power < 0 || power > 120) {
    alert("Please enter a valid power between 0 and 120W");
    return;
  }
  
  const success = sendCommand({ 
    action: "setConstantPower", 
    power: power 
  });
  
  if (success) {
    console.log("Constant power set to", power, "W");
  } else {
    alert("WebSocket not connected. Cannot set constant power.");
  }
}

// Enable Constant Power mode
function enableCpMode() {
  const success = sendCommand({ 
    action: "setConstantPowerMode", 
    enable: true 
  });
  
  if (success) {
    console.log("Constant Power mode enabled");
  } else {
    alert("WebSocket not connected. Cannot enable CP mode.");
  }
}

// Disable Constant Power mode
function disableCpMode() {
  const success = sendCommand({ 
    action: "setConstantPowerMode", 
    enable: false 
  });
  
  if (success) {
    console.log("Constant Power mode disabled");
  } else {
    alert("WebSocket not connected. Cannot disable CP mode.");
  }
}

// Handle operation mode tabs - replaced by the improved version in menu_interface.js
function initModeTabs() {
  // This function is now obsolete - the complete implementation is in setupOperatingModeTabs
  // in menu_interface.js. Just calling that function instead.
  if (typeof window.setupOperatingModeTabs === 'function') {
    window.setupOperatingModeTabs();
  } else {
    console.log('Using simplified mode tab init as a fallback');
    
    const tabs = document.querySelectorAll('.mode-tab');
    const modeSettings = document.querySelectorAll('.mode-settings');
    
    // Just make sure at least one tab is active
    let hasActive = false;
    tabs.forEach(tab => {
      if (tab.classList.contains('active')) hasActive = true;
    });
    
    if (!hasActive && tabs.length > 0) {
      tabs[0].classList.add('active');
    }
    
    // Show settings for the active tab
    const activeTab = document.querySelector('.mode-tab.active');
    if (activeTab) {
      const mode = activeTab.getAttribute('data-mode');
      modeSettings.forEach(setting => setting.classList.remove('active'));
      
      if (mode) {
        const targetSetting = document.getElementById(`${mode}-settings`);
        if (targetSetting) targetSetting.classList.add('active');
      }
    }
  }
}

// More reliable power button initialization with direct DOM access
function initPowerButton() {
  console.log("Initializing power button with direct DOM access...");
  
  // Get the power toggle element directly
  const powerToggle = document.getElementById('power-toggle');
  if (!powerToggle) {
    console.error("Power toggle element not found in DOM. Check HTML structure.");
    return;
  }
  
  console.log("Found power toggle element!");
  
  // Remove any existing event listeners to prevent duplicates
  const newToggle = powerToggle.cloneNode(true);
  powerToggle.parentNode.replaceChild(newToggle, powerToggle);
  
  // Add event listener for changes - send direct command
  newToggle.addEventListener('change', function() {
    console.log("Power toggle changed:", this.checked);
    
    // Send command with exact action name
    sendCommand({ 
      action: 'setOutputState', 
      enabled: this.checked 
    });
    
    // Update UI immediately
    const outputStatus = document.getElementById('output-status');
    if (outputStatus) {
      outputStatus.textContent = this.checked ? "ON" : "OFF";
      outputStatus.className = this.checked ? "status-on" : "status-off";
    }
  });
  
  console.log("Power button initialized successfully");
}

// Update output state for power toggle
function updatePowerState(isOn) {
  const powerSlider = document.getElementById('power-slider');
  if (powerSlider) {
    if (isOn) {
      powerSlider.classList.add('active');
    } else {
      powerSlider.classList.remove('active');
    }
  }
}

// Initialize all control buttons
function initBasicControls() {
  // Mode tabs
  initModeTabs();
  
  // Initialize new voltage preset popup
  initVoltagePresetMenu();
  
  // Key lock slider direct toggle
  const keyLockSlider = document.getElementById('key-lock-slider');
  if (keyLockSlider) {
    keyLockSlider.addEventListener('click', function() {
      // Toggle active state
      const isCurrentlyActive = this.classList.contains('active');
      const newState = !isCurrentlyActive;
      
      // Send command to toggle lock
      toggleKeyLock(newState);
      
      // Update UI immediately for responsiveness (will be confirmed by response)
      if (newState) {
        this.classList.add('active');
      } else {
        this.classList.remove('active');
      }
    });
  }
  
  // Output control buttons - removed from UI but keeping functions for power button
  // These references will now be null since elements were removed
  const outputOnBtn = document.getElementById('output-on');
  const outputOffBtn = document.getElementById('output-off');
  
  // Only attach listeners if buttons exist (which they won't after removal)
  if (outputOnBtn) {
    outputOnBtn.addEventListener('click', turnOutputOn);
  }
  
  if (outputOffBtn) {
    outputOffBtn.addEventListener('click', turnOutputOff);
  }
  
  // Key lock toggle
  const keyLockCheckbox = document.getElementById('key-lock-checkbox');
  if (keyLockCheckbox) {
    keyLockCheckbox.addEventListener('change', function() {
      toggleKeyLock(this.checked);
    });
  }
  
  // CV mode
  const applyCvBtn = document.getElementById('apply-cv');
  if (applyCvBtn) {
    applyCvBtn.addEventListener('click', setConstantVoltage);
  }
  
  // CC mode
  const applyCcBtn = document.getElementById('apply-cc');
  if (applyCcBtn) {
    applyCcBtn.addEventListener('click', setConstantCurrent);
  }
  
  // CP mode
  const applyCpBtn = document.getElementById('apply-cp');
  if (applyCpBtn) {
    applyCpBtn.addEventListener('click', setConstantPower);
  }
  
  const cpModeOnBtn = document.getElementById('cp-mode-on');
  const cpModeOffBtn = document.getElementById('cp-mode-off');
  
  if (cpModeOnBtn) {
    cpModeOnBtn.addEventListener('click', enableCpMode);
  }
  
  if (cpModeOffBtn) {
    cpModeOffBtn.addEventListener('click', disableCpMode);
  }
}

export { 
  togglePowerOutput, 
  setVoltageValue, 
  setCurrentValue,
  setVoltagePreset, // Export the new function
  initPowerButton,
  initBasicControls,
  turnOutputOn,
  turnOutputOff,
  toggleKeyLock,
  updateKeyLockStatus,
  setConstantVoltage,
  setConstantCurrent,
  setConstantPower,
  enableCpMode,
  disableCpMode,
  updatePowerState,
  initVoltagePresetMenu // Export the new function
};