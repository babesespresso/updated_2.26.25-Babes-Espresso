import { API_BASE_URL } from './config';

/**
 * Utility to check if an API endpoint requires authentication
 * This helps diagnose authentication-related issues
 */
export async function checkApiEndpointAuth(endpoint: string): Promise<{
  requiresAuth: boolean;
  statusCode: number;
  message: string;
}> {
  console.log(`Checking auth requirements for: ${endpoint}`);
  
  try {
    // Make a request without authentication
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // Check if the endpoint returned 401 (requires auth) or succeeded
    if (response.status === 401) {
      return {
        requiresAuth: true,
        statusCode: 401,
        message: 'This endpoint requires authentication'
      };
    } else if (response.ok) {
      return {
        requiresAuth: false,
        statusCode: response.status,
        message: 'This endpoint is publicly accessible'
      };
    } else {
      return {
        requiresAuth: false, // Assume not auth issue if not 401
        statusCode: response.status,
        message: `Endpoint returned status: ${response.status}`
      };
    }
  } catch (error) {
    return {
      requiresAuth: false, // Can't determine
      statusCode: 0,
      message: `Error checking endpoint: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Check all critical API endpoints to determine auth requirements
 * This is useful for debugging authentication issues
 */
export async function checkAllApiEndpoints(): Promise<Record<string, any>> {
  const endpoints = [
    '/api/gallery',
    '/api/gallery?type=featured',
    '/api/auth/session'
  ];
  
  const results: Record<string, any> = {};
  
  for (const endpoint of endpoints) {
    results[endpoint] = await checkApiEndpointAuth(endpoint);
  }
  
  console.table(results);
  return results;
}

// Add a global diagnostic function
if (typeof window !== 'undefined') {
  (window as any).checkGalleryAuth = async () => {
    console.log('Checking gallery API authentication requirements...');
    return await checkAllApiEndpoints();
  };
}
