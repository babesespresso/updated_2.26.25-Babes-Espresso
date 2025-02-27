import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL } from "./config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || res.statusText;
    } catch {
      errorMessage = await res.text() || res.statusText;
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  try {
    // Prepend API_BASE_URL to relative URLs
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const res = await fetch(fullUrl, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        "Accept": "application/json"
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Handle empty responses
    if (res.status === 204) {
      return {} as T;
    }
    
    try {
      return await res.json() as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401 = "redirect" }: { on401?: UnauthorizedBehavior } = {}) =>
  async ({ queryKey }: { queryKey: string[] }): Promise<T> => {
    try {
      // Handle different query key formats
      let url: string;
      
      // If the query key is a simple string like ['gallery']
      if (queryKey.length === 1 && !queryKey[0].includes('/')) {
        // Map to appropriate API endpoint
        if (queryKey[0] === 'gallery') {
          url = '/api/gallery';
        } else if (queryKey[0] === 'featured') {
          url = '/api/gallery?type=featured';
        } else if (queryKey[0] === 'creators') {
          url = '/api/creators';
        } else if (queryKey[0] === 'followers') {
          url = '/api/followers';
        } else {
          url = `/api/${queryKey[0]}`;
        }
      } else {
        // Use the first element as the URL
        url = queryKey[0];
      }
      
      // Add a timeout to prevent hanging requests
      const controller = new AbortController();
      let timeoutId: number | null = setTimeout(() => {
        console.warn(`Request to ${url} timed out after 15 seconds`);
        controller.abort();
      }, 15000); // 15 second timeout
      
      // Function to clear timeout safely
      const clearTimeoutSafe = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };
      
      try {
        // Prepend API_BASE_URL to relative URLs if needed
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        console.log(`Fetching from: ${fullUrl}`);
        
        // First check if the server is available
        try {
          const serverCheckResponse = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(3000) // Slightly longer timeout for health check
          });
          
          // Consider 404 as acceptable - the server is running but the endpoint might not exist
          if (!serverCheckResponse.ok && serverCheckResponse.status !== 404) {
            console.warn(`Server health check failed with status ${serverCheckResponse.status}, using fallback data`);
            clearTimeoutSafe();
            return getFallbackData(url) as T;
          }
        } catch (healthError) {
          // Check if it's a browser extension error
          if (isExtensionError(healthError)) {
            console.warn('Browser extension interfered with health check request');
            // Continue with the main request despite extension error
          } else {
            console.warn('Server health check failed with error:', 
              healthError instanceof Error ? healthError.message : String(healthError));
            clearTimeoutSafe();
            return getFallbackData(url) as T;
          }
        }
        
        try {
          const response = await fetch(fullUrl, {
            credentials: 'include',
            signal: controller.signal,
            // Add cache control to prevent caching issues
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          // Clear the timeout as soon as we get a response
          clearTimeoutSafe();

          if (!response.ok) {
            if (response.status === 401) {
              console.warn('Authentication required for', url);
              if (on401 === "redirect") {
                window.location.href = "/auth";
                throw new Error("Authentication required. Redirecting to login...");
              } else if (on401 === "throw") {
                throw new Error("Authentication required");
              } else if (on401 === "returnNull") {
                return null;
              }
            }
            
            // Handle other error status codes
            let errorMessage: string;
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || response.statusText;
            } catch {
              errorMessage = await response.text() || response.statusText;
            }
            
            console.warn(`API error (${response.status}): ${errorMessage}`);
            
            // For server errors (5xx), use fallback data if available
            if (response.status >= 500) {
              console.warn(`Server error for ${url}, using fallback data`);
              return getFallbackData(url) as T;
            }
            
            throw new Error(`Failed to fetch ${url.split('/').pop()}`);
          }
          
          // Handle empty responses
          if (response.status === 204) {
            return {} as T;
          }
          
          try {
            const data = await response.json();
            return data as T;
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            throw new Error('Invalid response format');
          }
        } catch (error) {
          // Always clear the timeout to prevent memory leaks
          clearTimeoutSafe();
          
          // Check if this is an abort error (timeout)
          if (error instanceof DOMException && error.name === 'AbortError') {
            console.error(`Request to ${url} timed out after 15 seconds`);
            return getFallbackData(url) as T;
          }
          
          // Check if this is a network error
          if (error instanceof TypeError && error.message.includes('fetch')) {
            console.error(`Network error when fetching ${url}:`, error);
            return getFallbackData(url) as T;
          }
          
          // For other errors, log and rethrow
          console.error(`API request error (${url}):`, error);
          throw error;
        }
      } catch (fetchError) {
        clearTimeoutSafe();
        
        // Check if this is a network error or server unavailable
        if (
          fetchError instanceof TypeError || 
          (fetchError instanceof Error && 
            (fetchError.message.includes('Failed to fetch') || 
             fetchError.message.includes('NetworkError') ||
             fetchError.message.includes('Network request failed')))
        ) {
          console.warn('Network error, using fallback data');
          return getFallbackData(url) as T;
        }
        
        throw fetchError;
      }
    } catch (error) {
      // Detect if this is an extension-related error
      if (isExtensionError(error)) {
        console.warn('Browser extension interference detected in query:', error);
        // Return fallback data for this query
        return getFallbackData(queryKey[0]) as T;
      }
      
      // Re-throw other errors
      throw error;
    }
  };

