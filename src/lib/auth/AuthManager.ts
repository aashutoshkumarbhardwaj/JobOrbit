/**
 * AuthManager - Single Authentication Provider
 * Consolidates all authentication logic into one place
 * Replaces multiple auth contexts, hooks, and listeners
 */

import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  fullName?: string
}

type AuthStateChangeCallback = (state: AuthState) => void

class AuthManager {
  private static instance: AuthManager
  private authState: AuthState = {
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  }
  private listeners: Set<AuthStateChangeCallback> = new Set()
  private authSubscription: any = null
  private initialized = false

  private constructor() {
    this.initializeAuth()
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * Initialize authentication - sets up the single auth listener
   */
  private async initializeAuth() {
    if (this.initialized) return

    try {
      // Set up the SINGLE auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id })
        
        this.authState = {
          user: session?.user || null,
          session: session || null,
          isLoading: false,
          isAuthenticated: !!session,
          error: null,
        }

        this.notifyListeners()

        // Handle extension session sharing
        if (session) {
          this.shareSessionWithExtension()
        } else {
          this.invalidateExtensionSession()
        }
      })

      this.authSubscription = subscription

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        this.authState = {
          ...this.authState,
          isLoading: false,
          error: error as Error,
        }
      } else {
        this.authState = {
          user: session?.user || null,
          session: session || null,
          isLoading: false,
          isAuthenticated: !!session,
          error: null,
        }
      }

      this.initialized = true
      this.notifyListeners()
      
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      this.authState = {
        ...this.authState,
        isLoading: false,
        error: error as Error,
      }
      this.notifyListeners()
    }
  }

  /**
   * Subscribe to auth state changes
   */
  public subscribe(callback: AuthStateChangeCallback): () => void {
    this.listeners.add(callback)
    
    // Immediately notify new listener of current state
    callback(this.authState)
    
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState)
      } catch (error) {
        console.error('Error in auth state listener:', error)
      }
    })
  }

  /**
   * Get current auth state
   */
  public getAuthState(): AuthState {
    return { ...this.authState }
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.authState.user
  }

  /**
   * Get current session
   */
  public getCurrentSession(): Session | null {
    return this.authState.session
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  /**
   * Sign up with email and password
   */
  public async signUpWithEmail(credentials: SignUpCredentials): Promise<void> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
        },
      },
    })

    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Sign in with email and password
   */
  public async signInWithEmail(credentials: SignInCredentials): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Sign in with Google OAuth
   */
  public async signInWithGoogle(): Promise<void> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    })

    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Sign in with GitHub OAuth
   */
  public async signInWithGitHub(): Promise<void> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    })

    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Sign in with Microsoft OAuth (Azure AD)
   */
  public async signInWithMicrosoft(): Promise<void> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    })

    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Sign out from current session
   */
  public async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Sign out from all sessions (all devices)
   */
  public async signOutAllDevices(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    
    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Refresh authentication session
   */
  public async refreshSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
    
    return data.session
  }

  /**
   * Validate current session
   */
  public async validateSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getSession()
      return !error && !!data.session
    } catch {
      return false
    }
  }

  /**
   * Update user email
   */
  public async updateUserEmail(newEmail: string): Promise<User | null> {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail,
    })
    
    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
    
    return data.user
  }

  /**
   * Update user password
   */
  public async updateUserPassword(newPassword: string): Promise<User | null> {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
    
    return data.user
  }

  /**
   * Request password reset email
   */
  public async requestPasswordReset(email: string): Promise<void> {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Confirm password reset with token
   */
  public async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    })
    if (error) {
      this.authState = { ...this.authState, error: error as Error }
      this.notifyListeners()
      throw error
    }

    // Now update the password if session exists
    if (data.session) {
      await this.updateUserPassword(newPassword)
    }
  }

  /**
   * Get access token for API calls
   */
  public async getAccessToken(): Promise<string | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Failed to get session:', error)
      return null
    }
    return data.session?.access_token || null
  }

  /**
   * Share session with Chrome Extension (non-blocking)
   */
  private async shareSessionWithExtension(): Promise<void> {
    try {
      const { data } = await supabase.auth.getSession()

      if (!data.session || !window.chrome?.runtime?.id) {
        return
      }

      // Use promise with timeout to prevent hanging
      return new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.debug('Extension session sharing timed out')
          resolve() // Don't throw - this is non-critical
        }, 1000) // 1 second timeout

        try {
          window.chrome.runtime.sendMessage(
            {
              type: 'SESSION_UPDATE',
              payload: {
                session: {
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                  expires_at: data.session.expires_at,
                },
                user: {
                  id: data.session.user.id,
                  email: data.session.user.email,
                },
              },
            },
            (response) => {
              clearTimeout(timeoutId)
              if (chrome.runtime.lastError) {
                console.debug('Extension not available:', chrome.runtime.lastError)
              } else if (response?.success) {
                console.log('Session shared with extension')
              }
              resolve()
            }
          )
        } catch (error) {
          clearTimeout(timeoutId)
          console.debug('Could not send message to extension:', error)
          resolve()
        }
      })
    } catch (error) {
      console.debug('Could not share session with extension:', error)
    }
  }

  /**
   * Invalidate session in Chrome Extension (non-blocking)
   */
  private async invalidateExtensionSession(): Promise<void> {
    try {
      if (window.chrome?.runtime?.id) {
        // Use promise with timeout to prevent hanging
        return new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => {
            console.debug('Extension invalidation timed out')
            resolve() // Don't throw - this is non-critical
          }, 1000) // 1 second timeout

          try {
            window.chrome.runtime.sendMessage(
              {
                type: 'SESSION_INVALIDATED',
                payload: {},
              },
              (response) => {
                clearTimeout(timeoutId)
                if (chrome.runtime.lastError) {
                  console.debug('Extension not available:', chrome.runtime.lastError)
                } else if (response?.success) {
                  console.log('Extension session invalidated')
                }
                resolve()
              }
            )
          } catch (error) {
            clearTimeout(timeoutId)
            console.debug('Could not send invalidation to extension:', error)
            resolve()
          }
        })
      }
    } catch (error) {
      console.debug('Could not invalidate extension session:', error)
    }
  }

  /**
   * Cleanup - unsubscribe from auth changes
   */
  public cleanup(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe()
      this.authSubscription = null
    }
    this.listeners.clear()
  }
}

export const authManager = AuthManager.getInstance()
export default authManager