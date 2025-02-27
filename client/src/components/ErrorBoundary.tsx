import React, { Component, ErrorInfo, ReactNode } from 'react';
import FallbackApp from './FallbackApp';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isExtensionError: boolean;
  recoveryAttempts: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private recoveryTimer: NodeJS.Timeout | null = null;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isExtensionError: false,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is an extension error or lazy loading error
    const isExtensionError = 
      error.message?.includes('chrome-extension') ||
      error.message?.includes('extension://') ||
      error.message?.includes('moz-extension') ||
      error.message?.includes('safari-extension') ||
      error.message?.includes('safari-web-extension') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('useUserExtension') ||
      error.message?.includes('redacted') ||
      error.message?.includes('localStorage') ||
      error.message?.includes('primitive value') ||
      error.message?.includes('Cannot convert object to primitive value') ||
      error.message?.includes('SecurityError') ||
      error.message?.includes('QuotaExceededError') ||
      error.message?.includes('NotAllowedError') ||
      error.message?.includes('Failed to execute') ||
      error.message?.includes('The operation is insecure') ||
      error.message?.includes('access storage') ||
      error.message?.includes('null is not an object') ||
      error.message?.includes('undefined is not an object') ||
      error.message?.includes('QueryCache.ts') ||
      error.message?.includes('MutationCache.ts') ||
      error.message?.includes('useQuery') ||
      error.message?.includes('useMutation') ||
      error.stack?.includes('chrome-extension') ||
      error.stack?.includes('extension://') ||
      error.stack?.includes('moz-extension') ||
      error.stack?.includes('safari-extension') ||
      error.stack?.includes('useUserExtension');
    
    // Update state so the next render will show the fallback UI.
    return { 
      hasError: true, 
      error,
      errorInfo: null,
      isExtensionError,
      recoveryAttempts: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if this is an extension error or lazy loading error
    const isExtensionError = 
      error.message?.includes('chrome-extension') ||
      error.message?.includes('extension://') ||
      error.message?.includes('moz-extension') ||
      error.message?.includes('safari-extension') ||
      error.message?.includes('safari-web-extension') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('useUserExtension') ||
      error.message?.includes('redacted') ||
      error.message?.includes('localStorage') ||
      error.message?.includes('primitive value') ||
      error.message?.includes('Cannot convert object to primitive value') ||
      error.message?.includes('SecurityError') ||
      error.message?.includes('QuotaExceededError') ||
      error.message?.includes('NotAllowedError') ||
      error.message?.includes('Failed to execute') ||
      error.message?.includes('The operation is insecure') ||
      error.message?.includes('access storage') ||
      error.message?.includes('null is not an object') ||
      error.message?.includes('undefined is not an object') ||
      error.message?.includes('QueryCache.ts') ||
      error.message?.includes('MutationCache.ts') ||
      error.message?.includes('useQuery') ||
      error.message?.includes('useMutation') ||
      error.stack?.includes('chrome-extension') ||
      error.stack?.includes('extension://') ||
      error.stack?.includes('moz-extension') ||
      error.stack?.includes('safari-extension') ||
      error.stack?.includes('useUserExtension');
    
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({ 
      error, 
      errorInfo,
      isExtensionError
    });
    
    // For extension errors or lazy loading errors, try to auto-recover
    if (isExtensionError) {
      this.attemptRecovery();
      
      // Log extension error for analytics
      try {
        const errorData = {
          type: 'extension_error',
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        };
        
        // Store in sessionStorage for debugging
        sessionStorage.setItem('last_extension_error', JSON.stringify(errorData));
        
        // Track total extension errors
        const totalErrors = parseInt(sessionStorage.getItem('total_extension_errors') || '0');
        sessionStorage.setItem('total_extension_errors', (totalErrors + 1).toString());
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    // Set a recovery flag in sessionStorage to help the app recover on reload
    try {
      sessionStorage.setItem('recovery_mode', 'true');
      sessionStorage.setItem('error_timestamp', Date.now().toString());
    } catch (e) {
      console.warn('Failed to set recovery mode flag:', e);
    }
  }
  
  componentWillUnmount() {
    // Clear any pending timers
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
  }
  
  attemptRecovery = () => {
    const { recoveryAttempts } = this.state;
    
    // Don't try to recover too many times
    if (recoveryAttempts >= 3) {
      console.warn('Too many recovery attempts, showing fallback UI');
      return;
    }
    
    console.log(`Attempting recovery from extension error (attempt ${recoveryAttempts + 1})`);
    
    // Increment recovery attempts
    this.setState(prev => ({ 
      recoveryAttempts: prev.recoveryAttempts + 1 
    }));
    
    // Try to clear problematic storage
    try {
      // Clear any query cache
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('tanstack') || 
          key.includes('query') || 
          key.includes('cache') ||
          key.includes('extension') ||
          key.includes('react-query')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Only remove a few keys at a time to avoid being too aggressive
      const keysToRemoveNow = keysToRemove.slice(0, 5);
      keysToRemoveNow.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log('Removed item:', key);
        } catch (e) {
          console.warn('Failed to remove item:', key);
        }
      });
      
      // Set recovery flags
      sessionStorage.setItem('recovery_mode', 'true');
      sessionStorage.setItem('recovery_timestamp', Date.now().toString());
      sessionStorage.setItem('recovery_attempts', recoveryAttempts.toString());
    } catch (e) {
      console.error('Failed to clear storage during recovery:', e);
    }
    
    // Reset error state after a short delay
    this.recoveryTimer = setTimeout(() => {
      this.setState({ 
        hasError: false,
        error: null,
        errorInfo: null
      });
      
      // If we've tried multiple times with no success, reload the page
      if (recoveryAttempts >= 2) {
        // Instead of reloading or using attemptRecovery, just redirect to home
        window.location.href = '/';
      }
    }, 1000);
  }

  render() {
    const { hasError, error, isExtensionError, recoveryAttempts } = this.state;
    
    if (hasError) {
      // If we have extension errors, show the fallback app after fewer attempts
      // This ensures users see the helpful recovery UI sooner
      if (isExtensionError && recoveryAttempts >= 2) {
        return <FallbackApp />;
      }
      
      // For extension errors we're still trying to recover from
      if (isExtensionError) {
        return (
          <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
              <h1 className="text-2xl font-bold mb-4">Recovering...</h1>
              <p className="mb-4">
                We've detected an issue with a browser extension or component loading. 
                Attempting to recover automatically.
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" 
                     style={{ width: `${(recoveryAttempts / 2) * 100}%` }}></div>
              </div>
              <p className="text-sm text-gray-400">
                If this issue persists, try disabling browser extensions, 
                especially React/Redux DevTools or similar development tools.
              </p>
            </div>
          </div>
        );
      }
      
      // For other errors
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4 text-red-400">
              {error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

declare global {
  interface Window {
    __REACT_QUERY_GLOBAL_CACHE__?: {
      clear: () => void;
    };
    attemptRecovery?: () => boolean;
  }
}
