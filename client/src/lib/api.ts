import { API_BASE_URL } from './config';

/**
 * Utility function to replace all direct fetch calls in the application
 * This ensures all API requests use the correct base URL
 */
export async function fetchApi<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  // Prepend API_BASE_URL to relative URLs
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`);
  
  try {
    // Make the request
    const response = await fetch(fullUrl, {
      ...options,
      credentials: 'include', // Always include credentials
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
      }
    });
    
    // Handle errors
    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      
      console.error(`[API Error] ${response.status} ${response.statusText}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // Parse JSON response
    try {
      const data = await response.json();
      console.log(`[API Response] ${options.method || 'GET'} ${fullUrl} - Success`);
      return data;
    } catch (e) {
      console.log(`[API Response] ${options.method || 'GET'} ${fullUrl} - Empty response`);
      return {} as T;
    }
  } catch (error) {
    console.error(`[API Request Failed] ${options.method || 'GET'} ${fullUrl}`, error);
    throw error;
  }
}
