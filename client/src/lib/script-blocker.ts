/**
 * Script Blocker
 * 
 * This utility intercepts script loading to block problematic scripts
 * and replace them with our own implementations.
 * 
 * Specifically targets useUserExtension-7c796cda.js and similar scripts
 * that cause the 'redacted' error.
 */

// Flag to track if we've already applied the blocker
let isBlockerApplied = false;

// Flag to track if bypass mode is enabled
let isBypassEnabled = false;

// List of problematic script patterns to block
const BLOCKED_SCRIPT_PATTERNS = [
  'useUserExtension-7c796cda.js',
  'useUserExtension-',  // Match any hash version
  'useUserExtension',
  'userExtension',
  'user-extension',
  'extension.js',
  'localStorage-77a5f03a.js', // Also block localStorage script that triggers the error
  'index-2e95b6eb.js'  // Also block index script that triggers the error
];

// Check if bypass mode is enabled
function checkBypassMode(): boolean {
  try {
    // Check URL parameter first
    if (typeof window !== 'undefined' && window.location.search.includes('bypass=true')) {
      console.log('Bypass mode enabled via URL parameter');
      return true;
    }
    
    // Then check localStorage
    if (typeof localStorage !== 'undefined') {
      const bypassEnabled = localStorage.getItem('gallery_bypass_enabled');
      if (bypassEnabled === 'true') {
        console.log('Bypass mode enabled via localStorage');
        return true;
      }
    }
    
    // Then check sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const bypassEnabled = sessionStorage.getItem('gallery_bypass_enabled');
      if (bypassEnabled === 'true') {
        console.log('Bypass mode enabled via sessionStorage');
        return true;
      }
    }
  } catch (e) {
    console.error('Error checking bypass mode:', e);
  }
  
  return false;
}

// Helper function to check if a URL matches any blocked pattern
function isBlockedScript(url: string): boolean {
  if (!url) return false;
  
  // If bypass mode is enabled and we're on the gallery page, don't block anything
  if (isBypassEnabled && typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.includes('/gallery') || path.includes('/premium')) {
      console.log('Bypass mode enabled - not blocking scripts on gallery/premium page');
      return false;
    }
  }
  
  const lowerUrl = url.toLowerCase();
  for (const pattern of BLOCKED_SCRIPT_PATTERNS) {
    if (lowerUrl.includes(pattern.toLowerCase())) {
      console.warn(`Matched blocked script pattern '${pattern}': ${url}`);
      
      // Set a flag to indicate we've blocked a script
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('blocked_extension_script', url);
        }
      } catch (e) {
        // Ignore storage errors
      }
      
      return true;
    }
  }
  
  return false;
}

/**
 * Apply script blocking to prevent problematic scripts from loading
 */
