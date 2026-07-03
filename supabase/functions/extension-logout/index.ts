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
import { getCorsHeaders, securityHeaders, handleCorsPreflight, createCorsResponse, createCorsErrorResponse } from '../_shared/cors.ts'

interface LogoutRequest {
  all_devices?: boolean
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const isExtensionRequest = true // This is always an extension request

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin, isExtensionRequest)
  }

  try {
    console.log('🚪 Extension logout request received')

    // Only allow POST
    if (req.method !== 'POST') {
      return createCorsErrorResponse('Method not allowed. Use POST.', origin, 405, isExtensionRequest)
    }

    // Get extension token from header
    const extensionToken = req.headers.get('x-extension-token')
    console.log('🔐 Token present:', !!extensionToken)

    if (!extensionToken) {
      return createCorsErrorResponse('Missing X-Extension-Token header', origin, 401, isExtensionRequest)
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
      return createCorsErrorResponse('Server configuration error', origin, 500, isExtensionRequest)
    }

    let tokenPayload: any
    try {
      const signingKey = new TextEncoder().encode(extensionTokenSecret)
      const verified = await jwtVerify(extensionToken, signingKey)
      tokenPayload = verified.payload

      if (tokenPayload.aud !== 'extension') {
        return createCorsErrorResponse('Invalid token audience', origin, 401, isExtensionRequest)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      return createCorsErrorResponse('Invalid or expired token', origin, 401, isExtensionRequest)
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
        return createCorsErrorResponse('Failed to revoke sessions', origin, 500, isExtensionRequest)
      }

      console.log('✅ All sessions revoked')

      return createCorsResponse(
        JSON.stringify({
          success: true,
          message: 'Logged out from all devices',
          data: {
            revoked_all: true,
          },
        }),
        origin,
        {
          status: 200,
          contentType: 'application/json',
          isExtensionRequest,
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
        return createCorsErrorResponse('Failed to revoke session', origin, 500, isExtensionRequest)
      }

      console.log('✅ Session revoked')

      return createCorsResponse(
        JSON.stringify({
          success: true,
          message: 'Logged out successfully',
          data: {
            session_id: sessionId,
            revoked: true,
          },
        }),
        origin,
        {
          status: 200,
          contentType: 'application/json',
          isExtensionRequest,
        }
      )
    }
  } catch (error) {
    console.error('❌ Error:', error)
    return createCorsErrorResponse('Internal server error', origin, 500, isExtensionRequest)
  }
})
