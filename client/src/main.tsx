// Immediate recovery script for localStorage issues
try {
  // Create a special recovery flag
  const recoveryFlag = 'recovery_' + Date.now();
  
  // Check if we've been stuck in a recovery loop
  const previousRecovery = sessionStorage.getItem('app_recovery_attempt');
  if (previousRecovery) {
    const timeDiff = parseInt(recoveryFlag.split('_')[1]) - parseInt(previousRecovery.split('_')[1]);
    // If we've tried recovery within the last 5 seconds, we might be in a loop
    if (timeDiff < 5000) {
      console.warn('Detected potential recovery loop, skipping aggressive recovery');
      // Instead of clearing everything, just set a flag to skip further recovery
      sessionStorage.setItem('skip_recovery', 'true');
    } else {
      // It's been more than 5 seconds, safe to try recovery again
      sessionStorage.setItem('app_recovery_attempt', recoveryFlag);
    }
  } else {
    // First recovery attempt
    sessionStorage.setItem('app_recovery_attempt', recoveryFlag);
  }
  
  // Skip aggressive recovery if we're in a loop
  if (sessionStorage.getItem('skip_recovery') !== 'true') {
    // Force clear any problematic localStorage items that might be causing issues
    const keysToPreserve = ['auth-token', 'user-preferences'];
    const problematicPrefixes = ['tanstack-query-', 'extension-', 'chrome-'];
    
    // Safely iterate through localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const shouldPreserve = keysToPreserve.some(k => key.includes(k));
        const isPotentiallyProblematic = problematicPrefixes.some(prefix => key.includes(prefix));
        
        if (!shouldPreserve && isPotentiallyProblematic) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Only remove a few items at a time to be less aggressive
    const keysToRemoveNow = keysToRemove.slice(0, 3);
    keysToRemoveNow.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log('Removed potentially problematic localStorage item:', key);
      } catch (e) {
        console.warn('Failed to remove localStorage item:', key);
      }
    });
  }
} catch (e) {
  console.warn('Recovery script encountered an error:', e);
  // If we can't even run the recovery script, try to clear everything
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (clearError) {
    console.error('Failed to clear storage:', clearError);
  }
}

// Disable problematic browser APIs that extensions might hook into
try {
  // Create a backup of the original localStorage methods
  const originalSetItem = localStorage.setItem;
  const originalGetItem = localStorage.getItem;
  
  // Override localStorage.setItem to catch extension errors
  localStorage.setItem = function(key, value) {
    try {
      // Don't store anything related to extensions
      if (key.includes('extension') || key.includes('chrome') || 
          (typeof value === 'string' && value.includes('extension'))) {
        console.warn('Blocked potentially problematic localStorage write:', key);
        return;
      }
      return originalSetItem.call(localStorage, key, value);
    } catch (e) {
      console.warn('Suppressed localStorage.setItem error:', e);
      // Just prevent the error from propagating
      return undefined;
    }
  };
  
  // Override localStorage.getItem to catch extension errors
  localStorage.getItem = function(key) {
    try {
      return originalGetItem.call(localStorage, key);
    } catch (e) {
      console.warn('Suppressed localStorage.getItem error:', e);
      // Return null as if the key doesn't exist
      return null;
    }
  };
} catch (e) {
  console.warn('Failed to patch localStorage methods:', e);
}