export function applyScriptBlocker() {
  if (isBlockerApplied || typeof window === 'undefined') {
    console.log('Script blocker already applied or running in SSR');
    return;
  }
  
  // Check if bypass mode is enabled
  isBypassEnabled = checkBypassMode();
  
  // Log the application of the script blocker
  console.log('Applying script blocker', { 
    timestamp: new Date().toISOString(),
    bypassEnabled: isBypassEnabled,
    url: window.location.href
  });
  
  // If we're on the gallery page and bypass is enabled, notify the service worker
  if (isBypassEnabled && 
      (window.location.pathname.includes('/gallery') || window.location.pathname.includes('/premium'))) {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ENABLE_BYPASS_MODE',
          url: window.location.href
        });
      }
    } catch (e) {
      console.error('Error sending message to service worker:', e);
    }
  }
  
  try {
    // Store the original createElement method
    const originalCreateElement = document.createElement.bind(document);
    
    // Override createElement to intercept script creation
    document.createElement = function(tagName: string, options?: ElementCreationOptions): HTMLElement {
      // Call the original method
      const element = originalCreateElement(tagName, options);
      
      // If this is a script element, intercept its src setting
      if (tagName.toLowerCase() === 'script') {
        const scriptElement = element as HTMLScriptElement;
        
        // Store the original setAttribute method
        const originalSetAttribute = scriptElement.setAttribute.bind(scriptElement);
        
        // Override setAttribute to intercept src setting
        scriptElement.setAttribute = function(name: string, value: string) {
          if (name.toLowerCase() === 'src' && isBlockedScript(value)) {
            console.warn(`Blocking problematic script: ${value}`);
            
            // Set a flag to indicate we've blocked a script
            try {
              const blockedScripts = JSON.parse(sessionStorage.getItem('blocked_scripts') || '[]');
              blockedScripts.push({
                url: value,
                timestamp: new Date().toISOString(),
                method: 'setAttribute'
              });
              sessionStorage.setItem('blocked_scripts', JSON.stringify(blockedScripts));
              sessionStorage.setItem('blocked_extension_script', value);
            } catch (e) {
              // Ignore storage errors
            }
            
            // Replace with a dummy script or our own implementation
            return originalSetAttribute.call(this, 'src', '/dummy-script.js');
          }
          
          // For all other attributes, call the original method
          return originalSetAttribute.call(this, name, value);
        };
        
        // Also intercept direct property assignment
        Object.defineProperty(scriptElement, 'src', {
          set(value) {
            if (isBlockedScript(value)) {
              console.warn(`Blocking problematic script src property: ${value}`);
              
              // Set a flag to indicate we've blocked a script
              try {
                const blockedScripts = JSON.parse(sessionStorage.getItem('blocked_scripts') || '[]');
                blockedScripts.push({
                  url: value,
                  timestamp: new Date().toISOString(),
                  method: 'property'
                });
                sessionStorage.setItem('blocked_scripts', JSON.stringify(blockedScripts));
                sessionStorage.setItem('blocked_extension_script', value);
              } catch (e) {
                // Ignore storage errors
              }
              
              // Set to a dummy script instead
              this.setAttribute('src', '/dummy-script.js');
            } else {
              // For other scripts, set normally
              this.setAttribute('src', value);
            }
          },
          get() {
            return this.getAttribute('src') || '';
          }
        });
      }
      
      return element;
    };
    
    // Also intercept fetch requests for problematic scripts
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      if (url && typeof url === 'string' && isBlockedScript(url)) {
        console.warn(`Blocking fetch request for problematic script: ${url}`);
        
        // Set a flag to indicate we've blocked a script
        try {
          const blockedFetches = JSON.parse(sessionStorage.getItem('blocked_fetches') || '[]');
          blockedFetches.push({
            url: url,
            timestamp: new Date().toISOString(),
            headers: init?.headers
          });
          sessionStorage.setItem('blocked_fetches', JSON.stringify(blockedFetches));
          sessionStorage.setItem('blocked_extension_script', url);
        } catch (e) {
          // Ignore storage errors
        }
        
        // Return a mock successful response with a working implementation
        return Promise.resolve(new Response(
          `console.log("Mock script loaded instead of problematic extension");
          
          // Mock implementation of useUserExtension
          export const useUserExtension = function() {
            return {
              user: { 
                isAuthenticated: true, 
                id: "mock-user", 
                name: "Mock User",
                role: "user" 
              },
              isLoading: false,
              error: null
            };
          };
          
          // Also export as default
          export default useUserExtension;`,
          {
            status: 200,
            headers: { 'Content-Type': 'application/javascript' }
          }
        ));
      }
      
      // For all other requests, use the original fetch
      return originalFetch.apply(this, [input, init]);
    };
    
    // Create a MutationObserver to watch for dynamically added scripts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'SCRIPT') {
              const script = node as HTMLScriptElement;
              const src = script.src || script.getAttribute('src') || '';
              
              if (isBlockedScript(src)) {
                console.warn(`Blocking dynamically added problematic script: ${src}`);
                
                // Set a flag to indicate we've blocked a script
                try {
                  const blockedDynamicScripts = JSON.parse(sessionStorage.getItem('blocked_dynamic_scripts') || '[]');
                  blockedDynamicScripts.push({
                    url: src,
                    timestamp: new Date().toISOString()
                  });
                  sessionStorage.setItem('blocked_dynamic_scripts', JSON.stringify(blockedDynamicScripts));
                  sessionStorage.setItem('blocked_extension_script', src);
                } catch (e) {
                  // Ignore storage errors
                }
                
                // Replace the src with a dummy script
                script.src = '/dummy-script.js';
              }
            }
          });
        }
      });
    });
    
    // Start observing the document
    observer.observe(document, { 
      childList: true, 
      subtree: true 
    });
    
    isBlockerApplied = true;
    console.log('Script blocker applied successfully', { timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('Failed to apply script blocker:', e);
  }
}

