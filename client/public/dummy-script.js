/**
 * Dummy script that replaces problematic browser extension scripts
 * This script provides a mock implementation of useUserExtension
 * to prevent the 'redacted' error.
 */

console.log('[Dummy Script] Mock implementation loaded');

// Mock implementation of useUserExtension
export const useUserExtension = function() {
  console.log('[Dummy Script] Using mock useUserExtension implementation');
  return {
    user: { 
      isAuthenticated: true, 
      id: "dummy-user", 
      name: "Dummy User",
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
export default useUserExtension;

// Provide other common exports that might be expected
export const getUser = () => ({
  isAuthenticated: true, 
  id: "dummy-user", 
  name: "Dummy User",
  role: "user",
  email: "mock@example.com"
});

// No operation function for any other expected exports
const noop = () => Promise.resolve({ success: true });
export { noop as logout, noop as login, noop as register };

// Prevent the redacted error specifically by mocking all functions in the stack trace
export const xr = () => {};
export const jr = () => {};
export const pn = () => {};
export const ye = () => {};
export const Ia = () => {};
export const wl = () => {};
export const nn = () => {};
export const ns = () => {};
export const _t = () => {};
export const Md = () => {};
export const kt = () => {};
export const ic = () => {};
export const w = () => {};
export const mn = () => {};

// Notify that the dummy script was loaded successfully
console.log('[Dummy Script] Successfully loaded and initialized');
