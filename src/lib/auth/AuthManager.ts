/**
 * AuthManager - Centralized Authentication Manager
 * 
 * Singleton that manages all authentication operations:
 * - Sign up / Sign in / Sign out
 * - OAuth providers (Google, GitHub, Microsoft)
 * - Session management
 * - Password reset
 * - Single auth state listener
 * 
 * Benefits:
 * - Single source of truth for auth state
 * - No duplicate auth listeners
 * - Consistent auth operations across the app
 * - Type-safe auth state
 */

import { supabase } from '../supabase'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string
  password: string
}

/**
 * Auth state structure
 */
export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
}

/**
 * Auth state subscriber callback
 */
type AuthStateSubscriber = (state: AuthState) => void

/**
 * AuthManager class - Singleton
 */
class AuthManager {
  private static instance: AuthManager
  private authState: AuthState
  private subscribers: Set<AuthStateSubscriber>
  private authListenerUnsubscribe: (() => void) | null = null

  private constructor() {
    this.authState = {
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
    }
    this.subscribers = new Set()
    this.initialize()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * Initialize auth manager
   * Sets up auth state listener and loads initial session
   */
  private async initialize() {
    console.log('🔐 AuthManager initializing...')

    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Failed to get initial session:', error)
        this.updateAuthState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          error: error,
        })
      } else {
        this.updateAuthState({
          user: session?.user ?? null,
          session: session,
          isLoading: false,
          isAuthenticated: !!session,
          error: null,
        })
      }

      // Set up single auth state listener
      this.setupAuthListener()

      console.log('✅ AuthManager initialized')
    } catch (error) {
      console.error('❌ AuthManager initialization failed:', error)
      this.updateAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: error as Error,
      })
    }
  }

  /**
   * Set up auth state change listener
   * Only ONE listener for the entire app
   */
  private setupAuthListener() {
    // Clean up existing listener if any
    if (this.authListenerUnsubscribe) {
      this.authListenerUnsubscribe()
    }

    // Set up new listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔄 Auth state changed:', event)

        this.updateAuthState({
          user: session?.user ?? null,
          session: session,
          isLoading: false,
          isAuthenticated: !!session,
          error: null,
        })
      }
    )

    this.authListenerUnsubscribe = () => subscription.unsubscribe()
  }

  /**
   * Update auth state and notify subscribers
   */
  private updateAuthState(newState: Partial<AuthState>) {
    this.authState = {
      ...this.authState,
      ...newState,
    }

    // Notify all subscribers
    this.subscribers.forEach(subscriber => {
      subscriber(this.authState)
    })
  }

  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  public subscribe(callback: AuthStateSubscriber): () => void {
    this.subscribers.add(callback)
    
    // Immediately call with current state
    callback(this.authState)

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
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
   * Get access token
   */
  public async getAccessToken(): Promise<string | null> {
    if (this.authState.session) {
      return this.authState.session.access_token
    }

    // Try to get fresh session
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  /**
   * Sign up with email and password
   */
  public async signUpWithEmail(credentials: SignUpCredentials): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true, error: null })

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            first_name: credentials.firstName,
            last_name: credentials.lastName,
          },
        },
      })

      if (error) throw error

      console.log('✅ Sign up successful:', data.user?.email)
    } catch (error) {
      console.error('❌ Sign up failed:', error)
      this.updateAuthState({ error: error as Error, isLoading: false })
      throw error
    }
  }

  /**
   * Sign in with email and password
   */
  public async signInWithEmail(credentials: SignInCredentials): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true, error: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) throw error

      console.log('✅ Sign in successful:', data.user?.email)
    } catch (error) {
      console.error('❌ Sign in failed:', error)
      this.updateAuthState({ error: error as Error, isLoading: false })
      throw error
    }
  }

  /**
   * Sign in with Google OAuth
   */
  public async signInWithGoogle(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true, error: null })

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      console.log('✅ Google OAuth initiated')
    } catch (error) {
      console.error('❌ Google OAuth failed:', error)
      this.updateAuthState({ error: error as Error, isLoading: false })
      throw error
    }
  }

  /**
   * Sign in with GitHub OAuth
   */
  public async signInWithGitHub(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true, error: null })

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      console.log('✅ GitHub OAuth initiated')
    } catch (error) {
      console.error('❌ GitHub OAuth failed:', error)
      this.updateAuthState({ error: error as Error, isLoading: false })
      throw error
    }
  }

  /**
   * Sign in with Microsoft OAuth
   */
  public async signInWithMicrosoft(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true, error: null })

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email openid profile',
        },
      })

      if (error) throw error

      console.log('✅ Microsoft OAuth initiated')
    } catch (error) {
      console.error('❌ Microsoft OAuth failed:', error)
      this.updateAuthState({ error: error as Error, isLoading: false })
      throw error
    }
  }

  /**
   * Sign out current session
   */
  public async signOut(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true, error: null })

      const { error } = await supabase.auth.signOut()

      if (error) throw error

      console.log('✅ Sign out successful')

      this.updateAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      })
    } catch (error) {
      console.error('❌ Sign out failed:', error)
      this.updateAuthState({ error: error as Error, isLoading: false })
      throw error
    }
  }

  /**
   * Sign out from all devices
   */
  public async signOutAllDevices(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true, error: null })

      // Sign out globally (all sessions)
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) throw error

      console.log('✅ Signed out from all devices')

      this.updateAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      })
    } catch (error) {
      console.error('❌ Sign out all devices failed:', error)
      this.updateAuthState({ error: error as Error, isLoading: false })
      throw error
    }
  }

  /**
   * Request password reset email
   */
  public async requestPasswordReset(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      console.log('✅ Password reset email sent to:', email)
    } catch (error) {
      console.error('❌ Password reset request failed:', error)
      throw error
    }
  }

  /**
   * Confirm password reset with new password
   */
  public async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      // Exchange token for session
      const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      })

      if (sessionError) throw sessionError

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      console.log('✅ Password reset successful')
    } catch (error) {
      console.error('❌ Password reset confirmation failed:', error)
      throw error
    }
  }

  /**
   * Update user email
   */
  public async updateUserEmail(newEmail: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (error) throw error

      console.log('✅ Email update initiated. Check new email for confirmation.')
    } catch (error) {
      console.error('❌ Email update failed:', error)
      throw error
    }
  }

  /**
   * Update user password
   */
  public async updateUserPassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      console.log('✅ Password updated successfully')
    } catch (error) {
      console.error('❌ Password update failed:', error)
      throw error
    }
  }

  /**
   * Cleanup - remove all listeners
   */
  public cleanup() {
    if (this.authListenerUnsubscribe) {
      this.authListenerUnsubscribe()
      this.authListenerUnsubscribe = null
    }
    this.subscribers.clear()
    console.log('🧹 AuthManager cleaned up')
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance()

// Export class for testing
export { AuthManager }
