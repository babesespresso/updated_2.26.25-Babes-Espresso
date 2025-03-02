import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import type { GalleryImage } from "../types/gallery";
import { Layout } from "../components/layout";
import { InstagramLogoIcon, TwitterLogoIcon, VideoIcon } from "@radix-ui/react-icons";
import { Button } from "../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { API_BASE_URL } from "../lib/config";
import { fetchWithFallback, processApiResponse, safeFetch } from "../lib/api-utils";
import { GalleryErrorBoundary } from "../components/GalleryErrorBoundary";
import { AuthDiagnostics } from "../components/AuthDiagnostics";
import { checkApiEndpointAuth } from "../lib/auth-check";
import { overrideUserExtension } from "../lib/extension-override";
import { applyScriptBlocker } from "../lib/script-blocker";

function GalleryGrid({ images }: { images: GalleryImage[] }) {
  console.log('Rendering GalleryGrid with images:', images);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {images.map((image) => (
        <div key={image.id} className="relative group aspect-square overflow-hidden rounded-lg shadow-lg bg-black/20">
          {image.url.endsWith('.mp4') ? (
            <video 
              src={image.url.startsWith('http') ? image.url : image.url.startsWith('/') ? `${API_BASE_URL}${image.url}` : `${API_BASE_URL}/${image.url}`}
              controls
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                console.error(`Failed to load video: ${image.url}`);
                // Add fallback for video if needed
              }}
            />
          ) : (
            <img 
              src={image.url.startsWith('http') ? image.url : image.url.startsWith('/') ? `${API_BASE_URL}${image.url}` : `${API_BASE_URL}/${image.url}`} 
              alt={image.title} 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Handle image loading errors
                console.error(`Gallery grid failed to load image: ${image.url}`);
                
                // Extract the filename from the URL
                const imagePath = image.url.split('/').pop();
                if (!imagePath) {
                  console.error('Could not extract image filename from URL:', image.url);
                  e.currentTarget.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                  return;
                }
                
                // Try direct path to uploads
                const fallbackSrc = `/uploads/${imagePath}`;
                console.log('Gallery grid trying fallback URL:', fallbackSrc);
                e.currentTarget.src = fallbackSrc;
              }}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            <p className="text-white text-sm font-medium mb-2">{image.title}</p>
            {image.description && (
              <p className="text-white/80 text-xs mb-2">{image.description}</p>
            )}
            {image.tags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {(() => {
                  try {
                    // Handle both string and array formats
                    const tagsArray = typeof image.tags === 'string' 
                      ? JSON.parse(image.tags) 
                      : image.tags;
                    
                    return Array.isArray(tagsArray) 
                      ? tagsArray.map((tag, index) => (
                        <span key={index} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))
                      : null;
                  } catch (e) {
                    console.error('Error parsing tags:', e, image.tags);
                    return null;
                  }
                })()}
              </div>
            )}
            <div className="flex gap-2">
              <TooltipProvider>
                {image.instagram && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 hover:bg-white/20"
                        onClick={() => window.open(`https://instagram.com/${image.instagram}`, '_blank')}
                      >
                        <InstagramLogoIcon className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow on Instagram</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {image.twitter && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 hover:bg-white/20"
                        onClick={() => window.open(`https://twitter.com/${image.twitter}`, '_blank')}
                      >
                        <TwitterLogoIcon className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow on Twitter</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {image.tiktok && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 hover:bg-white/20"
                        onClick={() => window.open(`https://tiktok.com/@${image.tiktok}`, '_blank')}
                      >
                        <VideoIcon className="h-4 w-4 text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow on TikTok</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {image.onlyfans && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/10 hover:bg-white/20"
                        onClick={() => window.open(image.onlyfans, '_blank')}
                      >
                        <span className="text-white text-xs font-bold">OF</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Subscribe on OnlyFans</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Apply the script blocker and extension override as early as possible
if (typeof window !== 'undefined') {
  try {
    console.log('Applying script blocker and extension override from gallery.tsx', { timestamp: new Date().toISOString() });
    // Apply script blocker first
    applyScriptBlocker();
    // Then apply extension override
    overrideUserExtension();
    
    // Force bypass mode if we've seen extension errors before or if URL has bypass parameter
    try {
      const extensionError = sessionStorage.getItem('user_extension_error');
      const urlHasBypass = window.location.search.includes('bypass=true');
      
      if (extensionError || urlHasBypass) {
        console.log('Enabling bypass mode due to previous error or URL parameter');
        localStorage.setItem('gallery_bypass_enabled', 'true');
      }
      
      // Check for the specific redacted error
      window.addEventListener('error', function(event) {
        if (event.error && event.error.message && event.error.message.includes('redacted')) {
          console.log('Caught redacted error in gallery.tsx error handler');
          localStorage.setItem('gallery_bypass_enabled', 'true');
          sessionStorage.setItem('user_extension_error', 'true');
          
          // Try to recover automatically
          setTimeout(() => {
            window.location.href = window.location.pathname + '?bypass=true&t=' + Date.now();
          }, 1000);
        }
      });
      
      // Also catch unhandled promise rejections
      window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && 
            (event.reason.message.includes('redacted') || 
             (event.reason.stack && event.reason.stack.includes('useUserExtension')))) {
          console.log('Caught redacted error in unhandledrejection handler');
          localStorage.setItem('gallery_bypass_enabled', 'true');
          sessionStorage.setItem('user_extension_error', 'true');
          
          // Try to recover automatically
          setTimeout(() => {
            window.location.href = window.location.pathname + '?bypass=true&t=' + Date.now();
          }, 1000);
        }
      });
    } catch (e) {
      console.error('Error handling bypass mode:', e);
    }
  } catch (e) {
    console.error('Failed to apply script blocker or extension override in gallery.tsx:', e);
  }
}

function GalleryPageWrapper() {
  console.log('Rendering GalleryPage', { timestamp: new Date().toISOString() });
  
  // Get query client for manual invalidation
  const queryClient = useQueryClient();
  
  // Simple state for UI
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [featuredImages, setFeaturedImages] = useState<GalleryImage[]>([]);
  
  // Log component mount and set up failsafe
  useEffect(() => {
    console.log('Gallery component mounted', { timestamp: new Date().toISOString() });
    setIsMounted(true);
    
    // Failsafe: If queries don't start within 5 seconds, fetch data directly
    const failsafeTimer = setTimeout(async () => {
      if (!failsafeAttemptedRef.current && (isLoading || !galleryImages.length)) {
        console.log('Gallery failsafe triggered - fetching data directly', { timestamp: new Date().toISOString() });
        failsafeAttemptedRef.current = true;
        
        try {
          // Direct fetch without React Query
          const response = await safeFetch(`${API_BASE_URL}/api/gallery`);
          if (response.ok) {
            const data = await response.json();
            console.log('Failsafe gallery data fetched:', data);
            if (Array.isArray(data)) {
              setFailsafeGalleryData(data);
            }
          }
        } catch (error) {
          console.error('Failsafe gallery fetch failed:', error);
        }
      }
    }, 5000);
    
    return () => clearTimeout(failsafeTimer);
  }, []);
  
  // Set a timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (galleryLoading) {
        console.log('Gallery loading timeout reached');
        setInitialLoadingTimeout(true);
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // Check for extension errors on mount
  useEffect(() => {
    try {
      const extensionError = sessionStorage.getItem('user_extension_error');
      if (extensionError) {
        console.log('Detected useUserExtension error, enabling diagnostics mode');
        setShowDiagnostics(true);
      }
    } catch (e) {
      // Ignore storage errors
    }
    
    // Run a quick check of the gallery endpoint to verify auth requirements
    const checkGalleryAuth = async () => {
      try {
        const result = await checkApiEndpointAuth('/api/gallery');
        console.log('Gallery auth check result:', result);
      } catch (error) {
        console.error('Failed to check gallery auth:', error);
      }
    };
    
    checkGalleryAuth();
  }, []);
  
  // Wrap the useQuery call in try-catch to prevent uncaught errors
  let galleryImages: GalleryImage[] = [];
  let galleryLoading = false;
  let galleryError: Error | null = null;
  
  // Log that we're about to try the useQuery call
  console.log('About to execute gallery useQuery', { timestamp: new Date().toISOString() });
  
  try {
    const galleryResult = useQuery<GalleryImage[]>({
    queryKey: ['gallery'],
    queryFn: async () => {
      console.log('Fetching gallery images...', { timestamp: new Date().toISOString(), apiUrl: API_BASE_URL });
      try {
        // Log the full URL we're trying to fetch from
        const fullUrl = `${API_BASE_URL}/api/gallery`;
        console.log('Full gallery API URL:', fullUrl);
        
        // Use our enhanced fetch utility with fallback ports and timeout
        const response = await fetchWithFallback('/api/gallery');
        console.log('Gallery API response status:', response.status, response.statusText);
        
        // Process the response with common error handling
        const data = await processApiResponse<GalleryImage[]>(response, 'gallery images');
        
        console.log('Gallery images fetched successfully:', { count: data.length, timestamp: new Date().toISOString() });
        return data;
      } catch (error) {
        console.error('Gallery fetch error:', error, { timestamp: new Date().toISOString() });
        // Force query to fail and not retry if it's an auth or extension error
        if (error instanceof Error && error.message && (error.message.includes('Authentication') || error.message.includes('extension'))) {
          queryClient.setQueryData(['gallery'], []);
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry for authentication or extension errors
      if (error instanceof Error && error.message && (error.message.includes('Authentication') || error.message.includes('extension'))) {
        console.log('Not retrying gallery fetch due to auth/extension error');
        return false;
      }
      return failureCount < 2;
    },
    // Set a stale time to prevent frequent refetching
    staleTime: 60000, // 1 minute
  });
    
    galleryImages = galleryResult.data || [];
    galleryLoading = galleryResult.isLoading;
    galleryError = galleryResult.error as Error | null;
  } catch (error) {
    console.error('Error in gallery query:', error);
    // Set error state but don't crash
    galleryError = error instanceof Error ? error : new Error(String(error));
  }

  // Wrap the featured images query in try-catch
  let featuredImages: GalleryImage[] = [];
  let featuredLoading = false;
  let featuredError: Error | null = null;
  
  try {
    const featuredResult = useQuery<GalleryImage[]>({
    queryKey: ['featured'],
    queryFn: async () => {
      console.log('Fetching featured images...', { timestamp: new Date().toISOString() });
      try {
        // Use our enhanced fetch utility with fallback ports and timeout
        const response = await fetchWithFallback('/api/gallery?type=featured');
        
        // Process the response with common error handling
        const data = await processApiResponse<GalleryImage[]>(response, 'featured images');
        
        console.log('Featured images fetched successfully:', { count: data.length, timestamp: new Date().toISOString() });
        return data;
      } catch (error) {
        console.error('Featured fetch error:', error, { timestamp: new Date().toISOString() });
        // Force query to fail and not retry if it's an auth or extension error
        if (error instanceof Error && error.message && (error.message.includes('Authentication') || error.message.includes('extension'))) {
          queryClient.setQueryData(['featured'], []);
        }
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry for authentication or extension errors
      if (error instanceof Error && error.message && (error.message.includes('Authentication') || error.message.includes('extension'))) {
        console.log('Not retrying featured fetch due to auth/extension error');
        return false;
      }
      return failureCount < 2;
    },
    // Set a stale time to prevent frequent refetching
    staleTime: 60000 // 1 minute
  });
    
    featuredImages = featuredResult.data || [];
    featuredLoading = featuredResult.isLoading;
    featuredError = featuredResult.error as Error | null;
  } catch (error) {
    console.error('Error in featured query:', error);
    // Set error state but don't crash
    featuredError = error instanceof Error ? error : new Error(String(error));
  }

  console.log('Current state:', {
    galleryImages,
    featuredImages,
    isLoading: galleryLoading || featuredLoading
  });

  // Add a timeout to prevent indefinite loading state
  const [finalLoadingTimeout, setFinalLoadingTimeout] = useState(false);
  
  // Determine if we're in a loading state, but respect the timeout
  const isLoading = (galleryLoading || featuredLoading) && !finalLoadingTimeout;
  
  useEffect(() => {
    // Set a timeout to force-exit loading state after 15 seconds
    const timeoutId = setTimeout(() => {
      if (galleryLoading || featuredLoading) {
        console.log('Loading timeout reached - forcing exit from loading state');
        setFinalLoadingTimeout(true);
      }
    }, 15000);
    
    return () => clearTimeout(timeoutId);
  }, [galleryLoading, featuredLoading]);
  
  // Format error messages for display
  const getErrorMessage = () => {
    const error = galleryError || featuredError;
    if (!error) return null;
    
    if (error.message?.includes('Authentication')) {
      return {
        message: 'Authentication failed. Please log in again to view content.',
        action: () => window.location.href = '/login'
      };
    }
    
    if (error.message?.includes('extension')) {
      return {
        message: 'Browser extension interference detected. Try disabling extensions or using incognito mode.',
        action: () => window.location.reload()
      };
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('Failed to fetch')) {
      return {
        message: 'Gallery server unavailable. Please check your connection or try again later.',
        action: () => window.location.reload()
      };
    }
    
    return {
      message: error.message || 'Failed to load gallery content',
      action: () => window.location.reload()
    };
  };
  
  const errorDetails = getErrorMessage();

  return (
    <Layout>
      <main className="container mx-auto px-4 pt-24">
        <h1 className="text-3xl font-bold text-white mb-8">Gallery</h1>

        <GalleryErrorBoundary>
          {/* Add diagnostics panel when needed */}
          {showDiagnostics && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Troubleshooting Tools</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDiagnostics(false)}
                >
                  Hide
                </Button>
              </div>
              <AuthDiagnostics />
            </div>
          )}
          
          {isLoading ? (
            <div className="flex flex-col justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-white/60 mb-2">Loading gallery content...</p>
              <p className="text-white/40 text-xs mb-4">Component mounted: {isMounted ? 'Yes' : 'No'}</p>
              
              {/* Add buttons for diagnostics and failsafe if loading takes too long */}
              {loadingTimeout && (
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="link" 
                    className="text-amber-400"
                    onClick={() => setShowDiagnostics(true)}
                  >
                    Show Troubleshooting Tools
                  </Button>
                  
                  {!failsafeAttemptedRef.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        failsafeAttemptedRef.current = true;
                        try {
                          const response = await safeFetch(`${API_BASE_URL}/api/gallery`);
                          if (response.ok) {
                            const data = await response.json();
                            if (Array.isArray(data)) {
                              setFailsafeGalleryData(data);
                            }
                          }
                        } catch (error) {
                          console.error('Manual failsafe fetch failed:', error);
                        }
                      }}
                    >
                      Try Direct Fetch
                    </Button>
                  )}
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      try {
                        localStorage.setItem('gallery_bypass_enabled', 'true');
                        window.location.reload();
                      } catch (e) {
                        console.error('Failed to enable bypass mode:', e);
                      }
                    }}
                  >
                    Enable Bypass Mode
                  </Button>
                </div>
              )}
            </div>
          ) : errorDetails ? (
            <div className="flex justify-center items-center min-h-[200px] text-center">
              <div>
                <p className="text-red-400 mb-2">{errorDetails.message}</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button variant="outline" onClick={errorDetails.action}>Try Again</Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                  >
                    {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="gallery" className="w-full">
              <TabsList className="mb-6 bg-white/10 border border-white/20">
                <TabsTrigger value="gallery" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  Gallery ({galleryImages.length})
                </TabsTrigger>
                <TabsTrigger value="featured" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  Featured ({featuredImages.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gallery">
                <GalleryGrid images={galleryImages} />
              </TabsContent>

              <TabsContent value="featured">
                <GalleryGrid images={featuredImages} />
              </TabsContent>
            </Tabs>
          )}
        </GalleryErrorBoundary>
      </main>
    </Layout>
  );
}

// Export the wrapper component
export default function GalleryPage() {
  // Catch any errors that might occur during rendering
  try {
    return <GalleryPageWrapper />;
  } catch (error) {
    console.error('Critical error in GalleryPage:', error);
    
    // Fallback UI for catastrophic errors
    return (
      <Layout>
        <main className="container mx-auto px-4 pt-24">
          <h1 className="text-3xl font-bold text-white mb-8">Gallery</h1>
          <div className="flex justify-center items-center min-h-[200px] text-center">
            <div>
              <p className="text-red-400 mb-4">Gallery Error</p>
              <p className="text-white/70 mb-6">
                There was a problem loading the gallery. Please try again later.
              </p>
              <Button 
                variant="default" 
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </main>
      </Layout>
    );
  }
}
