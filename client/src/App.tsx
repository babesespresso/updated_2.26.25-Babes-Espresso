import React, { useState, useEffect, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { Toaster } from './components/ui/toaster'
import { ErrorBoundary } from './components/ErrorBoundary'
import FallbackApp from './components/FallbackApp'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load pages to reduce initial bundle size
const HomePage = React.lazy(() => import('./pages/home'))
const AuthPage = React.lazy(() => import('./pages/auth'))
const AdminPage = React.lazy(() => import('./pages/admin'))
const GalleryPage = React.lazy(() => import('./pages/gallery'))
const CreatorPage = React.lazy(() => import('./pages/creator'))
const PremiumPage = React.lazy(() => import('./pages/premium'))
const SignupPage = React.lazy(() => import('./pages/signup'))
const ModelIntakePage = React.lazy(() => import('./pages/model-intake'))
const AboutPage = React.lazy(() => import('./pages/about'))

// Import ProtectedRoute directly instead of lazy loading it
import ProtectedRoute from './components/protected-route'
// Import BypassRoute for emergency access
import BypassRoute from './components/bypass-route'

function App() {
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [isStuck, setIsStuck] = useState(false);
  
  // Global error handler for the entire app
  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      // Extract error message and stack
      const error = event instanceof ErrorEvent ? event.error : event.reason;
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Unknown error');
      const errorStack = error?.stack || '';
      
      console.warn('Caught error:', errorMessage);
      
      // Check if this is related to extensions or problematic APIs
      // Significantly reduced to prevent false positives
      const isExtensionError = 
        // Only check for the most specific extension patterns
        errorMessage.includes('chrome-extension://') ||
        errorStack?.includes('chrome-extension://') ||
        errorMessage.includes('moz-extension://') ||
        errorStack?.includes('moz-extension://') ||
        errorMessage.includes('safari-extension://') ||
        errorStack?.includes('safari-extension://');
      
      if (isExtensionError) {
        // Count these errors
        setErrorCount(prev => prev + 1);
        
        // Track extension errors
        try {
          const totalErrors = parseInt(sessionStorage.getItem('app_extension_errors') || '0');
          sessionStorage.setItem('app_extension_errors', (totalErrors + 1).toString());
          
          // Store the last error for debugging
          sessionStorage.setItem('last_extension_error', JSON.stringify({
            message: errorMessage.substring(0, 500),
            stack: errorStack?.substring(0, 500) || '',
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          // Ignore storage errors
        }
        
        // Increased threshold from 3 to 10 to prevent premature fallback
        if (errorCount > 10) {
          console.warn('Too many extension errors, switching to fallback mode');
          setHasError(true);
          
          // Try global recovery if available
          if (typeof window.attemptRecovery === 'function') {
            window.attemptRecovery();
          }
        }
        
        // Prevent default error handling
        event.preventDefault();
        if (typeof event.stopPropagation === 'function') {
          event.stopPropagation();
        }
        return true;
      }
      
      return false;
    };
    
    // Add event listeners
    window.addEventListener('error', handleError as EventListener);
    window.addEventListener('unhandledrejection', handleError as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('error', handleError as EventListener);
      window.removeEventListener('unhandledrejection', handleError as EventListener);
    };
  }, [errorCount]);
  
  // Recovery mechanism - if we detect we're in a bad state, try to recover
  useEffect(() => {
    // Check for recovery flag from sessionStorage
    const inRecoveryMode = sessionStorage.getItem('recovery_mode') === 'true';
    
    // If we're in recovery mode, clear it and try to continue normally
    if (inRecoveryMode) {
      sessionStorage.removeItem('recovery_mode');
      console.log('App is in recovery mode, attempting to continue normally');
      
      // Clear any problematic storage
      try {
        // Clear any query cache
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('tanstack') || key.includes('query'))) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('Failed to remove item:', key);
          }
        });
      } catch (e) {
        console.error('Failed to clear storage during recovery:', e);
      }
    }
  }, [errorCount]);
  
  // Add a cleanup effect that runs when the app first loads
  useEffect(() => {
    // Clear any recovery-related flags that might be stuck
    try {
      sessionStorage.removeItem('recovery_mode');
      sessionStorage.removeItem('app_extension_errors');
      sessionStorage.removeItem('last_extension_error');
      
      // Clear any error-related localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('error') || 
          key.includes('recovery') || 
          key.includes('extension')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('Failed to remove item:', key);
        }
      });
      
      console.log('Cleared recovery-related storage items on app load');
    } catch (e) {
      console.error('Failed to clear storage during startup:', e);
    }
  }, []);
  
  // Watchdog timer to detect if the app is stuck
  useEffect(() => {
    // Only start watchdog if we've seen errors
    if (errorCount === 0) return;
    
    console.log('Starting watchdog timer due to previous errors');
    
    // Set up a watchdog timer - if we're still mounting after 30 seconds
    // and have accumulated errors, switch to fallback mode
    const watchdogTimer = setTimeout(() => {
      console.warn('Watchdog timer detected potential stuck state');
      // Disable automatic stuck state detection
      // setIsStuck(true);
    }, 90000); // Increased from 45s to 90s
    
    // Disable emergency watchdog
    /*
    const emergencyWatchdog = setTimeout(() => {
      console.warn('Emergency watchdog triggered - app may be stuck');
      // Don't automatically set hasError, just log the warning
      // setHasError(true);
    }, 60000);
    */
    
    return () => {
      clearTimeout(watchdogTimer);
      // clearTimeout(emergencyWatchdog);
    };
  }, [errorCount]);
  
  // If we've detected serious errors, show the fallback app
  if (hasError) {
    return <FallbackApp />;
  }
  
  // If we're stuck but not in full error mode yet, show a simpler recovery UI
  if (isStuck) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Application Loading Issue</h2>
          <p className="text-white/70 mb-6">
            We're having trouble loading the application. This could be due to:
          </p>
          <ul className="list-disc list-inside text-white/70 mb-6 space-y-1">
            <li>Network connectivity issues</li>
            <li>Server is temporarily unavailable</li>
            <li>Browser extension interference</li>
          </ul>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded transition-colors"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                } catch (e) {
                  console.error('Failed to clear storage:', e);
                }
                window.location.reload();
              }}
              className="bg-transparent border border-white/20 hover:bg-white/10 text-white py-2 px-4 rounded transition-colors"
            >
              Clear Cache & Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Custom loading component with error handling
  const LoadingFallback = () => (
    <div className="flex justify-center items-center h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="text-white/70 text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p>Loading application...</p>
        {errorCount > 0 && (
          <p className="text-amber-400 text-sm mt-2">
            Working through some issues... ({errorCount})
          </p>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin" element={
                <BypassRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminPage />
                  </Suspense>
                </BypassRoute>
              } />
              <Route path="/gallery" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <GalleryPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/premium" element={
                <Suspense fallback={<LoadingFallback />}>
                  <PremiumPage />
                </Suspense>
              } />
              <Route path="/creator/dashboard" element={
                <ProtectedRoute allowedRoles={['creator']}>
                  <Suspense fallback={<LoadingFallback />}>
                    <CreatorPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/signup" element={
                <Suspense fallback={<LoadingFallback />}>
                  <SignupPage />
                </Suspense>
              } />
              <Route path="/model-intake" element={
                <Suspense fallback={<LoadingFallback />}>
                  <ModelIntakePage />
                </Suspense>
              } />
              <Route path="/about" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AboutPage />
                </Suspense>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App