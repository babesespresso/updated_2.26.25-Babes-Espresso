// API configuration
export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3020' 
  : window.location.origin;

// Fallback ports to try if the main port is not working
export const FALLBACK_PORTS = [3020, 3021, 3022, 3023, 3024, 3025];

// Other configuration options can be added here
export const CLIENT_PORT = 3007;
