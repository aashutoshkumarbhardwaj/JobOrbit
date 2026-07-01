/**
 * Supabase Authentication Manager
 * Unified authentication for Job Orbit and Chrome Extension
 * Handles OAuth flows, session management, and token persistence
 */

import { supabase, Session, User } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
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

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(credentials: SignUpCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: credentials.fullName,
      },
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(credentials: SignInCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) throw error
  return data
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: false,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with GitHub OAuth
 */
export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: false,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with Microsoft OAuth (Azure AD)
 */
export async function signInWithMicrosoft() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: false,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign out from current session
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Sign out from all sessions (all devices)
 */
export async function signOutAllDevices() {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No active session')
  }

  // Sign out all sessions using scope
  const { error } = await supabase.auth.signOut({ scope: 'global' })
  if (error) throw error
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

/**
 * Refresh authentication token
 */
export async function refreshToken() {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return data.session
}

/**
 * Update user email
 */
export async function updateUserEmail(newEmail: string) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  })
  if (error) throw error
  return data.user
}

/**
 * Update user password
 */
export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
  return data.user
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  if (error) throw error
  return data
}

/**
 * Confirm password reset with token
 */
export async function confirmPasswordReset(token: string, newPassword: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'recovery',
  })
  if (error) throw error

  // Now update the password
  if (data.session) {
    return updateUserPassword(newPassword)
  }
}

/**
 * Confirm email change with token
 */
export async function confirmEmailChange(token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email_change',
  })
  if (error) throw error
  return data.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}

/**
 * Listen to auth state changes
 * Used for real-time session sync across tabs/devices
 */
export function onAuthStateChange(
  callback: (state: AuthState) => void
): () => void {
  // Supabase v2 returns a subscription object directly
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback({
      user: session?.user || null,
      session: session || null,
      isLoading: false,
      isAuthenticated: !!session,
    })
  })

  // Return unsubscribe function
  return () => {
    subscription?.unsubscribe()
  }
}

/**
 * Get access token for API calls
 * Used by APIClient to authenticate requests
 */
export async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Failed to get session:', error)
    return null
  }
  return data.session?.access_token || null
}

/**
 * Initialize API client with auth token refresh handler
 * This ensures automatic token refresh on expiration
 */
export function setupApiClientAuth(apiClient: any) {
  apiClient.setTokenRefreshHandler(async () => {
    try {
      const token = await getAccessToken()
      return token
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  })
}

/**
 * Share session with Chrome Extension
 * Called when user logs in or auth state changes
 */
export async function shareSessionWithExtension() {
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
 * Invalidate session in Chrome Extension
 * Called when user logs out
 */
export async function invalidateExtensionSession() {
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
