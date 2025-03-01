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

  componentDidMount() {
    // Register global recovery function
    window.attemptRecovery = this.attemptRecovery;
    
    // Check for bypass flag
    try {
      const bypassRecovery = localStorage.getItem('bypass_recovery') === 'true';
      if (bypassRecovery) {
        console.log('Recovery bypass flag detected, disabling error boundary');
        // Clear the error state if it was set
        if (this.state.hasError) {
          this.setState({ hasError: false, isExtensionError: false, recoveryAttempts: 0 });
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check for bypass flag first
    let bypassRecovery = false;
    try {
      bypassRecovery = localStorage.getItem('bypass_recovery') === 'true';
    } catch (e) {
      // Ignore storage errors
    }
    
    // If bypass is enabled, don't trigger the error boundary
    if (bypassRecovery) {
      console.log('Error boundary bypassed due to bypass_recovery flag');
      return {
        hasError: false,
        error,
        errorInfo: null,
        isExtensionError: false,
        recoveryAttempts: 0
      };
    }
    
    // Temporarily disable extension error detection
    const isExtensionError = false;
    
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
      // Bypass the extension error recovery screen
      return <FallbackApp />;
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
