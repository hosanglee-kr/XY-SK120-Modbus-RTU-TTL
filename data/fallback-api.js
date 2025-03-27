/**
 * Fallback API for direct control when WebSocket is not working
 * This provides emergency direct control capabilities through REST API
 */

// Direct control through REST API
function directControl(action, params) {
  console.log(`Direct control: ${action}`, params);
  
  let url = '';
  let body = {};
  
  switch (action) {
    case 'setPower':
      url = '/api/power';
      body = { enable: params.enabled };
      break;
    case 'setVoltage':
      url = '/api/voltage';
      body = { voltage: params.voltage };
      break;
    case 'setCurrent':
      url = '/api/current';
      body = { current: params.current };
      break;
    case 'refresh':
      url = '/api/data';
      break;
    default:
      console.error('Unknown action:', action);
      return;
  }
  
  console.log(`Sending request to ${url}`, body);
  
  if (action === 'refresh') {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('Response:', data);
        updateUI(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  } else {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Response:', data);
        // Refresh data
        fetchData();
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}

// Helper function to fetch data
function fetchData() {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      console.log('Data received:', data);
      updateUI(data);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Update UI with data
function updateUI(data) {
  console.log('Updating UI with data:', data);
  
  // Update voltage
  const voltageElement = document.getElementById('psu-voltage');
  if (voltageElement && data.voltage !== undefined) {
    voltageElement.textContent = parseFloat(data.voltage).toFixed(2);
  }
  
  // Update current
  const currentElement = document.getElementById('psu-current');
  if (currentElement && data.current !== undefined) {
    currentElement.textContent = parseFloat(data.current).toFixed(3);
  }
  
  // Update power
  const powerElement = document.getElementById('psu-power');
  if (powerElement && data.power !== undefined) {
    powerElement.textContent = parseFloat(data.power).toFixed(1);
  }
  
  // Update output status
  const outputStatus = document.getElementById('output-status');
  if (outputStatus && data.outputEnabled !== undefined) {
    outputStatus.textContent = data.outputEnabled ? "ON" : "OFF";
    outputStatus.className = data.outputEnabled ? "status-on" : "status-off";
  }
}

// Expose functions to global scope for browser console use
window.emergencyControl = {
  togglePower: (enable) => directControl('setPower', { enabled: enable }),
  setVoltage: (voltage) => directControl('setVoltage', { voltage: parseFloat(voltage) }),
  setCurrent: (current) => directControl('setCurrent', { current: parseFloat(current) }),
  refreshData: () => directControl('refresh')
};

// Log that emergency controls are available
console.log('Emergency direct control available via emergencyControl global object');