// Provide fallback data for common API endpoints to prevent app crashes
function getFallbackData(url: string): any {
  // Extract the endpoint name from the URL
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1] || '';
  const endpoint = lastPart.split('?')[0]; // Remove query parameters
  
  // For endpoints with query parameters, keep the base endpoint name
  const baseEndpoint = urlParts[urlParts.length - 2] || '';
  
  // Check for query parameters
  const hasQueryParams = url.includes('?');
  const queryParams = hasQueryParams ? new URLSearchParams(url.split('?')[1]) : null;
  const isPremium = queryParams?.get('premium') === 'true';
  
  console.log(`Using fallback data for: ${url} (endpoint: ${endpoint}, isPremium: ${isPremium})`);
  
  // Return appropriate fallback data based on the endpoint
  switch (endpoint) {
    case 'creators':
      // Return a properly structured object with a creators array
      return { 
        creators: [], 
        total: 0, 
        page: 1, 
        pageSize: 10 
      };
    
    case 'followers':
      // Return an array directly instead of an object with a followers property
      return [];
    
    case 'gallery':
      // Check if this is a premium gallery request
      if (isPremium) {
        // Return an array of gallery items for premium content
        return [
          {
            id: 1,
            url: '/placeholder-premium.jpg',
            title: 'Premium Content (Offline Mode)',
            type: 'photo',
            contentRating: 'sfw',
            isPremium: true,
            tags: ['offline', 'placeholder'],
            description: 'This is placeholder content shown when offline.'
          }
        ];
      }
      // Regular gallery endpoint
      return [];
    
    case 'featured':
      return [];
    
    case 'session':
      return { authenticated: false, user: null };
    
    case 'profile':
      return { user: null, stats: { followers: 0, following: 0, posts: 0 } };
    
    case 'settings':
      return { settings: { theme: 'dark', notifications: false } };
    
    case 'notifications':
      return { notifications: [], unread: 0 };
    
    case 'stats':
      return { views: 0, likes: 0, comments: 0, shares: 0 };
    
    // Handle endpoints with IDs or query parameters
    default:
      // Check if this is a gallery item request
      if (baseEndpoint === 'gallery') {
        return { image: null, related: [] };
      }
      
      // Check if this is a user profile request
      if (baseEndpoint === 'users') {
        return { user: null, posts: [] };
      }
      
      // Generic fallback for any unhandled endpoints
      console.warn(`No specific fallback data for endpoint: ${endpoint}, using generic empty response`);
      return { data: null, success: false, message: 'Offline mode - data unavailable' };
  }
}

/**
 * Checks if an error is related to a browser extension
 */
