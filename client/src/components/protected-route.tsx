import { useEffect, ReactNode, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  
  // Check if gallery bypass is enabled
  const [bypassEnabled, setBypassEnabled] = useState(false);
  
  useEffect(() => {
    try {
      const bypass = localStorage.getItem('gallery_bypass_enabled');
      if (bypass === 'true' && location.pathname === '/gallery') {
        console.log('Gallery bypass enabled, skipping authentication check');
        setBypassEnabled(true);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [location.pathname]);
  
  // Set a timeout to detect if we're stuck in loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 8000); // 8 seconds timeout
    
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["/api/auth/session"],
    queryFn: getQueryFn<{ authenticated: boolean; user: any; }>({ on401: "returnNull" }),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000), // Exponential backoff
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    refetchInterval: false, // Disable automatic refetching
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Auth session query error:', error);
      setAuthAttempts(prev => prev + 1);
      // Don't redirect on error, just log it
    }
  });

  // Auto-recovery mechanism for authentication issues
  useEffect(() => {
    if (isError && authAttempts < 3) {
      // Try to recover by clearing cache and refetching
      const recoveryTimeout = setTimeout(() => {
        console.log(`Authentication recovery attempt ${authAttempts + 1}`);
        // Clear just the auth session query
        queryClient.removeQueries({ queryKey: ["/api/auth/session"] });
        // Attempt to refetch
        refetch();
      }, 2000);
      
      return () => clearTimeout(recoveryTimeout);
    }
  }, [isError, authAttempts, queryClient, refetch]);

  useEffect(() => {
    // Only redirect if we have definitive knowledge that user is not authenticated
    if (!isLoading && !isError && data === null) {
      console.log("User not authenticated, redirecting to auth page");
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive"
      });
      window.location.href = "/auth";
    }
  }, [data, isLoading, isError, toast]);

  // Check role-based access if allowedRoles are specified
  const hasRequiredRole = allowedRoles.length === 0 || 
    (data?.user?.role && allowedRoles.includes(data.user.role));

  // If we've been loading for too long, show a recovery option
  if (loadingTimeout && (isLoading || isError)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Issue</h2>
          <p className="text-white/70 mb-6">
            We're having trouble verifying your authentication status. This could be due to:
          </p>
          <ul className="list-disc pl-5 mb-6 text-white/70 space-y-2">
            <li>Network connectivity issues</li>
            <li>Server is temporarily unavailable</li>
            <li>Browser extension interference</li>
            <li>Session expired or invalid</li>
          </ul>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => {
                setLoadingTimeout(false);
                refetch();
              }}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => {
                // Clear all queries before redirecting
                queryClient.clear();
                window.location.href = "/auth";
              }}
              className="w-full py-2 bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-md transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state for loading or error conditions
  if (isLoading || isError || !data?.authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white/60">
            {isError ? "Checking authentication..." : "Loading..."}
          </p>
          {isError && (
            <p className="text-red-400 text-sm mt-2">
              {error instanceof Error ? error.message : "Error verifying authentication"}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-800 p-4 rounded-md max-w-md">
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-white/70">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // If bypass is enabled for gallery page, render children without authentication
  if (bypassEnabled && location.pathname === '/gallery') {
    console.log('Rendering gallery with bypass mode');
    return <>{children}</>;
  }
  
  // User is authenticated and has required role, render children
  return <>{children}</>;
}
