/**
 * DEPRECATED - Use useAuth from '@/lib/auth/auth-context' instead
 * 
 * This file is deprecated. All components should use the new auth system.
 * Import from: @/lib/auth/auth-context
 */

// Re-export from the new location for backward compatibility
export { useAuth, useIsAuthenticated, useUser, useSession } from '@/lib/auth/auth-context'

// Legacy exports that are not available in new system - provide stubs
export function useAuthLegacy() {
  throw new Error('useAuth legacy methods are deprecated. Use AuthManager or auth-context instead.')
}
