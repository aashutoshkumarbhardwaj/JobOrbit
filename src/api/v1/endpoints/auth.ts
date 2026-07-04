/**
 * Authentication API Endpoints
 * Wrapper around AuthManager for consistency
 * This layer can be used for backend API calls if needed
 */

import { authManager } from '@/lib/auth/AuthManager'

export interface SessionResponse {
  access_token: string
  refresh_token: string | null
  expires_in: number
  user_id: string
  email: string
}

export interface TokenExchangePayload {
  code: string
  provider: 'google' | 'github' | 'microsoft'
  redirectUri: string
}

export interface RefreshTokenPayload {
  refresh_token: string
}

/**
 * Get current session
 * Uses AuthManager directly
 */
export async function getSession(): Promise<SessionResponse | null> {
  const session = authManager.getCurrentSession()
  if (!session) return null

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in || 3600,
    user_id: session.user.id,
    email: session.user.email || '',
  }
}

/**
 * Logout current session
 * Uses AuthManager directly
 */
export async function logout(): Promise<void> {
  await authManager.signOut()
}

/**
 * Refresh authentication token
 * Uses AuthManager directly
 */
export async function refreshToken(): Promise<SessionResponse | null> {
  const session = await authManager.refreshSession()
  if (!session) return null

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in || 3600,
    user_id: session.user.id,
    email: session.user.email || '',
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<SessionResponse> {
  await authManager.signInWithEmail({ email, password })
  const session = authManager.getCurrentSession()
  const user = authManager.getCurrentUser()
  
  if (!session || !user) {
    throw new Error('Failed to get session after sign in')
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in || 3600,
    user_id: user.id,
    email: user.email || '',
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<SessionResponse | null> {
  await authManager.signUpWithEmail({ email, password, fullName })
  const session = authManager.getCurrentSession()
  const user = authManager.getCurrentUser()
  
  if (!session || !user) return null

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in || 3600,
    user_id: user.id,
    email: user.email || '',
  }
}

/**
 * Validate session token
 * Uses AuthManager directly
 */
export async function validateSession(): Promise<{ valid: boolean }> {
  const isValid = await authManager.validateSession()
  return { valid: isValid }
}

/**
 * Revoke all sessions (logout all devices)
 * Uses AuthManager directly
 */
export async function revokeAllSessions(): Promise<void> {
  await authManager.signOutAllDevices()
}
