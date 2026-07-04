/**
 * Auth Hook - Simplified
 * Uses AuthManager singleton instead of multiple auth implementations
 */

import { useEffect, useState } from 'react'
import { authManager, AuthState } from '@/lib/auth/AuthManager'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authManager.getAuthState())

  useEffect(() => {
    // Subscribe to auth state changes from AuthManager
    const unsubscribe = authManager.subscribe((state) => {
      setAuthState(state)
    })

    return unsubscribe
  }, [])

  return {
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error,
    signUpWithEmail: authManager.signUpWithEmail.bind(authManager),
    signInWithEmail: authManager.signInWithEmail.bind(authManager),
    signInWithGoogle: authManager.signInWithGoogle.bind(authManager),
    signInWithGitHub: authManager.signInWithGitHub.bind(authManager),
    signInWithMicrosoft: authManager.signInWithMicrosoft.bind(authManager),
    signOut: authManager.signOut.bind(authManager),
    signOutAllDevices: authManager.signOutAllDevices.bind(authManager),
    updateEmail: authManager.updateUserEmail.bind(authManager),
    updatePassword: authManager.updateUserPassword.bind(authManager),
    requestPasswordReset: authManager.requestPasswordReset.bind(authManager),
    refreshSession: authManager.refreshSession.bind(authManager),
    validateSession: authManager.validateSession.bind(authManager),
  }
}
