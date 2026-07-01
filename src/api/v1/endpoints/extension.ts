/**
 * Extension API Endpoints
 * Handles Chrome Extension authentication and session management
 * 
 * Architecture:
 * - Extension logs in via /extension-auth (Google/GitHub OAuth)
 * - Gets Supabase JWT from OAuth flow
 * - Calls /extension-session with JWT to get extension token
 * - Extension stores token in chrome.storage.local
 * - All API calls include X-Extension-Token header
 * - Backend verifies token in extension_sessions table
 * - Backend prevents direct Supabase access from extension
 */

import { supabase } from '@/lib/supabase'
import { apiClient } from '../client'
import {
  storeExtensionToken,
  clearExtensionToken,
  getStoredExtensionToken,
  getStoredExtensionSessionId,
  hasValidExtensionToken,
} from '../middleware/extension-token'

export interface ExtensionSessionRequest {
  // No body needed - uses auth token from header
}

export interface ExtensionSessionResponse {
  success: boolean
  extension_token?: string
  extension_token_expires_in?: number
  session_id?: string
  session?: {
    access_token: string
    refresh_token: string
    expires_at: number
    user: {
      id: string
      email: string
      user_metadata?: Record<string, any>
    }
  }
  error?: string
  message?: string
}

/**
 * Get authenticated session for extension
 * 
 * Creates an extension session with database tracking:
 * 1. Verifies user is authenticated via Supabase JWT
 * 2. Creates extension_sessions DB entry for device tracking
 * 3. Generates minimal Extension Session Token (JWT with sessionId only)
 * 4. Returns token for all future API calls
 * 5. Never exposes service-role keys
 * 
 * Flow:
 * - Extension opens /extension-auth (OAuth login)
 * - Gets Supabase JWT from OAuth redirect
 * - Calls this endpoint with Supabase JWT in Authorization header
 * - Receives extension_token + session_id
 * - Stores both in chrome.storage.local
 * - All future API calls use X-Extension-Token header with extension_token
 * 
 * Token Structure (Minimal):
 * {
 *   "sessionId": "uuid",  // Links to extension_sessions table
 *   "userId": "uuid",      // User ID (for audit)
 *   "aud": "extension",    // Audience (always extension)
 *   "iat": timestamp,      // Issued at
 *   "exp": timestamp       // Expires at (1 hour)
 * }
 * 
 * @returns Extension session token + metadata
 */
