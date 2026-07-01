/**
 * Authentication API Endpoints
 * Wrapper around Supabase Auth for consistency
 * This layer can be used for backend API calls if needed
 */

import * as supabaseAuth from '@/lib/auth/supabase-auth'

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
 * Uses Supabase auth directly
 */
export async function getSession(): Promise<SessionResponse | null> {
  const session = await supabaseAuth.getSession()
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
 * Uses Supabase auth directly
 */
export async function logout(): Promise<void> {
  await supabaseAuth.signOut()
}

/**
 * Refresh authentication token
 * Uses Supabase auth directly
 */
export async function refreshToken(): Promise<SessionResponse | null> {
  const session = await supabaseAuth.refreshToken()
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
  const data = await supabaseAuth.signInWithEmail({ email, password })
  return {
    access_token: data.session!.access_token,
    refresh_token: data.session!.refresh_token,
    expires_in: data.session!.expires_in || 3600,
    user_id: data.user!.id,
    email: data.user!.email || '',
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
  const data = await supabaseAuth.signUpWithEmail({ email, password, fullName })
  
  if (!data.session) return null

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in || 3600,
    user_id: data.user!.id,
    email: data.user!.email || '',
  }
}

/**
 * Validate session token
 * Uses Supabase auth directly
 */
export async function validateSession(): Promise<{ valid: boolean }> {
  const isValid = await supabaseAuth.isAuthenticated()
  return { valid: isValid }
}

/**
 * Revoke all sessions (logout all devices)
 * Uses Supabase auth directly
 */
export async function revokeAllSessions(): Promise<void> {
  await supabaseAuth.signOutAllDevices()
}