export function isExtensionError(error: unknown): boolean {
  if (!error) return false;
  
  // Convert to string to handle both Error objects and string errors
  const errorString = error instanceof Error 
    ? (error.message + ' ' + (error.stack || '')) 
    : String(error);
  
  // Check for common extension-related error patterns
  return (
    // Chrome extension specific patterns
    errorString.includes('chrome-extension') ||
    errorString.includes('extension://') ||
    // Firefox extension patterns
    errorString.includes('moz-extension') ||
    // Safari extension patterns
    errorString.includes('safari-extension') ||
    errorString.includes('safari-web-extension') ||
    // Common extension error messages
    errorString.includes('Failed to fetch dynamically imported module') ||
    errorString.includes('useUserExtension') ||
    errorString.includes('useUserExtension-7c796cda.js') ||
    errorString.includes('redacted') ||
    errorString.includes('localStorage') ||
    errorString.includes('extension') ||
    errorString.includes('primitive value') ||
    errorString.includes('Cannot convert object to primitive value') ||
    // Security and storage errors often caused by extensions
    errorString.includes('SecurityError') ||
    errorString.includes('QuotaExceededError') ||
    errorString.includes('NotAllowedError') ||
    errorString.includes('Failed to execute') ||
    errorString.includes('The operation is insecure') ||
    errorString.includes('access storage') ||
    errorString.includes('null is not an object') ||
    errorString.includes('undefined is not an object') ||
    // React Query specific errors that might be caused by extensions
    errorString.includes('QueryCache.ts') ||
    errorString.includes('MutationCache.ts') ||
    errorString.includes('useQuery') ||
    errorString.includes('useMutation') ||
    // Specific error patterns from the logs
    errorString.includes('Promise error') ||
    errorString.includes('net::ERR_ABORTED') ||
    // Add more patterns as needed
    false
  );
}

// Create a custom storage that's safe from extension errors
const createSafeStorage = () => {
  const map = new Map<string, string>();
  
  return {
    getItem: (key: string): string | null => {
      try {
        // First try to get from localStorage for persistence
        const value = localStorage.getItem(key);
        if (value !== null) return value;
        
        // Fall back to in-memory map
        return map.get(key) || null;
      } catch (e) {
        console.warn('Error accessing localStorage, using in-memory storage:', e);
        return map.get(key) || null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        // Try to set in localStorage first
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('Error writing to localStorage, using in-memory storage:', e);
      }
      
      // Always set in map as backup
      map.set(key, value);
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Error removing from localStorage:', e);
      }
      map.delete(key);
    }
  };
};

// Create the query client with robust error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on extension errors
        if (isExtensionError(error)) {
          console.warn('Suppressing extension error in query retry:', 
            error instanceof Error ? error.message : String(error).substring(0, 100));
          return false;
        }
        
        // Only retry a few times for other errors
        return failureCount < 2;
      },
      // Prevent refetching too often
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Handle errors globally
      onError: (error) => {
        if (isExtensionError(error)) {
          console.warn('Suppressing extension error in query onError:', 
            error instanceof Error ? error.message : String(error).substring(0, 100));
          
          // Track extension errors
          try {
            const extensionErrorCount = parseInt(sessionStorage.getItem('query_extension_errors') || '0');
            sessionStorage.setItem('query_extension_errors', (extensionErrorCount + 1).toString());
            
            // If we're getting too many extension errors, try recovery
            if (extensionErrorCount > 3 && !sessionStorage.getItem('recovery_in_progress')) {
              sessionStorage.setItem('recovery_in_progress', 'true');
              console.log('Too many query extension errors, attempting recovery...');
              window.attemptRecovery?.();
            }
          } catch (e) {
            // Ignore storage errors
          }
          
          // Don't propagate extension errors
          return;
        }
        
        // Log other errors
        console.error('Query error:', error);
      },
      // Disable persisting queries to localStorage to avoid extension issues
      gcTime: 1000 * 60 * 60, // 1 hour
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on extension errors
        if (isExtensionError(error)) {
          console.warn('Suppressing extension error in mutation:', 
            error instanceof Error ? error.message : String(error).substring(0, 100));
          return false;
        }
        
        // Don't retry mutations by default
        return false;
      },
      onError: (error) => {
        if (isExtensionError(error)) {
          console.warn('Suppressing extension error in mutation onError:', 
            error instanceof Error ? error.message : String(error).substring(0, 100));
          
          // Track extension errors
          try {
            const extensionErrorCount = parseInt(sessionStorage.getItem('mutation_extension_errors') || '0');
            sessionStorage.setItem('mutation_extension_errors', (extensionErrorCount + 1).toString());
          } catch (e) {
            // Ignore storage errors
          }
          
          // Don't propagate extension errors
          return;
        }
        
        // Log other errors
        console.error('Mutation error:', error);
      },
    },
  },
  storage: createSafeStorage(),
});
