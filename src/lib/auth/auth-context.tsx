/**
 * Auth Context
 * Provides authentication state and methods to React components
 * Syncs with Supabase real-time auth changes
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import * as supabaseAuth from './supabase-auth'
import { initializeExtensionBridge } from './extension-bridge'
import { apiClient } from '@/api/v1/client'

export interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signUpWithEmail: (credentials: supabaseAuth.SignUpCredentials) => Promise<void>
  signInWithEmail: (credentials: supabaseAuth.SignInCredentials) => Promise<void>
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
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Initialize auth state on mount (non-blocking)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get session with timeout to prevent hanging
        const sessionPromise = supabaseAuth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
        
        const currentSession = await Promise.race([sessionPromise, timeoutPromise])
        setSession(currentSession)
        setUser(currentSession?.user || null)

        // Setup API client with token refresh
        supabaseAuth.setupApiClientAuth(apiClient)

        // Setup API client session expired handler
        apiClient.setSessionExpiredHandler(() => {
          console.warn('⚠️  Session expired - redirecting to login')
          setSession(null)
          setUser(null)
          // Redirect handled by protected routes, but we can navigate here if needed
        })

        // Share session with extension non-blocking (don't await)
        if (currentSession) {
          supabaseAuth.shareSessionWithExtension().catch((err) => {
            console.debug('Extension sharing failed (non-blocking):', err)
          })
        }

        // Initialize extension bridge (non-blocking)
        initializeExtensionBridge()
      } catch (err) {
        console.error('Failed to initialize auth:', err)
        setError(err instanceof Error ? err : new Error('Auth initialization failed'))
        // Still mark as not loading even if init fails - let app render
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = supabaseAuth.onAuthStateChange((state) => {
      setUser(state.user)
      setSession(state.session)
      setIsLoading(state.isLoading)

      // Share session with Chrome Extension on auth changes
      if (state.session) {
        supabaseAuth.shareSessionWithExtension()
      } else {
        supabaseAuth.invalidateExtensionSession()
      }
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signUpWithEmail: async (credentials) => {
      try {
        setError(null)
        await supabaseAuth.signUpWithEmail(credentials)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Sign up failed')
        setError(error)
        throw error
      }
    },
    signInWithEmail: async (credentials) => {
      try {
        setError(null)
        const data = await supabaseAuth.signInWithEmail(credentials)
        setSession(data.session)
        setUser(data.user)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Sign in failed')
        setError(error)
        throw error
      }
    },
    signInWithGoogle: async () => {
      try {
        setError(null)
        await supabaseAuth.signInWithGoogle()
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Google sign in failed')
        setError(error)
        throw error
      }
    },
    signInWithGitHub: async () => {
      try {
        setError(null)
        await supabaseAuth.signInWithGitHub()
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GitHub sign in failed')
        setError(error)
        throw error
      }
    },
    signInWithMicrosoft: async () => {
      try {
        setError(null)
        await supabaseAuth.signInWithMicrosoft()
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Microsoft sign in failed')
        setError(error)
        throw error
      }
    },
    signOut: async () => {
      try {
        setError(null)
        await supabaseAuth.signOut()
        setSession(null)
        setUser(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Sign out failed')
        setError(error)
        throw error
      }
    },
    signOutAllDevices: async () => {
      try {
        setError(null)
        await supabaseAuth.signOutAllDevices()
        setSession(null)
        setUser(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Sign out failed')
        setError(error)
        throw error
      }
    },
    updateEmail: async (email) => {
      try {
        setError(null)
        const updatedUser = await supabaseAuth.updateUserEmail(email)
        setUser(updatedUser)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Email update failed')
        setError(error)
        throw error
      }
    },
    updatePassword: async (password) => {
      try {
        setError(null)
        const updatedUser = await supabaseAuth.updateUserPassword(password)
        setUser(updatedUser)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Password update failed')
        setError(error)
        throw error
      }
    },
    requestPasswordReset: async (email) => {
      try {
        setError(null)
        await supabaseAuth.requestPasswordReset(email)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Password reset request failed')
        setError(error)
        throw error
      }
    },
    error,
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
