import React, { ReactNode, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Shield, RefreshCw } from 'lucide-react';
import { applyScriptBlocker } from '../lib/script-blocker';

interface GalleryBypassProps {
  children: ReactNode;
}

/**
 * A component that attempts to bypass authentication issues for the Gallery page
 * This is a temporary solution to handle the useUserExtension error
 */
export function GalleryBypass({ children }: GalleryBypassProps) {
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [hasExtensionError, setHasExtensionError] = useState(false);
  
  // Check for extension errors on mount
  useEffect(() => {
    try {
      const extensionError = sessionStorage.getItem('user_extension_error');
      if (extensionError) {
        console.log('GalleryBypass detected extension error');
        setHasExtensionError(true);
      }
    } catch (e) {
      // Ignore storage errors
    }
    
    // Check if bypass is already enabled
    try {
      const bypass = localStorage.getItem('gallery_bypass_enabled');
      if (bypass === 'true') {
        console.log('Gallery bypass already enabled');
        setBypassEnabled(true);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);
  
  // Enable bypass mode
  const enableBypass = () => {
    try {
      // Apply script blocker before enabling bypass
      console.log('Applying script blocker from gallery-bypass');
      applyScriptBlocker();
      
      // Set bypass flags
      localStorage.setItem('gallery_bypass_enabled', 'true');
      sessionStorage.setItem('user_extension_error', 'true');
      setBypassEnabled(true);
      
      // Force reload to apply bypass
      window.location.reload();
    } catch (e) {
      console.error('Failed to enable bypass:', e);
    }
  };
  
  // Disable bypass mode
  const disableBypass = () => {
    try {
      localStorage.removeItem('gallery_bypass_enabled');
      sessionStorage.removeItem('user_extension_error');
      setBypassEnabled(false);
      
      // Force reload to apply changes
      window.location.reload();
    } catch (e) {
      console.error('Failed to disable bypass:', e);
    }
  };
  
  // Apply script blocker if bypass is enabled
  useEffect(() => {
    if (bypassEnabled || hasExtensionError) {
      try {
        console.log('Applying script blocker from gallery-bypass (bypass enabled)');
        applyScriptBlocker();
      } catch (e) {
        console.error('Failed to apply script blocker:', e);
      }
    }
  }, [bypassEnabled, hasExtensionError]);
  
  // If there's no extension error and bypass is not enabled, just render children
  if (!hasExtensionError && !bypassEnabled) {
    return <>{children}</>;
  }
  
  // If bypass is enabled, show a notice
  if (bypassEnabled) {
    return (
      <>
        <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-amber-400 font-medium">Authentication Bypass Enabled</h3>
              <p className="text-white/70 text-sm mt-1">
                Gallery is running in bypass mode to work around authentication issues.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={disableBypass}
              className="border-amber-600 text-amber-400 hover:bg-amber-900/50"
            >
              Disable Bypass
            </Button>
          </div>
        </div>
        {children}
      </>
    );
  }
  
  // If there's an extension error but bypass is not enabled, show the bypass option
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-4 text-center">
      <h3 className="text-xl font-medium text-white mb-4">Gallery Authentication Issue</h3>
      <p className="text-white/70 mb-6 max-w-md">
        We've detected an authentication issue that may be preventing the gallery from loading.
        You can try enabling bypass mode to work around this issue.
      </p>
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
        <Button 
          onClick={enableBypass}
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Enable Bypass Mode
        </Button>
        <Button 
          onClick={() => {
            // Apply script blocker before trying again
            try {
              console.log('Applying script blocker before retry');
              applyScriptBlocker();
            } catch (e) {
              console.error('Failed to apply script blocker:', e);
            }
            window.location.reload();
          }}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again Normally
        </Button>
      </div>
    </div>
  );
}
