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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header')
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
    
    console.log('🔍 Validating JWT token (first 50 chars):', accessToken.substring(0, 50) + '...')

    // Initialize Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    console.log('🔍 Supabase URL:', supabaseUrl)
    console.log('🔍 Using anon key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')
    
    // Create client and validate the JWT directly
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verify user is authenticated by passing the JWT to getUser()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      console.error('❌ Invalid or expired JWT')
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

    // Get extension token signing secret
    const extensionTokenSecret = Deno.env.get('EXTENSION_TOKEN_SECRET')
    if (!extensionTokenSecret || extensionTokenSecret.length < 32) {
      console.error('❌ EXTENSION_TOKEN_SECRET not configured or too short')
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

    // Create extension session in database
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour from now

    // Use service role client for DB operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: insertError } = await supabaseAdmin
      .from('extension_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        device_name: req.headers.get('User-Agent')?.substring(0, 255) || 'Unknown Device',
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (insertError) {
      console.error('❌ Failed to create session in DB:', insertError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create session',
        } as ExtensionSessionResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Extension session created in DB:', sessionId)

    // Generate minimal Extension Session Token
    // Contains only sessionId - backend looks up user_id from DB
    const secret = new TextEncoder().encode(extensionTokenSecret)
    const extensionToken = await new jose.SignJWT({
      sessionId: sessionId,
      userId: user.id, // For audit trail only
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience('extension')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    console.log('✅ Extension token generated')

    // Return success response
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
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ExtensionSessionResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
