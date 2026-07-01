/**
 * Extension Token Manager
 * 
 * Creates and validates short-lived JWT tokens for Chrome Extension
 * These tokens are separate from Supabase auth tokens
 * They provide an extra layer of security and control
 */

import { jwtVerify, SignJWT } from 'jose'

// Get signing key from environment
const getSigningKey = (): Uint8Array => {
  const secret = import.meta.env.VITE_EXTENSION_TOKEN_SECRET
  if (!secret) {
    console.warn('⚠️  VITE_EXTENSION_TOKEN_SECRET not set, using default for development')
    // Default for development - NEVER use in production
    return new TextEncoder().encode('development-secret-key-change-in-production')
  }
  return new TextEncoder().encode(secret)
}

export interface ExtensionTokenPayload {
  // User info
  user_id: string
  user_email: string
  
  // Token info
  iss: string // Issuer
  sub: string // Subject (user_id)
  aud: string // Audience (always "extension")
  iat: number // Issued at
  exp: number // Expiration time
  jti: string // Unique token ID
  
  // Extension info
  extension_id?: string
  device_id?: string
}

/**
 * Create short-lived extension token
 * 
 * @param userId - User's UUID from Supabase
 * @param userEmail - User's email
 * @param expiresInSeconds - How long token is valid (default: 1 hour)
 * @returns Signed JWT token
 */
export async function createExtensionToken(
  userId: string,
  userEmail: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  try {
    const signingKey = getSigningKey()
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + expiresInSeconds

    const payload: ExtensionTokenPayload = {
      user_id: userId,
      user_email: userEmail,
      iss: 'https://joborbit.com',
      sub: userId,
      aud: 'extension',
      iat: now,
      exp: expiresAt,
      jti: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    // Sign the token
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .sign(signingKey)

    console.log('✅ Extension token created:', {
      user_id: userId,
      expires_in_seconds: expiresInSeconds,
      jti: payload.jti,
    })

    return token
  } catch (error) {
    console.error('❌ Failed to create extension token:', error)
    throw new Error('Failed to create extension token')
  }
}

/**
 * Verify extension token
 * 
 * @param token - JWT token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyExtensionToken(
  token: string
): Promise<ExtensionTokenPayload> {
  try {
    if (!token) {
      throw new Error('Token is required')
    }

    const signingKey = getSigningKey()

    // Verify and decode token
    const verified = await jwtVerify(token, signingKey)
    const payload = verified.payload as ExtensionTokenPayload

    // Validate token structure
    if (payload.aud !== 'extension') {
      throw new Error('Token is not for extension use')
    }

    if (!payload.user_id || !payload.user_email) {
      throw new Error('Invalid token payload')
    }

    console.log('✅ Extension token verified:', {
      user_id: payload.user_id,
      jti: payload.jti,
    })

    return payload
  } catch (error) {
    if (error instanceof Error) {
      console.warn('⚠️  Token verification failed:', error.message)
      throw error
    }
    console.error('❌ Unexpected error during token verification:', error)
    throw new Error('Token verification failed')
  }
}

/**
 * Check if token is about to expire
 * 
 * @param token - JWT token to check
 * @param bufferSeconds - Time buffer before expiration (default: 5 minutes)
 * @returns true if token should be refreshed
 */
export async function shouldRefreshExtensionToken(
  token: string,
  bufferSeconds: number = 300
): Promise<boolean> {
  try {
    const payload = await verifyExtensionToken(token)
    const now = Math.floor(Date.now() / 1000)
    const refreshTime = payload.exp - bufferSeconds

    return now >= refreshTime
  } catch {
    // If token is invalid, it definitely needs refresh
    return true
  }
}

/**
 * Decode token without verification (for debugging)
 * NEVER use this for security decisions - always verify first!
 * 
 * @param token - JWT token to decode
 * @returns Decoded payload
 */
export function decodeExtensionTokenUnsafe(token: string): ExtensionTokenPayload {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    )

    return payload as ExtensionTokenPayload
  } catch (error) {
    console.error('Failed to decode token:', error)
    throw new Error('Failed to decode token')
  }
}

/**
 * Extract user ID from token (verified)
 * 
 * @param token - JWT token
 * @returns User ID
 */
export async function getExtensionTokenUserId(token: string): Promise<string> {
  const payload = await verifyExtensionToken(token)
  return payload.user_id
}

/**
 * Extract user email from token (verified)
 * 
 * @param token - JWT token
 * @returns User email
 */
export async function getExtensionTokenUserEmail(token: string): Promise<string> {
  const payload = await verifyExtensionToken(token)
  return payload.user_email
}
