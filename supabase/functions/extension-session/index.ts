/**
 * Extension Session Endpoint
 * 
 * Purpose: Create an extension session with database tracking
 * 
 * Flow:
 * 1. User authenticates via Supabase OAuth
 * 2. Frontend calls this endpoint with Supabase JWT
 * 3. Creates extension_sessions DB entry for device tracking
 * 4. Generates minimal Extension Session Token (JWT with sessionId only)
 * 5. Returns token for all future API calls
 * 6. Never exposes service-role keys
 * 
 * Security:
 * - Validates Supabase JWT
 * - Creates DB-tracked session
 * - Returns minimal JWT (session_id only)
 * - 1-hour expiration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { hashToken } from '../_shared/extension-token.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-content-type-options, x-requested-with, x-csrf-token, x-extension-token',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface ExtensionSessionResponse {
  success: boolean
  data?: {
    extension_token: string
    extension_token_expires_in: number
    session_id: string
  }
  error?: string
  details?: string
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const isExtensionRequest = req.headers.has('x-extension-token') ||
    origin?.startsWith('chrome-extension://') ||
    origin?.startsWith('moz-extension://') ||
    false

  console.log('🔷 ========================================')
  console.log('🔷 NEW REQUEST TO EXTENSION-SESSION')
  console.log('🔷 Method:', req.method)
  console.log('🔷 URL:', req.url)
  console.log('🔷 Timestamp:', new Date().toISOString())
  console.log('🔷 ========================================')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight - returning OK')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('STEP 0: Starting authentication verification...')
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header')
      console.error('❌ FAILED AT: STEP 0 - Authorization header check')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing or invalid Authorization header',
        } as ExtensionSessionResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const accessToken = authHeader.replace('Bearer ', '')
    
    console.log('✅ STEP 0 complete: Authorization header found')
    console.log('🔍 Validating JWT token (first 50 chars):', accessToken.substring(0, 50) + '...')

    // Initialize Supabase client with user's JWT
    console.log('STEP 0a: Initializing Supabase client...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    console.log('🔍 Supabase URL:', supabaseUrl)
    console.log('🔍 Using anon key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')
    
    // Create client and validate the JWT directly
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ STEP 0a complete: Supabase client created')

    // Verify user is authenticated by passing the JWT to getUser()
    console.log('STEP 0b: Validating JWT with Supabase...')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      console.error('❌ Invalid or expired JWT')
      console.error('❌ FAILED AT: STEP 0b - JWT validation')
      console.error('❌ Error details:', JSON.stringify(userError, null, 2))
      console.error('❌ User object:', user)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired authentication token',
          details: userError?.message || 'No user found',
        } as ExtensionSessionResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ User authenticated:', user.id)
    console.log('✅ User email:', user.email)
    console.log('STEP 1: User authentication complete')

    // Get extension token signing secret
    console.log('STEP 2: Getting extension token secret...')
    const extensionTokenSecret = Deno.env.get('EXTENSION_TOKEN_SECRET')
    if (!extensionTokenSecret || extensionTokenSecret.length < 32) {
      console.error('❌ EXTENSION_TOKEN_SECRET not configured or too short')
      console.error('❌ FAILED AT: STEP 2 - Extension token secret validation')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error',
        } as ExtensionSessionResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    console.log('✅ STEP 2 complete: Extension token secret validated')

    // Create extension session in database
    console.log('STEP 3: Creating extension session in database...')
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour from now
    console.log('STEP 3a: Generated session ID:', sessionId)

    // Generate minimal Extension Session Token before insert so its hash can be stored.
    const secret = new TextEncoder().encode(extensionTokenSecret)
    const extensionToken = await new jose.SignJWT({
      sessionId,
      userId: user.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience('extension')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    const tokenHash = await hashToken(extensionToken)
    const userAgent = req.headers.get('User-Agent') || 'Unknown Device'

    // Use service role client for DB operations
    console.log('STEP 3b: Creating service role client...')
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    console.log('STEP 3c: Service role client created')

    console.log('STEP 3d: Inserting session into extension_sessions table...')
    console.log('Extension token:', extensionToken.substring(0, 30))
    console.log('Token hash:', tokenHash)
    const { error: insertError } = await supabaseAdmin
      .from('extension_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        token_hash: tokenHash,
        device_name: userAgent.substring(0, 255),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (insertError) {
      console.error('❌ Failed to create session in DB:', insertError)
      console.error('❌ FAILED AT: STEP 3d - Database insert')
      console.error(insertError)
      return new Response(
        JSON.stringify(insertError),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ STEP 3 complete: Extension session created in DB:', sessionId)

    // Return success response
    console.log('STEP 5: Returning success response...')
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          extension_token: extensionToken,
          extension_token_expires_in: 3600, // 1 hour
          session_id: sessionId,
        },
      } as ExtensionSessionResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('============== ERROR ==============')
    console.error(error)

    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        message: error instanceof Error ? error.message : null,
        stack: error instanceof Error ? error.stack : null,
      }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(origin, isExtensionRequest),
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
