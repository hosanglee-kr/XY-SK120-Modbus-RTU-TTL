/**
 * Simple utility script to check connectivity
 */

// Function to check backend connectivity
function checkBackendConnectivity() {
    // Create results container
    const results = {
        httpPing: false,
        websocket: false,
        wifiStatus: false,
        errors: []
    };
    
    // Get the base URL
    const deviceIP = localStorage.getItem('selectedDeviceIP') || window.location.hostname;
    const baseUrl = `${window.location.protocol}//${deviceIP}`;
    
    // 1. Check basic HTTP connectivity using ping endpoint
    return fetch(`${baseUrl}/ping`)
        .then(response => {
            results.httpPing = response.ok;
            
            // 2. Check WebSocket status
            results.websocket = window.websocketConnected && 
                               window.websocket && 
                               window.websocket.readyState === 1;
            
            // 3. Check WiFi status endpoint
            return fetch(`${baseUrl}/api/wifi/status`)
                .then(response => {
                    results.wifiStatus = response.ok;
                    if (!response.ok) {
                        results.errors.push(`WiFi status HTTP error: ${response.status}`);
                    }
                    return results;
                })
                .catch(err => {
                    results.errors.push(`WiFi status error: ${err.message}`);
                    return results;
                });
        })
        .catch(err => {
            results.errors.push(`HTTP ping error: ${err.message}`);
            return results;
        });
}

// Function to display the connectivity results
function displayConnectivityResults(results) {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        z-index: 9999;
        max-width: 400px;
    `;
    
    container.innerHTML = `
        <h3 style="margin-top:0">Connectivity Check</h3>
        <div style="color:${results.httpPing ? '#4CAF50' : '#F44336'}">HTTP Ping: ${results.httpPing ? 'OK' : 'Failed'}</div>
        <div style="color:${results.websocket ? '#4CAF50' : '#F44336'}">WebSocket: ${results.websocket ? 'Connected' : 'Disconnected'}</div>
        <div style="color:${results.wifiStatus ? '#4CAF50' : '#F44336'}">WiFi Status API: ${results.wifiStatus ? 'OK' : 'Failed'}</div>
        ${results.errors.length > 0 ? 
            `<div style="margin-top:10px;border-top:1px solid #555;padding-top:10px">
                <strong>Errors:</strong>
                <ul style="margin:5px 0;padding-left:20px">
                    ${results.errors.map(err => `<li>${err}</li>`).join('')}
                </ul>
            </div>` : 
            ''
        }
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <button id="reconnect-websocket" style="padding:5px;background:#2ecc71;border:none;color:white;border-radius:3px;cursor:pointer">Reconnect</button>
            <button id="close-connectivity-check" style="padding:5px;background:#3498db;border:none;color:white;border-radius:3px;cursor:pointer">Close</button>
        </div>
    `;
    
    document.body.appendChild(container);
    
    // Add event listeners
    document.getElementById('close-connectivity-check').addEventListener('click', () => {
        document.body.removeChild(container);
    });
    
    document.getElementById('reconnect-websocket').addEventListener('click', () => {
        if (typeof window.initWebSocket === 'function') {
            window.initWebSocket();
            setTimeout(() => document.body.removeChild(container), 1000);
        }
    });
}

// Make globally available
window.checkConnectivity = function() {
    checkBackendConnectivity().then(displayConnectivityResults);
};

// Add check connectivity button to the page
document.addEventListener('DOMContentLoaded', function() {
    // Create a small button in the top-right corner
    const btn = document.createElement('button');
    btn.textContent = '🔌';
    btn.title = 'Check Connectivity';
    btn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9000;
        background: rgba(52, 152, 219, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    btn.onclick = window.checkConnectivity;
    document.body.appendChild(btn);
});
