/**
 * Extension Refresh Endpoint
 * POST /functions/v1/extension-refresh
 * 
 * Allows extension to refresh expired session tokens
 * Used when access_token expires but refresh_token is still valid
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

interface RefreshRequest {
  refresh_token: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Extension refresh request received')

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

    // Parse request body
    let refreshToken: string
    try {
      const body = await req.json() as RefreshRequest
      refreshToken = body.refresh_token

      if (!refreshToken) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing refresh_token in request body',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    console.log('🔐 Refreshing token...')

    // Create Supabase client (unauthenticated - we'll use refresh token)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    )

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      console.error('❌ Refresh failed:', error?.message)
      return new Response(
        JSON.stringify({
          success: false,
          error: error?.message || 'Failed to refresh session',
          message: 'Refresh token may have expired. Please sign in again.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    console.log('✅ Token refreshed successfully')

    // Get updated user info with new token
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()

    if (userError || !user) {
      console.error('❌ Failed to get user:', userError?.message)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to get user information',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Return new session
    const response = {
      success: true,
      data: {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || refreshToken,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
        },
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        },
      },
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    }

    console.log('📤 Sending refreshed session')

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
    })
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
