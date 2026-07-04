/**
 * Extension Token Utilities for Edge Functions
 * 
 * Provides JWT verification and validation for extension session tokens
 * Used by Edge Functions to validate extension requests
 * 
 * Architecture:
 * 1. Verify JWT signature using jose library
 * 2. Validate token payload structure
 * 3. Check audience is 'extension'
 * 4. Return parsed payload for further validation
 */

import { jwtVerify } from 'https://esm.sh/jose@5.0.0'

/**
 * Extension token payload structure
 */
export interface ExtensionTokenPayload {
  sessionId: string
  userId: string
  iat: number
  exp: number
  aud: string
  iss?: string
  sub?: string
}

/**
 * Verify extension token JWT and return payload
 * 
 * This function validates the token signature and structure.
 * Additional validation (session lookup, revocation check) should be
 * done by the calling Edge Function using the returned sessionId.
 * 
 * @param token - JWT token to verify
 * @param secret - Signing secret (EXTENSION_TOKEN_SECRET)
 * @returns Decoded and validated payload
 * @throws Error if token is invalid, expired, or malformed
 */
export async function verifyExtensionTokenJWT(
  token: string,
  secret: string
): Promise<ExtensionTokenPayload> {
  try {
    // Encode secret as Uint8Array for jose
    const signingKey = new TextEncoder().encode(secret)
    
    // Verify JWT signature and expiration
    const verified = await jwtVerify(token, signingKey, {
      algorithms: ['HS256'],
    })
    
    const payload = verified.payload as any
    
    // Validate audience
    if (payload.aud !== 'extension') {
      throw new Error('Invalid token audience')
    }

    // Validate required fields
    if (!payload.sessionId || !payload.userId) {
      throw new Error('Invalid token payload - missing sessionId or userId')
    }

    // Return typed payload
    return {
      sessionId: payload.sessionId as string,
      userId: payload.userId as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
      aud: payload.aud as string,
      iss: payload.iss as string | undefined,
      sub: payload.sub as string | undefined,
    }
  } catch (error) {
    console.error('❌ Token verification failed:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('Extension token has expired')
      }
      if (error.message.includes('signature')) {
        throw new Error('Invalid extension token signature')
      }
    }
    
    throw new Error('Invalid extension token')
  }
}

/**
 * Hash a token for secure storage (SHA-256)
 * Used for storing token hashes in the database
 * 
 * @param token - Token to hash
 * @returns Hex-encoded hash string
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Extract browser info from user agent string
 * 
 * @param userAgent - User-Agent header value
 * @returns Browser name
 */
export function extractBrowserInfo(userAgent: string): string {
  if (userAgent.includes('Edg')) return 'Edge'
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Opera')) return 'Opera'
  return 'Unknown'
}

/**
 * Extract OS info from user agent string
 * 
 * @param userAgent - User-Agent header value
 * @returns Operating system name
 */
export function extractOSInfo(userAgent: string): string {
  if (userAgent.includes('Windows NT 10')) return 'Windows 10/11'
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac OS X')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('iPhone')) return 'iOS'
  if (userAgent.includes('iPad')) return 'iPadOS'
  if (userAgent.includes('Android')) return 'Android'
  return 'Unknown'
}
