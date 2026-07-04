/**
 * Auth Context - Simplified
 * Uses AuthManager singleton instead of duplicate auth logic
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authManager, AuthState, SignUpCredentials, SignInCredentials } from './AuthManager'
import { initializeExtensionBridge } from './extension-bridge'
import { apiClient } from '@/api/v1/client'

export interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signUpWithEmail: (credentials: SignUpCredentials) => Promise<void>
  signInWithEmail: (credentials: SignInCredentials) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  signOut: () => Promise<void>
  signOutAllDevices: () => Promise<void>
  updateEmail: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  error: Error | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(authManager.getAuthState())

  // Subscribe to AuthManager state changes
  useEffect(() => {
    const unsubscribe = authManager.subscribe((state) => {
      setAuthState(state)
    })

    // Setup API client token refresh
    apiClient.setTokenRefreshHandler(async () => {
      try {
        return await authManager.getAccessToken()
      } catch (error) {
        console.error('Token refresh failed:', error)
        return null
      }
    })

    // Setup API client session expired handler
    apiClient.setSessionExpiredHandler(() => {
      console.warn('⚠️  Session expired - redirecting to login')
      authManager.signOut().catch(console.error)
    })

    // Initialize extension bridge (non-blocking)
    initializeExtensionBridge()

    return unsubscribe
  }, [])

  const value: AuthContextType = {
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook to get current user
 */
export function useUser() {
  const { user } = useAuth()
  return user
}

/**
 * Hook to get current session
 */
export function useSession() {
  const { session } = useAuth()
  return session
}
