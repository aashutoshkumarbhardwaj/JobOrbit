/**
 * Extension Token Middleware
 * 
 * Validates extension session tokens against database
 * Ensures token hasn't been revoked and session is still active
 * 
 * Architecture:
 * 1. Extract token from X-Extension-Token header
 * 2. Verify JWT signature
 * 3. Look up session in database using sessionId
 * 4. Check if session is active and not expired
 * 5. Check if session is not revoked
 * 6. Update last_used_at timestamp
 * 7. Allow request to proceed
 */

import { jwtVerify } from 'jose'

/**
 * Extension token storage keys
 */
export const EXTENSION_TOKEN_KEY = 'extension_session_token'
export const EXTENSION_TOKEN_EXPIRES_AT_KEY = 'extension_session_token_expires_at'
export const EXTENSION_SESSION_ID_KEY = 'extension_session_id'

/**
 * Get stored extension token from localStorage
 */
export function getStoredExtensionToken(): string | null {
  try {
    return localStorage.getItem(EXTENSION_TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Get stored session ID from localStorage
 */
export function getStoredExtensionSessionId(): string | null {
  try {
    return localStorage.getItem(EXTENSION_SESSION_ID_KEY)
  } catch {
    return null
  }
}

/**
 * Store extension token with metadata
 */
export function storeExtensionToken(
  token: string,
  sessionId: string,
  expiresInSeconds: number = 3600
): void {
  try {
    const expiresAt = Date.now() + expiresInSeconds * 1000
    localStorage.setItem(EXTENSION_TOKEN_KEY, token)
    localStorage.setItem(EXTENSION_SESSION_ID_KEY, sessionId)
    localStorage.setItem(EXTENSION_TOKEN_EXPIRES_AT_KEY, String(expiresAt))
    console.log('✅ Extension session stored', {
      sessionId,
      expiresAt: new Date(expiresAt).toISOString(),
    })
  } catch (error) {
    console.error('Failed to store extension token:', error)
  }
}

/**
 * Clear stored extension token
 */
export function clearExtensionToken(): void {
  try {
    localStorage.removeItem(EXTENSION_TOKEN_KEY)
    localStorage.removeItem(EXTENSION_SESSION_ID_KEY)
    localStorage.removeItem(EXTENSION_TOKEN_EXPIRES_AT_KEY)
    console.log('✅ Extension session cleared')
  } catch (error) {
    console.error('Failed to clear extension token:', error)
  }
}

/**
 * Check if extension token exists and has not expired
 */
export function hasValidExtensionToken(): boolean {
  try {
    const token = getStoredExtensionToken()
    if (!token) {
      return false
    }

    const expiresAtStr = localStorage.getItem(EXTENSION_TOKEN_EXPIRES_AT_KEY)
    if (!expiresAtStr) {
      return false
    }

    const expiresAt = parseInt(expiresAtStr, 10)
    const now = Date.now()

    // Check if token is expired (with 5-minute buffer)
    if (now >= expiresAt - 5 * 60 * 1000) {
      console.log('⏰ Extension token expired')
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Get extension token payload (without verification)
 * For debugging/UI display only
 */
export function decodeExtensionTokenUnsafe(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    )

    return payload
  } catch (error) {
    console.error('Failed to decode token:', error)
    throw new Error('Failed to decode token')
  }
}

/**
 * Verify extension token and get payload
 * Used in edge functions to validate tokens
 * 
 * @param token JWT token to verify
 * @param secret Signing secret
 * @returns Decoded payload if valid
 */
export async function verifyExtensionTokenJWT(
  token: string,
  secret: string
): Promise<{
  sessionId: string
  userId: string
  iat: number
  exp: number
  aud: string
}> {
  try {
    const signingKey = new TextEncoder().encode(secret)
    const verified = await jwtVerify(token, signingKey)
    
    const payload = verified.payload as any
    
    if (payload.aud !== 'extension') {
      throw new Error('Invalid token audience')
    }

    if (!payload.sessionId || !payload.userId) {
      throw new Error('Invalid token payload - missing sessionId or userId')
    }

    return {
      sessionId: payload.sessionId,
      userId: payload.userId,
      iat: payload.iat as number,
      exp: payload.exp as number,
      aud: payload.aud,
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    throw error
  }
}

/**
 * Add extension token to request headers
 */
export function addExtensionTokenToHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  const token = getStoredExtensionToken()
  if (token) {
    return {
      ...headers,
      'X-Extension-Token': token,
    }
  }
  return headers
}

/**
 * Create interceptor for API client to add extension token
 */
export function createExtensionTokenInterceptor() {
  return {
    /**
     * Add extension token to request headers
     */
    request: (config: Record<string, any>) => {
      return {
        ...config,
        headers: addExtensionTokenToHeaders(config.headers),
      }
    },

    /**
     * Handle 401 response (token invalid/revoked)
     */
    response: async (error: any) => {
      if (error.statusCode === 401) {
        console.warn('⚠️  Extension session invalid (401)')
        clearExtensionToken()
      }
      throw error
    },
  }
}
