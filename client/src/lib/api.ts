import { API_BASE_URL } from './api-config';
import { API_BASE_URL } from './config';

/**
 * Utility function to replace all direct fetch calls in the application
 * This ensures all API requests use the correct base URL
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 10000 // Default 10 second timeout
): Promise<T> {
  // Handle both relative and absolute URLs
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`Request to ${endpoint} timed out after ${timeoutMs}ms`);
    controller.abort('Timeout reached');
  }, timeoutMs);
  
  try {
    console.log(`Making API request to ${endpoint} with timeout ${timeoutMs}ms`);
    
    // Don't set Content-Type for FormData, let the browser set it with the boundary
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...options.headers,
    };
    
    // Only set Content-Type for non-FormData requests
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);
    
    // Log response status
    console.log(`Received response from ${endpoint}: `, response);
    
    // Handle empty responses (HTTP 204)
    if (response.status === 204) {
      return {} as T;
    }
    
    // Check if the response is OK
    if (!response.ok) {
      let errorData: any = {};
      
      try {
        // Try to parse error response as JSON
        errorData = await response.json();
      } catch (e) {
        // If parsing fails, use status text
        errorData = { message: response.statusText || 'Unknown error' };
      }
      
      const error = new Error(
        errorData.message || `API request failed with status ${response.status}`
      );
      
      // Add additional properties to the error
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      (error as any).url = url;
      (error as any).data = errorData;
      
      throw error;
    }
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json() as T;
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        throw new Error('Invalid JSON response from server');
      }
    } else if (contentType && contentType.includes('text/')) {
      return await response.text() as unknown as T;
    } else {
      // For other content types (like blobs)
      return await response.blob() as unknown as T;
    }
  } catch (error) {
    // Make sure timeout is cleared in case of error
    clearTimeout(timeoutId);
    
    // Enhance error with additional information
    if (error instanceof Error) {
      // Check if this is an abort error
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeoutMs}ms`);
        (timeoutError as any).isTimeout = true;
        (timeoutError as any).url = url;
        throw timeoutError;
      }
      
      // Add request information to other errors
      (error as any).url = url;
      (error as any).endpoint = endpoint;
    }
    
    throw error;
  }
}
