import { API_BASE_URL, FALLBACK_PORTS } from './config';

/**
 * Enhanced fetch function with timeout, error handling, and extension error detection
 * Specifically handles the 'redacted' error from useUserExtension
 */
export async function safeFetch(url: string, options: RequestInit = {}) {
  console.log(`SafeFetch request to: ${url}`, { timestamp: new Date().toISOString() });
  
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error(`Request to ${url} timed out after 10 seconds`);
  }, 10000); // 10 second timeout
  
  try {
    // Merge the abort signal with any existing options
    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.headers || {})
      }
    };
    
    console.log(`SafeFetch options for ${url}:`, fetchOptions);
    
    // Try the fetch with error handling for extension interference
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      // Check for abort (timeout)
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out. Server may be unavailable.`);
      }
      
      // Check for extension interference
      if (error.message && (
        error.message.includes('redacted') || 
        error.message.includes('extension') || 
        error.message.includes('useUserExtension')
      )) {
        console.warn('Browser extension interference detected:', error);
        throw new Error('Browser extension interference detected. Try disabling extensions or using incognito mode.');
      }
      
      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Attempts to fetch from the API with fallback ports if the main port fails
 */
export async function fetchWithFallback(endpoint: string, options: RequestInit = {}) {
  // First try with the configured API_BASE_URL
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Attempting fetch from primary URL: ${url}`);
    return await safeFetch(url, options);
  } catch (error: any) {
    // If it's an extension error or auth error, don't try fallbacks
    if (error.message && (
      error.message.includes('extension') || 
      error.message.includes('Authentication')
    )) {
      throw error;
    }
    
    // If it's a network or timeout error, try fallback ports
    console.log('Primary fetch failed, trying fallback ports...');
    
    // Extract the hostname from API_BASE_URL
    const url = new URL(API_BASE_URL);
    const hostname = url.hostname;
    
    // Try each fallback port
    for (const port of FALLBACK_PORTS) {
      try {
        const fallbackUrl = `http://${hostname}:${port}${endpoint}`;
        console.log(`Trying fallback: ${fallbackUrl}`);
        return await safeFetch(fallbackUrl, options);
      } catch (fallbackError) {
        console.log(`Fallback to port ${port} failed:`, fallbackError);
        // Continue to the next port
      }
    }
    
    // If all fallbacks fail, throw the original error
    throw error;
  }
}

/**
 * Handles common API response processing with error handling
 */
export async function processApiResponse<T>(response: Response, errorContext: string): Promise<T> {
  if (response.status === 401) {
    throw new Error(`Authentication failed. Please log in again to view ${errorContext}.`);
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${errorContext}: ${response.status}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.error(`JSON parse error for ${errorContext}:`, error);
    throw new Error(`Failed to parse ${errorContext} data from server`);
  }
}