// Add global error handlers to catch extension errors
function handleExtensionErrors(event: ErrorEvent | PromiseRejectionEvent): boolean {
  // Get the error object
  const error = event instanceof ErrorEvent ? event.error : event.reason;
  
  // Get error message and stack
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorStack = error?.stack || '';
  
  // Check if this is an extension error
  const isExtensionError = 
    // Chrome extension errors
    errorMessage.includes('chrome-extension://') || 
    errorStack.includes('chrome-extension://') ||
    // Firefox extension errors
    errorMessage.includes('moz-extension://') || 
    errorStack.includes('moz-extension://') ||
    // Edge extension errors
    errorMessage.includes('ms-browser-extension://') || 
    errorStack.includes('ms-browser-extension://') ||
    // Safari extension errors
    errorMessage.includes('safari-extension://') || 
    errorStack.includes('safari-extension://') ||
    // Common extension error patterns
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('Extension manifest') ||
    errorMessage.includes('useUserExtension') ||
    errorMessage.includes('redacted') ||
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    // Specific to React Query and extensions
    (errorMessage.includes('fetch') && errorStack.includes('tanstack')) ||
    (errorMessage.includes('JSON') && errorStack.includes('tanstack')) ||
    // Storage errors that might be caused by extensions
    errorMessage.includes('QuotaExceededError') ||
    errorMessage.includes('The operation is insecure');
  
  if (isExtensionError) {
    // Log the error but don't crash the app
    console.warn('Suppressed browser extension error:', {
      message: errorMessage,
      type: event instanceof ErrorEvent ? 'error' : 'unhandledrejection',
      source: event instanceof ErrorEvent ? event.filename : 'promise',
    });
    
    // Record the error in sessionStorage for debugging
    try {
      const extensionErrors = JSON.parse(sessionStorage.getItem('extension_errors') || '[]');
      extensionErrors.push({
        time: new Date().toISOString(),
        message: errorMessage.slice(0, 200), // Limit message length
        type: event instanceof ErrorEvent ? 'error' : 'unhandledrejection',
      });
      // Keep only the last 10 errors
      if (extensionErrors.length > 10) {
        extensionErrors.shift();
      }
      sessionStorage.setItem('extension_errors', JSON.stringify(extensionErrors));
    } catch (e) {
      console.warn('Failed to record extension error in sessionStorage:', e);
    }
    
    // Try to recover from the error
    setTimeout(() => {
      attemptRecovery();
    }, 500);
    
    return true; // We handled the error
  }
  
  return false; // Not an extension error
}

// Add event listeners for both error types
window.addEventListener('error', (event) => {
  if (handleExtensionErrors(event)) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  return false;
});

window.addEventListener('unhandledrejection', (event) => {
  if (handleExtensionErrors(event)) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  return false;
});

import { createRoot } from "react-dom/client";
import React from 'react'
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./components/error-boundary";
import { Toaster } from './components/ui/toaster'

// Global function for handling recovery attempts
window.attemptRecovery = function() {
  console.log('Manual recovery attempt initiated');
  
  try {
    // Track recovery attempts
    const attemptCount = parseInt(sessionStorage.getItem('recovery_attempts') || '0') + 1;
    sessionStorage.setItem('recovery_attempts', attemptCount.toString());
    
    // If we've tried too many times, just redirect to home
    if (attemptCount > 3) {
      console.log('Too many recovery attempts, redirecting to home page');
      window.location.href = '/';
      return true;
    }
    
    // Step 1: Clear only a few problematic localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('tanstack') || 
        key.includes('query') || 
        key.includes('cache') ||
        key.includes('extension') ||
        key.includes('react-query') ||
        key.includes('user-extension') ||
        key.includes('useUserExtension')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Only remove a few items at a time
    const keysToRemoveNow = keysToRemove.slice(0, 5);
    keysToRemoveNow.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log('Removed localStorage item:', key);
      } catch (e) {
        console.warn('Failed to remove localStorage item:', key);
      }
    });
    
    // Step 2: Set recovery flags
    sessionStorage.setItem('manual_recovery', 'true');
    sessionStorage.setItem('recovery_timestamp', Date.now().toString());
    
    // Step 3: Reload the page after a short delay
    console.log('Reloading application...');
    setTimeout(() => {
      // Redirect to home page instead of reloading with cache-busting parameters
      window.location.href = '/';
    }, 1000);
    
    return true;
  } catch (e) {
    console.error('Recovery failed:', e);
    return false;
  }
};

// Add React Query global cache type to window
declare global {
  interface Window {
    attemptRecovery: () => boolean;
    __REACT_QUERY_GLOBAL_CACHE__?: {
      clear: () => void;
    };
  }
}

// Fallback component for the root error boundary
function RootErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h2>
        <p className="mb-4 text-gray-700">
          We're sorry, but there was an error loading the application. This might be caused by a browser extension.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Refresh the page
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary 
      FallbackComponent={({ error }) => (
        <RootErrorFallback />
      )}
      onReset={() => window.location.reload()}
    >
      <App />
      <Toaster />
    </ErrorBoundary>
  </React.StrictMode>
);
