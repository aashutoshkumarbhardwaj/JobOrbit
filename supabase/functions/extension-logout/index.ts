/**
 * Extension Logout Endpoint
 * POST /functions/v1/extension-logout
 * 
 * Revokes an extension session from the database
 * Called when user logs out from extension or website
 * 
 * Security:
 * - Requires valid Extension JWT token in Authorization header
 * - Marks session as revoked in database
 * - Prevents token reuse after logout
 * - Supports "all_devices" parameter to logout all sessions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0'
import { jwtVerify } from 'https://esm.sh/jose@5.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-extension-token',
}

interface LogoutRequest {
  all_devices?: boolean
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚪 Extension logout request received')

    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST.',
        }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Get extension token from header
    const extensionToken = req.headers.get('x-extension-token')
    console.log('🔐 Token present:', !!extensionToken)

    if (!extensionToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing X-Extension-Token header',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Parse request body
    let allDevices = false
    try {
      const body = await req.json() as LogoutRequest
      allDevices = body.all_devices === true
    } catch {
      // Body is optional
    }

    // Verify and decode extension token
    console.log('🔐 Verifying extension token...')

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

    let tokenPayload: any
    try {
      const signingKey = new TextEncoder().encode(extensionTokenSecret)
      const verified = await jwtVerify(extensionToken, signingKey)
      tokenPayload = verified.payload

      if (tokenPayload.aud !== 'extension') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid token audience',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired token',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    const sessionId = tokenPayload.sessionId
    const userId = tokenPayload.userId

    console.log('✅ Token verified:', { sessionId, userId })

    // Create service role client for database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    )

    // Revoke session(s)
    console.log('🚪 Revoking session(s)...')

    if (allDevices) {
      // Logout all devices for this user
      console.log('📱 Logging out all devices for user:', userId)

      const { error: revokeError } = await supabase
        .from('extension_sessions')
        .update({
          is_revoked: true,
          revoke_reason: 'user_logout_all_devices',
          revoked_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (revokeError) {
        console.error('Failed to revoke sessions:', revokeError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to revoke sessions',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
      }

      console.log('✅ All sessions revoked')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Logged out from all devices',
          data: {
            revoked_all: true,
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            ...corsHeaders,
          },
        }
      )
    } else {
      // Logout only this device
      console.log('📱 Logging out single device:', sessionId)

      const { error: revokeError } = await supabase
        .from('extension_sessions')
        .update({
          is_revoked: true,
          is_active: false,
          revoke_reason: 'user_logout',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', userId)

      if (revokeError) {
        console.error('Failed to revoke session:', revokeError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to revoke session',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
      }

      console.log('✅ Session revoked')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Logged out successfully',
          data: {
            session_id: sessionId,
            revoked: true,
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            ...corsHeaders,
          },
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
