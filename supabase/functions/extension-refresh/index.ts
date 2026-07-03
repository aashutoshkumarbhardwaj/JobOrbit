/**
 * Extension Refresh Endpoint
 * POST /functions/v1/extension-refresh
 * 
 * Allows extension to refresh expired session tokens
 * Used when access_token expires but refresh_token is still valid
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0'
import { getCorsHeaders, securityHeaders, handleCorsPreflight, createCorsResponse, createCorsErrorResponse } from '../_shared/cors.ts'

interface RefreshRequest {
  refresh_token: string
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const isExtensionRequest = true // This is always an extension request

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin, isExtensionRequest)
  }

  try {
    console.log('🔄 Extension refresh request received')

    // Only allow POST
    if (req.method !== 'POST') {
      return createCorsErrorResponse('Method not allowed. Use POST.', origin, 405, isExtensionRequest)
    }

    // Parse request body
    let refreshToken: string
    try {
      const body = await req.json() as RefreshRequest
      refreshToken = body.refresh_token

      if (!refreshToken) {
        return createCorsErrorResponse('Missing refresh_token in request body', origin, 400, isExtensionRequest)
      }
    } catch (error) {
      return createCorsErrorResponse('Invalid JSON in request body', origin, 400, isExtensionRequest)
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
      return createCorsErrorResponse(error?.message || 'Failed to refresh session', origin, 401, isExtensionRequest)
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
      return createCorsErrorResponse('Failed to get user information', origin, 500, isExtensionRequest)
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

    return createCorsResponse(
      JSON.stringify(response),
      origin,
      {
        status: 200,
        contentType: 'application/json',
        isExtensionRequest,
      }
    )
  } catch (error) {
    console.error('❌ Error:', error)
    return createCorsErrorResponse('Internal server error', origin, 500, isExtensionRequest)
  }
})
