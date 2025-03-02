/**
 * Extension Diagnostics
 * 
 * This utility provides diagnostic information about browser extension conflicts
 * and helps identify problematic scripts that may be interfering with the application.
 */

/**
 * Get diagnostic information about blocked scripts
 */
export function getExtensionDiagnostics(): Record<string, any> {
  if (typeof window === 'undefined') {
    return {
      environment: 'server',
      blockedScripts: [],
      blockedFetches: [],
      blockedDynamicScripts: [],
      hasBlockedScripts: false
    };
  }

  try {
    // Retrieve blocked script information from session storage
    const blockedScripts = JSON.parse(sessionStorage.getItem('blocked_scripts') || '[]');
    const blockedFetches = JSON.parse(sessionStorage.getItem('blocked_fetches') || '[]');
    const blockedDynamicScripts = JSON.parse(sessionStorage.getItem('blocked_dynamic_scripts') || '[]');
    const blockedExtensionScript = sessionStorage.getItem('blocked_extension_script') || null;

    // Check if any scripts were blocked
    const hasBlockedScripts = !!(
      blockedScripts.length || 
      blockedFetches.length || 
      blockedDynamicScripts.length || 
      blockedExtensionScript
    );

    // Get browser information
    const userAgent = navigator.userAgent;
    const browserInfo = {
      userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerActive: false
    };

    // Check if service worker is active
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration && registration.active) {
          browserInfo.serviceWorkerActive = true;
        }
      }).catch(err => {
        console.error('Error checking service worker status:', err);
      });
    }

    return {
      environment: 'client',
      timestamp: new Date().toISOString(),
      blockedScripts,
      blockedFetches,
      blockedDynamicScripts,
      blockedExtensionScript,
      hasBlockedScripts,
      browserInfo,
      url: window.location.href,
      referrer: document.referrer,
      localStorage: {
        available: isLocalStorageAvailable(),
        bypassEnabled: localStorage.getItem('gallery_bypass_enabled') === 'true'
      },
      sessionStorage: {
        available: isSessionStorageAvailable()
      }
    };
  } catch (e) {
    console.error('Error getting extension diagnostics:', e);
    return {
      environment: 'client',
      error: e.message,
      hasBlockedScripts: false
    };
  }
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
  try {
    const test = 'test';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Log diagnostic information to the console
 */
export function logDiagnostics(): void {
  const diagnostics = getExtensionDiagnostics();
  console.group('Extension Diagnostics');
  console.log('Timestamp:', diagnostics.timestamp);
  console.log('Environment:', diagnostics.environment);
  console.log('Has Blocked Scripts:', diagnostics.hasBlockedScripts);
  
  if (diagnostics.hasBlockedScripts) {
    console.group('Blocked Scripts');
    console.log('Via setAttribute:', diagnostics.blockedScripts);
    console.log('Via fetch:', diagnostics.blockedFetches);
    console.log('Via dynamic insertion:', diagnostics.blockedDynamicScripts);
    console.log('Last blocked script:', diagnostics.blockedExtensionScript);
    console.groupEnd();
  }
  
  console.log('Browser Info:', diagnostics.browserInfo);
  console.log('Storage Status:', {
    localStorage: diagnostics.localStorage,
    sessionStorage: diagnostics.sessionStorage
  });
  console.groupEnd();
  
  return diagnostics;
}

/**
 * Create a diagnostic report that can be shared
 */
export function createDiagnosticReport(): string {
  const diagnostics = getExtensionDiagnostics();
  return JSON.stringify(diagnostics, null, 2);
}

/**
 * Enable bypass mode for gallery authentication
 */
export function enableBypassMode(): void {
  try {
    localStorage.setItem('gallery_bypass_enabled', 'true');
    console.log('Gallery bypass mode enabled');
  } catch (e) {
    console.error('Failed to enable bypass mode:', e);
  }
}

/**
 * Disable bypass mode for gallery authentication
 */
export function disableBypassMode(): void {
  try {
    localStorage.removeItem('gallery_bypass_enabled');
    console.log('Gallery bypass mode disabled');
  } catch (e) {
    console.error('Failed to disable bypass mode:', e);
  }
}

/**
 * Check if bypass mode is enabled
 */
export function isBypassModeEnabled(): boolean {
  try {
    return localStorage.getItem('gallery_bypass_enabled') === 'true';
  } catch (e) {
    console.error('Failed to check bypass mode:', e);
    return false;
  }
}

// Automatically run diagnostics when this module is imported
if (typeof window !== 'undefined') {
  // Wait for the page to fully load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logDiagnostics();
    }, 1000);
  });
}
