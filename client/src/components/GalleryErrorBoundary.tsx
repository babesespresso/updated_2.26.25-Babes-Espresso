import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Shield, RefreshCw, Activity } from 'lucide-react';
import { applyScriptBlocker } from '../lib/script-blocker';
import { logDiagnostics, enableBypassMode, isBypassModeEnabled } from '../lib/extension-diagnostics';
import ExtensionDiagnostics from './ExtensionDiagnostics';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  bypassEnabled: boolean;
  recoveryAttempts: number;
  showDiagnostics: boolean;
}

export class GalleryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      bypassEnabled: false,
      recoveryAttempts: 0,
      showDiagnostics: false
    };
  }
  
  componentDidMount() {
    // Apply script blocker immediately
    applyScriptBlocker();
    
    // Check if bypass mode is enabled
    try {
      const bypassEnabled = isBypassModeEnabled();
      this.setState({ bypassEnabled });
      
      if (bypassEnabled) {
        console.log('Gallery bypass mode is active in ErrorBoundary');
      }
      
      // Check if we should show diagnostics based on blocked scripts
      const blockedScript = sessionStorage.getItem('blocked_extension_script');
      if (blockedScript) {
        console.log('Extension conflicts detected in GalleryErrorBoundary');
        this.setState({ showDiagnostics: true });
      }
      
      // Check URL for bypass parameter
      if (window.location.search.includes('bypass=true')) {
        console.log('Bypass mode activated via URL parameter in ErrorBoundary');
        enableBypassMode();
        this.setState({ bypassEnabled: true });
      }
      
      // Check for previous errors
      const extensionError = sessionStorage.getItem('user_extension_error');
      if (extensionError === 'true') {
        console.log('Previous extension error detected in ErrorBoundary');
        this.setState({ showDiagnostics: true });
      }
    } catch (e) {
      console.error('Error in ErrorBoundary componentDidMount:', e);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    console.log('Gallery Error Boundary caught error:', error.message);
    
    // Check if this is the specific redacted error
    const isRedactedError = error.message?.includes('redacted') || 
                           (error.stack && error.stack.includes('useUserExtension'));
    
    if (isRedactedError) {
      console.log('Redacted error detected in getDerivedStateFromError');
      
      // Try to enable bypass mode automatically
      try {
        localStorage.setItem('gallery_bypass_enabled', 'true');
        sessionStorage.setItem('user_extension_error', 'true');
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error: error,
      showDiagnostics: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Gallery Error Boundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Increment recovery attempts
    this.setState(prevState => ({
      recoveryAttempts: prevState.recoveryAttempts + 1,
      showDiagnostics: true // Always show diagnostics when an error occurs
    }));
    
    // Check if this is an extension-related error
    const isExtensionError = error.message?.includes('redacted') || 
                            error.message?.includes('extension') ||
                            error.stack?.includes('useUserExtension') ||
                            error.stack?.includes('userExtension') ||
                            error.stack?.includes('user-extension') ||
                            error.stack?.includes('localStorage-77a5f03a.js') ||
                            error.stack?.includes('index-2e95b6eb.js') ||
                            errorInfo.componentStack?.includes('useUserExtension');
    
    if (isExtensionError) {
      console.warn('Browser extension interference detected in GalleryErrorBoundary');
      
      // Enable bypass mode automatically for extension errors
      try {
        enableBypassMode();
        sessionStorage.setItem('user_extension_error', 'true');
        this.setState({ bypassEnabled: true });
        
        // Apply script blocker aggressively
        applyScriptBlocker();
        
        // Create a global recovery function
        window.attemptRecovery = () => {
          console.log('Attempting recovery from extension error');
          // Force reload with bypass parameter
          window.location.href = window.location.pathname + '?bypass=true&t=' + Date.now();
        };
        
        // Auto-attempt recovery after a short delay if this is the redacted error
        if (error.message?.includes('redacted') || error.stack?.includes('useUserExtension-7c796cda.js')) {
          console.log('Scheduling auto-recovery for redacted error');
          setTimeout(() => {
            if (window.attemptRecovery) {
              window.attemptRecovery();
            }
          }, 2000);
        }
      } catch (e) {
        console.error('Failed to enable bypass mode:', e);
      }
      
      // Store diagnostic info in sessionStorage and log diagnostics
      try {
        sessionStorage.setItem('gallery_extension_error', JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          recoveryAttempts: this.state.recoveryAttempts + 1
        }));
        
        // Log diagnostics when errors occur
        logDiagnostics();
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({ 
      hasError: false,
      error: null
    });
  }
  
  enableBypassMode = (): void => {
    try {
      // Enable bypass mode using the utility function
      enableBypassMode();
      sessionStorage.setItem('user_extension_error', 'true');
      
      // Apply script blocker aggressively
      applyScriptBlocker();
      
      // Reset error state and set bypass flag
      this.setState({
        hasError: false,
        error: null,
        bypassEnabled: true
      });
      
      // Log diagnostics before reload
      logDiagnostics();
      
      // Reload the page with bypass parameter to ensure it's applied
      window.location.href = window.location.pathname + '?bypass=true&t=' + Date.now();
    } catch (e) {
      console.error('Failed to enable bypass mode:', e);
    }
  }
  
  toggleDiagnostics = (): void => {
    this.setState(prevState => ({
      showDiagnostics: !prevState.showDiagnostics
    }));
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if this is an extension-related error
      const isExtensionError = this.state.error?.message?.includes('redacted') || 
                              this.state.error?.message?.includes('extension') ||
                              this.state.error?.stack?.includes('useUserExtension');
      
      // Extension error specific message
      if (isExtensionError) {
        return (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-4 text-center">
            <h3 className="text-xl font-medium text-white mb-4">Gallery Loading Issue</h3>
            <p className="text-white/70 mb-6 max-w-md">
              A browser extension may be interfering with the gallery. Try disabling extensions or using incognito mode.
            </p>
            
            {this.state.error?.message?.includes('redacted') && (
              <div className="mb-6 p-3 bg-red-900/30 border border-red-700/50 rounded-md max-w-md text-left">
                <h4 className="font-medium text-red-300 text-sm">Redacted Error Detected</h4>
                <p className="text-red-100/80 text-xs mt-1">
                  This specific error is caused by a browser extension that conflicts with the gallery authentication.
                </p>
                <Button 
                  onClick={() => {
                    if (window.attemptRecovery) {
                      window.attemptRecovery();
                    } else {
                      this.enableBypassMode();
                    }
                  }}
                  variant="outline"
                  className="mt-2 text-xs bg-red-950 border-red-700 hover:bg-red-900 text-white"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto-Recover Now
                </Button>
              </div>
            )}
            
            {this.state.bypassEnabled && (
              <div className="mb-6 p-3 bg-blue-900/30 border border-blue-700/50 rounded-md max-w-md text-left">
                <h4 className="font-medium text-blue-300 text-sm">Bypass Mode Active</h4>
                <p className="text-blue-100/80 text-xs mt-1">
                  Bypass mode is enabled to work around extension conflicts.
                  {this.state.recoveryAttempts > 1 && " Multiple recovery attempts detected."}
                </p>
              </div>
            )}
            
            {this.state.showDiagnostics && (
              <div className="mb-6 w-full max-w-md">
                <ExtensionDiagnostics onClose={this.toggleDiagnostics} />
              </div>
            )}
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 flex-wrap justify-center">
              {!this.state.bypassEnabled && (
                <Button 
                  onClick={this.enableBypassMode}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Enable Bypass Mode
                </Button>
              )}
              
              <Button 
                onClick={this.toggleDiagnostics}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                {this.state.showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
              </Button>
              
              <Button 
                onClick={() => {
                  // Apply script blocker before retrying
                  try {
                    applyScriptBlocker();
                    // Log diagnostics
                    logDiagnostics();
                  } catch (e) {
                    console.error('Failed to apply script blocker:', e);
                  }
                  this.resetErrorBoundary();
                }}
                variant="default"
                className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        );
      }
      
      // Generic error fallback
      return this.props.fallback || (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-4 text-center">
          <h3 className="text-xl font-medium text-white mb-4">Application Error</h3>
          <p className="text-white/70 mb-6 max-w-md">
            Something went wrong while loading the gallery. Please try again.
          </p>
          
          {this.state.recoveryAttempts > 1 && (
            <div className="mb-6 p-3 bg-orange-900/30 border border-orange-700/50 rounded-md max-w-md text-left">
              <h4 className="font-medium text-orange-300 text-sm">Multiple Recovery Attempts</h4>
              <p className="text-orange-100/80 text-xs mt-1">
                We've detected multiple recovery attempts. Try clearing your browser cache or using a different browser.
              </p>
            </div>
          )}
          
          {this.state.showDiagnostics && (
            <div className="mb-6 w-full max-w-md">
              <ExtensionDiagnostics onClose={this.toggleDiagnostics} />
            </div>
          )}
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Button 
              onClick={this.toggleDiagnostics}
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {this.state.showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
            </Button>
            
            <Button 
              onClick={() => {
                // Apply script blocker before retrying
                try {
                  applyScriptBlocker();
                  // Log diagnostics
                  logDiagnostics();
                } catch (e) {
                  console.error('Failed to apply script blocker:', e);
                }
                this.resetErrorBoundary();
              }}
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
