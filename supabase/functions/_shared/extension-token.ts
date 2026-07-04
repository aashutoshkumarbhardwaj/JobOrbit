/**
 * Extension Token Utilities (Edge Function Version)
 * 
 * Utilities for verifying and managing extension session tokens
 * Used by Edge Functions to validate extension requests
 */

import { jwtVerify } from 'https://esm.sh/jose@5.0.0'

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
 * Decode extension token payload (without verification)
 * For debugging/logging purposes only
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
 * Extract extension token from request headers
 */
export function getExtensionTokenFromHeaders(headers: Headers): string | null {
  return headers.get('x-extension-token') || headers.get('X-Extension-Token')
}

/**
 * Check if request is from extension based on headers
 */
export function isExtensionRequest(headers: Headers): boolean {
  return headers.has('x-extension-token') || headers.has('X-Extension-Token')
}