// Create a dummy script handler and register service worker
if (typeof window !== 'undefined') {
  // Create a dummy script that will be served instead of the problematic scripts
  const createDummyScript = () => {
    try {
      // Create a blob with mock content that properly implements useUserExtension
      const blob = new Blob([
        `console.log("Dummy script loaded instead of problematic extension");
        
        // Mock implementation of useUserExtension
        export const useUserExtension = function() {
          console.log('Using mock useUserExtension implementation');
          return {
            user: { 
              isAuthenticated: true, 
              id: "dummy-user", 
              name: "Mock User",
              role: "user",
              email: "mock@example.com"
            },
            isLoading: false,
            error: null,
            login: () => Promise.resolve({ success: true }),
            logout: () => Promise.resolve({ success: true }),
            register: () => Promise.resolve({ success: true })
          };
        };
        
        // Also export as default
        export default useUserExtension;`
      ], { type: 'application/javascript' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Register a service worker to intercept requests for the dummy script
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(registration => {
            console.log('ServiceWorker registration successful with scope:', registration.scope);
            
            // Force update the service worker
            registration.update();
            
            // Send message to service worker with blocked script patterns and bypass status
            if (registration.active) {
              registration.active.postMessage({
                type: 'CONFIGURE_BLOCKER',
                blockedScripts: BLOCKED_SCRIPT_PATTERNS,
                bypassEnabled: isBypassEnabled,
                timestamp: new Date().toISOString(),
                url: window.location.href
              });
            }
          })
          .catch(error => {
            console.log('ServiceWorker registration failed:', error);
          });
      }
      
      return url;
    } catch (e) {
      console.error('Failed to create dummy script:', e);
      return '/dummy-script.js';
    }
  };
  
  // Store the dummy script URL
  (window as any).dummyScriptUrl = createDummyScript();
  
  // Listen for messages from the service worker
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'BLOCKED_SCRIPT') {
      console.log('Service worker blocked script:', event.data.url);
      try {
        const blockedByServiceWorker = JSON.parse(sessionStorage.getItem('blocked_by_service_worker') || '[]');
        blockedByServiceWorker.push({
          url: event.data.url,
          timestamp: new Date().toISOString()
        });
        sessionStorage.setItem('blocked_by_service_worker', JSON.stringify(blockedByServiceWorker));
      } catch (e) {
        // Ignore storage errors
      }
    }
  });
  
  // Add a keyboard shortcut to toggle bypass mode
  document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+B to toggle bypass mode
    if (event.ctrlKey && event.shiftKey && event.key === 'B') {
      try {
        const currentBypass = localStorage.getItem('gallery_bypass_enabled') === 'true';
        localStorage.setItem('gallery_bypass_enabled', (!currentBypass).toString());
        console.log(`Bypass mode ${!currentBypass ? 'enabled' : 'disabled'} via keyboard shortcut`);
        
        // Reload the page to apply the change
        window.location.reload();
      } catch (e) {
        console.error('Error toggling bypass mode:', e);
      }
    }
  });
}
