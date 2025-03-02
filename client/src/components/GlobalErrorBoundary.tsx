import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { applyScriptBlocker } from '../lib/script-blocker';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRedactedError: boolean;
  bypassEnabled: boolean;
  recoveryAttempts: number;
}

/**
 * Global error boundary that catches all errors in the application
 * Specifically designed to handle the 'redacted' error from useUserExtension
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isRedactedError: false,
    bypassEnabled: false,
    recoveryAttempts: 0
  };
  
  componentDidMount() {
    // Check if bypass mode is enabled
    try {
      const bypassEnabled = localStorage.getItem('gallery_bypass_enabled') === 'true';
      this.setState({ bypassEnabled });
      
      if (bypassEnabled) {
        console.log('Bypass mode is active in GlobalErrorBoundary');
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is the redacted error
    const isRedactedError = error.message?.includes('redacted') || 
                           error.stack?.includes('useUserExtension');
    
    // Store error info in session storage for diagnostics
    try {
      sessionStorage.setItem('global_error', JSON.stringify({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        isRedactedError
      }));
      
      // Mark extension error in session storage
      if (isRedactedError) {
        sessionStorage.setItem('user_extension_error', 'true');
      }
    } catch (e) {
      // Ignore storage errors
    }
    
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      isRedactedError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error caught by GlobalErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Increment recovery attempts
    this.setState(prevState => ({
      errorInfo,
      recoveryAttempts: prevState.recoveryAttempts + 1
    }));
    
    // Enable bypass mode for gallery if this is a redacted error
    if (error.message?.includes('redacted') || 
        error.stack?.includes('useUserExtension') ||
        errorInfo.componentStack?.includes('useUserExtension')) {
      try {
        // Apply script blocker aggressively
        console.log('Applying script blocker from GlobalErrorBoundary');
        applyScriptBlocker();
        
        // Enable bypass mode
        localStorage.setItem('gallery_bypass_enabled', 'true');
        sessionStorage.setItem('user_extension_error', 'true');
        this.setState({ bypassEnabled: true });
        
        // Update diagnostic info
        sessionStorage.setItem('global_error_details', JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          recoveryAttempts: this.state.recoveryAttempts + 1
        }));
      } catch (e) {
        console.error('Failed to enable bypass mode:', e);
      }
    }
  }

  private handleRefresh = () => {
    // Apply script blocker before refreshing
    try {
      console.log('Applying script blocker before refresh');
      applyScriptBlocker();
    } catch (e) {
      console.error('Failed to apply script blocker:', e);
    }
    
    window.location.reload();
  };

  private handleBypassMode = () => {
    try {
      // Apply script blocker before enabling bypass
      console.log('Applying script blocker before enabling bypass');
      applyScriptBlocker();
      
      // Enable bypass mode
      localStorage.setItem('gallery_bypass_enabled', 'true');
      sessionStorage.setItem('user_extension_error', 'true');
      this.setState({ bypassEnabled: true });
      
      // Reload to apply changes
      window.location.reload();
    } catch (e) {
      console.error('Failed to enable bypass mode:', e);
    }
  };

  private handleDisableBypass = () => {
    try {
      localStorage.removeItem('gallery_bypass_enabled');
      sessionStorage.removeItem('user_extension_error');
      this.setState({ bypassEnabled: false });
      window.location.reload();
    } catch (e) {
      console.error('Failed to disable bypass mode:', e);
    }
  };

  public render() {
    // Use the state's bypassEnabled value
    const { bypassEnabled } = this.state;

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Application Error</h2>
            
            {this.state.isRedactedError ? (
              <>
                <p className="text-white/70 mb-4">
                  We've detected an issue with a browser extension that's preventing the application from loading correctly.
                </p>
                <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-4 mb-6">
                  <p className="text-amber-400 text-sm">
                    Error: Browser extension interference detected (redacted error)
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-white/70 mb-4">
                  Something went wrong while loading the application.
                </p>
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 overflow-auto max-h-[200px]">
                  <p className="text-red-400 text-sm font-mono">
                    {this.state.error?.toString() || 'Unknown error'}
                  </p>
                </div>
              </>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={this.handleRefresh}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
              
              {this.state.isRedactedError && !bypassEnabled && (
                <Button 
                  onClick={this.handleBypassMode}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Enable Bypass Mode
                </Button>
              )}
              
              {this.state.recoveryAttempts > 1 && (
                <div className="mt-4 p-3 bg-orange-900/30 border border-orange-800 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-orange-300">
                      Multiple recovery attempts detected. Try clearing your browser cache or using a different browser.
                    </p>
                  </div>
                </div>
              )}
              
              {bypassEnabled && (
                <>
                  <Button 
                    onClick={this.handleDisableBypass}
                    className="w-full py-2 bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Disable Bypass Mode
                  </Button>
                  
                  <div className="mt-4 p-3 bg-blue-900/30 border border-blue-800 rounded-lg text-sm">
                    <p className="text-blue-300">
                      Bypass mode is active to work around extension conflicts.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
