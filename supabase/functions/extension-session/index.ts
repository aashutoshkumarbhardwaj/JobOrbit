/**
 * Extension Session Endpoint
 * GET /functions/v1/extension-session
 * 
 * Creates a secure extension session with database tracking:
 * 
 * Flow:
 * 1. Verify user is authenticated via Supabase JWT
 * 2. Hash the JWT token
 * 3. Create extension_sessions DB entry
 * 4. Return Extension Session Token + session ID
 * 5. Token never contains sensitive data
 * 
 * Token Structure (Minimal):
 * {
 *   "sessionId": "uuid", // Database session ID
 *   "userId": "uuid",
 *   "issuedAt": timestamp,
 *   "expiresAt": timestamp,
 *   "aud": "extension"
 * }
 * 
 * Benefits:
 * - Sessions can be revoked immediately
 * - Device-level logout possible
 * - Multi-device management
 * - Token theft recovery (hash lookup)
 * - Better audit trail
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0'
import { SignJWT } from 'https://esm.sh/jose@5.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-extension-id, user-agent',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📱 Extension session request received')
    console.log(`📍 Method: ${req.method}`)

    // Only allow GET requests for session creation
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use GET.',
        }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    console.log('🔐 Auth header present:', !!authHeader)

    if (!authHeader) {
      console.warn('⚠️  Missing authorization header')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization header',
          message: 'Please sign in to use the Chrome Extension',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Extract token from Bearer scheme
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      console.warn('⚠️  Invalid token format')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authorization header format',
          message: 'Expected: Authorization: Bearer <token>',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Client with user token (for verification)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Service client (for writing to extension_sessions table)
    const supabaseService = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    )

    console.log('🔐 Verifying user with token...')

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      console.error('❌ Auth error:', userError?.message)
      return new Response(
        JSON.stringify({
          success: false,
          error: userError?.message || 'Unauthorized',
          message: 'User not authenticated or token expired',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    console.log('✅ User verified:', user.id)

    // Get device info from headers
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const deviceId = req.headers.get('x-device-id') || `device_${Date.now()}`
    const deviceName = req.headers.get('x-device-name') || 'Chrome Extension'

    // Get current session
    const { data: { session }, error: sessionError } = await supabaseUser.auth.getSession()

    if (sessionError || !session) {
      console.error('❌ Session error:', sessionError?.message)
      return new Response(
        JSON.stringify({
          success: false,
          error: sessionError?.message || 'Failed to get session',
          message: 'Please sign in again',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    console.log('✅ Session obtained')

    // Generate extension session token
    console.log('🔐 Creating extension session token...')

    const extensionTokenSecret = Deno.env.get('EXTENSION_TOKEN_SECRET')
    if (!extensionTokenSecret) {
      console.error('❌ EXTENSION_TOKEN_SECRET not configured')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresInSeconds = 3600 // 1 hour
    const expiresAt = now + expiresInSeconds

    // Create a minimal JWT (no sensitive data)
    // sessionId will be used to look up the full session in DB
    let sessionId: string

    try {
      // First, create the session in database
      console.log('📝 Creating extension session in database...')

      // Hash the token for secure storage (SHA256)
      const tokenHash = await hashToken(token)

      const { data: dbSession, error: dbError } = await supabaseService
        .from('extension_sessions')
        .insert({
          user_id: user.id,
          session_token_hash: tokenHash,
          device_name: deviceName,
          device_id: deviceId,
          browser: extractBrowserInfo(userAgent),
          os: extractOSInfo(userAgent),
          expires_at: new Date(expiresAt * 1000).toISOString(),
          user_agent: userAgent,
          metadata: {
            oauth_provider: user.app_metadata?.provider || 'unknown',
            auth_method: 'oauth',
          },
        })
        .select('id')
        .single()

      if (dbError || !dbSession) {
        console.error('❌ Failed to create session in DB:', dbError?.message)
        throw new Error('Failed to create session record')
      }

      sessionId = dbSession.id
      console.log('✅ Session created in DB:', sessionId)

      // Now create JWT with minimal payload
      const jwtPayload = {
        sessionId: sessionId,
        userId: user.id,
        iss: 'https://joborbit.com',
        sub: user.id,
        aud: 'extension',
        iat: now,
        exp: expiresAt,
      }

      const extensionToken = await new SignJWT(jwtPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(now)
        .setExpirationTime(expiresAt)
        .sign(new TextEncoder().encode(extensionTokenSecret))

      console.log('✅ Extension token created')

      // Build response
      const response = {
        success: true,
        data: {
          extension_token: extensionToken,
          extension_token_expires_in: expiresInSeconds,
          session_id: sessionId, // Include session ID for reference
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          },
        },
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          device_name: deviceName,
          device_id: deviceId,
        },
      }

      console.log('📤 Sending extension session response')

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders,
        },
      })
    } catch (tokenError) {
      console.error('❌ Failed to create extension token:', tokenError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create extension token',
          details: tokenError instanceof Error ? tokenError.message : String(tokenError),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }
  } catch (error) {
    console.error('❌ Error:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})

/**
 * Hash token using SHA256 (compatible with edge function runtime)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Extract browser info from user agent
 */
function extractBrowserInfo(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Unknown'
}

/**
 * Extract OS info from user agent
 */
function extractOSInfo(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('iPhone')) return 'iOS'
  if (userAgent.includes('Android')) return 'Android'
  return 'Unknown'
}