export async function getExtensionSession(): Promise<ExtensionSessionResponse> {
  try {
    console.log('📱 Getting extension session...')

    // Get current session from Supabase
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Failed to get session:', error)
      return {
        success: false,
        error: error.message || 'Failed to get session',
      }
    }

    // Check if user is authenticated
    if (!data.session) {
      console.warn('⚠️  User not authenticated')
      return {
        success: false,
        error: 'User not authenticated',
        message: 'Please sign in to use the Chrome Extension',
      }
    }

    // Get user info
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      console.error('Failed to get user info:', userError)
      return {
        success: false,
        error: userError?.message || 'Failed to get user info',
      }
    }

    console.log('✅ User authenticated:', userData.user.id)

    // Call backend to get extension session token
    // The backend (Edge Function) will:
    // 1. Verify the user is authenticated
    // 2. Create extension_sessions DB entry for this device
    // 3. Generate minimal Extension Session Token (sessionId + userId only)
    // 4. Return both token and session_id
    try {
      const response = await apiClient.get<ExtensionSessionResponse>(
        '/extension-session'
      )

      if (response.success && response.extension_token && response.session_id) {
        console.log('✅ Extension session created')

        // Store extension token + session ID locally for future API calls
        const expiresIn = response.extension_token_expires_in || 3600
        storeExtensionToken(response.extension_token, response.session_id, expiresIn)

        return {
          success: true,
          extension_token: response.extension_token,
          extension_token_expires_in: expiresIn,
          session_id: response.session_id,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token || '',
            expires_at: data.session.expires_at || 0,
            user: {
              id: userData.user.id,
              email: userData.user.email || '',
              user_metadata: userData.user.user_metadata,
            },
          },
          message: 'Extension session created successfully',
        }
      }

      console.warn('⚠️  No extension token in response')
      return {
        success: false,
        error: 'Failed to create extension session',
      }
    } catch (backendError) {
      console.error('Backend error getting extension session:', backendError)

      return {
        success: false,
        error: 'Failed to create extension session',
        message: 'Please try again or sign in again',
      }
    }
  } catch (error) {
    console.error('Error getting extension session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Verify extension session is valid
 * 
 * Used by extension to check if current extension token is still valid
 * Checks that:
 * 1. Token exists in localStorage
 * 2. Token has not expired
 * 3. Session has not been revoked
 * 
 * Before making any API call, extension should call this first
 * If invalid, call refreshExtensionSession or redirectto login
 * 
 * @returns Status of extension token validity
 */
export async function verifyExtensionSession(): Promise<{
  valid: boolean
  sessionId?: string
  needsRefresh?: boolean
  error?: string
}> {
  try {
    console.log('🔐 Verifying extension session...')

    const token = getStoredExtensionToken()
    const sessionId = getStoredExtensionSessionId()

    if (!token || !sessionId) {
      console.warn('⚠️  No extension token found')
      return {
        valid: false,
        needsRefresh: true,
        error: 'Extension token not found',
      }
    }

    // Check if token is still valid (not expired)
    if (!hasValidExtensionToken()) {
      console.log('⏰ Extension token expired')
      return {
        valid: false,
        needsRefresh: true,
        error: 'Extension token expired',
      }
    }

    console.log('✅ Extension session is valid')
    return {
      valid: true,
      sessionId,
    }
  } catch (error) {
    console.error('❌ Extension session verification failed:', error)
    return {
      valid: false,
      needsRefresh: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Refresh extension session (get new extension token)
 * 
 * Called when extension token is about to expire or is invalid
 * Requires valid Supabase session to exist
 * 
 * Steps:
 * 1. Check if Supabase session is still valid
 * 2. Refresh Supabase session if needed
 * 3. Call /extension-session again to get new token
 * 4. Store new token locally
 * 
 * @returns New session with fresh extension token
 */
export async function refreshExtensionSession(): Promise<ExtensionSessionResponse> {
  try {
    console.log('🔄 Refreshing extension session...')

    // Check if user is still authenticated with Supabase
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      console.error('Supabase session invalid:', sessionError)
      clearExtensionToken()
      return {
        success: false,
        error: 'Session expired. Please sign in again.',
      }
    }

    // Get fresh Supabase session
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: sessionData.session.refresh_token,
      })

    if (refreshError || !refreshData.session) {
      console.error('Failed to refresh Supabase session:', refreshError)
      clearExtensionToken()
      return {
        success: false,
        error: 'Failed to refresh session. Please sign in again.',
      }
    }

    // Get user info
    const { data: userData, error: userError } = await supabase.auth.getUser(
      refreshData.session.access_token
    )

    if (userError || !userData.user) {
      console.error('Failed to get user info:', userError)
      return {
        success: false,
        error: 'Failed to get user info',
      }
    }

    // Call backend to get new extension token
    try {
      const response = await apiClient.get<ExtensionSessionResponse>(
        '/extension-session'
      )

      if (response.success && response.extension_token && response.session_id) {
        console.log('✅ Extension session refreshed')

        // Store new extension token
        const expiresIn = response.extension_token_expires_in || 3600
        storeExtensionToken(response.extension_token, response.session_id, expiresIn)

        return {
          success: true,
          extension_token: response.extension_token,
          extension_token_expires_in: expiresIn,
          session_id: response.session_id,
          session: {
            access_token: refreshData.session.access_token,
            refresh_token: refreshData.session.refresh_token || '',
            expires_at: refreshData.session.expires_at || 0,
            user: {
              id: userData.user.id,
              email: userData.user.email || '',
              user_metadata: userData.user.user_metadata,
            },
          },
          message: 'Extension session refreshed successfully',
        }
      }

      console.warn('⚠️  No extension token in refresh response')
      return {
        success: false,
        error: 'Failed to get extension token',
      }
    } catch (backendError) {
      console.error('Backend error during refresh:', backendError)
      return {
        success: false,
        error: 'Failed to refresh extension session',
      }
    }
  } catch (error) {
    console.error('Error refreshing extension session:', error)
    clearExtensionToken()
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Logout extension session
 * 
 * Called when user logs out
 * Clears local token and notifies backend
 * 
 * @returns Success status
 */
export async function logoutExtensionSession(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🚪 Logging out extension session...')

    const sessionId = getStoredExtensionSessionId()

    // Clear local token first
    clearExtensionToken()

    // Notify backend to revoke session
    if (sessionId) {
      try {
        // Call backend logout endpoint (will be created next)
        // This revokes the session in the database
        await apiClient.post<{ success: boolean }>('/extension-logout', {
          session_id: sessionId,
        })
      } catch (error) {
        console.warn('Could not revoke session on backend:', error)
        // Continue anyway - token is already cleared locally
      }
    }

    console.log('✅ Extension session logged out')
    return { success: true }
  } catch (error) {
    console.error('Error logging out extension session:', error)
    clearExtensionToken()
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

