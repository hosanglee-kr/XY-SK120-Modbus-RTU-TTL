/**
 * API utilities for communicating with the ESP32 backend
 */

const API_BASE_URL = window.location.origin; // Use same origin as the page

// Helper function for API calls
async function callApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    // Add default headers if none provided
    if (!options.headers) {
      options.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
    }

    console.log(`API call to ${url}`, options);
    const response = await fetch(url, options);
    
    // Log non-successful responses
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return { 
        success: false, 
        status: response.status, 
        error: `HTTP ${response.status} ${response.statusText}` 
      };
    }

    // Parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle text or other response types
      data = await response.text();
    }

    return { success: true, data };
  } catch (error) {
    console.error('API call failed:', error);
    return { success: false, error: error.message };
  }
}

// API endpoints
const api = {
  // Get system status
  getStatus: () => callApi('/api/status'),
  
  // Control functions
  setParams: (params) => callApi('/api/params', {
    method: 'POST',
    body: JSON.stringify(params)
  }),
  
  // Test endpoint to verify connectivity
  ping: () => callApi('/api/ping'),
};

export default api;
