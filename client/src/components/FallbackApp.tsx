import React, { useEffect, useState } from 'react';

export function FallbackApp() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [recoveryStatus, setRecoveryStatus] = useState('');
  // Track expanded sections with individual state variables for simplicity
  const [autoExpanded, setAutoExpanded] = useState(true);
  const [manualExpanded, setManualExpanded] = useState(true);
  const [technicalExpanded, setTechnicalExpanded] = useState(true);

  const attemptRecovery = () => {
    setIsRecovering(true);
    setRecoveryAttempts(prev => prev + 1);
    setRecoveryStatus('Clearing application data...');
    
    try {
      // Step 1: Clear problematic storage
      setRecoveryStatus('Clearing localStorage...');
      const keysToRemove = [];
      
      // First identify problematic keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('tanstack') || 
          key.includes('query') || 
          key.includes('cache') ||
          key.includes('extension')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Only remove a few keys at a time
      const keysToRemoveNow = keysToRemove.slice(0, 5);
      keysToRemoveNow.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log('Removed item:', key);
        } catch (e) {
          console.warn('Failed to remove item:', key);
        }
      });
      
      // Step 2: Set recovery flags
      setRecoveryStatus('Setting recovery flags...');
      sessionStorage.setItem('recovery_mode', 'true');
      sessionStorage.setItem('recovery_timestamp', Date.now().toString());
      sessionStorage.setItem('recovery_attempts', recoveryAttempts.toString());
      
      // Step 3: Reload the page after a short delay
      setRecoveryStatus('Reloading application...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (e) {
      console.error('Recovery failed:', e);
      setIsRecovering(false);
      setRecoveryStatus('Recovery failed. Please try the manual solutions.');
    }
  };

  // Check if we've been in a recovery loop
  useEffect(() => {
    const recoveryMode = sessionStorage.getItem('recovery_mode');
    const recoveryTimestamp = sessionStorage.getItem('recovery_timestamp');
    const previousAttempts = sessionStorage.getItem('recovery_attempts');
    
    if (recoveryMode === 'true') {
      // We've already tried recovery once
      if (previousAttempts) {
        setRecoveryAttempts(parseInt(previousAttempts) + 1);
      } else {
        setRecoveryAttempts(1);
      }
      
      // Clear the flags
      sessionStorage.removeItem('recovery_mode');
      
      // If we've tried too many times in a short period, suggest manual solutions
      if (recoveryTimestamp) {
        const timeSinceLastRecovery = Date.now() - parseInt(recoveryTimestamp);
        if (timeSinceLastRecovery < 10000 && parseInt(previousAttempts || '0') > 2) {
          // Less than 10 seconds between recovery attempts and more than 2 attempts
          setRecoveryStatus('Multiple recovery attempts detected. Please try the manual solutions.');
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Babes Espresso</h1>
        
        <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Application Error</h2>
          <p className="mb-4">
            We've detected an issue that's preventing the application from loading properly.
            This is likely caused by a browser extension interfering with the application.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Automatic Recovery Section */}
          <div className="bg-gray-700 p-4 rounded-md">
            <button 
              onClick={() => setAutoExpanded(!autoExpanded)}
              className="flex justify-between items-center w-full font-medium text-left py-2"
            >
              <h3 className="text-lg">Automatic Recovery</h3>
              <span className="text-xl">{autoExpanded ? '−' : '+'}</span>
            </button>
            
            {autoExpanded && (
              <div className="mt-4">
                <p className="mb-4">
                  You can attempt an automatic recovery which will clear cached data and reload the application.
                  {recoveryAttempts > 0 && ` We've already attempted recovery ${recoveryAttempts} time${recoveryAttempts > 1 ? 's' : ''}.`}
                </p>
                
                {recoveryStatus && (
                  <div className="mb-4 p-2 bg-blue-900/30 border border-blue-800 rounded text-sm">
                    {recoveryStatus}
                  </div>
                )}
                
                <button
                  onClick={attemptRecovery}
                  disabled={isRecovering}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-md transition-colors"
                >
                  {isRecovering ? 'Recovering...' : 'Attempt Recovery'}
                </button>
              </div>
            )}
          </div>
          
          {/* Manual Solutions Section */}
          <div className="bg-gray-700 p-4 rounded-md">
            <button 
              onClick={() => setManualExpanded(!manualExpanded)}
              className="flex justify-between items-center w-full font-medium text-left py-2"
            >
              <h3 className="text-lg">Manual Solutions</h3>
              <span className="text-xl">{manualExpanded ? '−' : '+'}</span>
            </button>
            
            {manualExpanded && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-blue-300">1. Use Private/Incognito Mode</h4>
                  <p className="text-sm text-gray-300">
                    Private browsing disables most extensions by default, which often resolves these issues.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-300 mt-2 ml-2">
                    <li>Chrome: Press Ctrl+Shift+N (Windows/Linux) or Cmd+Shift+N (Mac)</li>
                    <li>Firefox: Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)</li>
                    <li>Safari: Press Cmd+Shift+N</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-blue-300">2. Disable Browser Extensions</h4>
                  <p className="text-sm text-gray-300">
                    Ad blockers, privacy tools, and developer extensions can interfere with web applications.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-300 mt-2 ml-2">
                    <li>Chrome: Menu → More Tools → Extensions</li>
                    <li>Firefox: Menu → Add-ons and Themes</li>
                    <li>Safari: Preferences → Extensions</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-blue-300">3. Clear Browser Cache and Cookies</h4>
                  <p className="text-sm text-gray-300">
                    Clearing your cache can resolve issues with corrupted data.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-300 mt-2 ml-2">
                    <li>Chrome: Menu → Settings → Privacy and security → Clear browsing data</li>
                    <li>Firefox: Menu → Settings → Privacy & Security → Cookies and Site Data → Clear Data</li>
                    <li>Safari: Preferences → Privacy → Manage Website Data → Remove All</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-blue-300">4. Try a Different Browser</h4>
                  <p className="text-sm text-gray-300">
                    If the issue persists, try accessing the application in a different browser.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Technical Details Section */}
          <div className="bg-gray-700 p-4 rounded-md">
            <button 
              onClick={() => setTechnicalExpanded(!technicalExpanded)}
              className="flex justify-between items-center w-full font-medium text-left py-2"
            >
              <h3 className="text-lg">Technical Details</h3>
              <span className="text-xl">{technicalExpanded ? '−' : '+'}</span>
            </button>
            
            {technicalExpanded && (
              <div className="mt-4">
                <p className="text-sm text-gray-300 mb-2">
                  This error occurs when a browser extension interferes with the application's JavaScript execution.
                  Common causes include:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-300 ml-2">
                  <li>Ad blockers modifying the DOM or blocking API requests</li>
                  <li>Privacy extensions restricting access to browser storage</li>
                  <li>Developer tools injecting scripts that conflict with the application</li>
                  <li>Security extensions blocking certain JavaScript features</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FallbackApp;
