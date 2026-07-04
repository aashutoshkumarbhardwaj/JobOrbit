/**
 * Extension Token Verification Endpoint
 * GET /functions/v1/extension-verify
 * 
 * Verifies that an extension token is still valid
 * Used by extension to check authentication status
 * 
 * Flow:
 * 1. Extract extension token from X-Extension-Token header
 * 2. Verify JWT signature and expiration
 * 3. Check session is active in database
 * 4. Return verification status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0'
import { verifyExtensionTokenJWT } from '../_shared/extension-token.ts'
import { getCorsHeaders, handleCorsPreflight, createCorsResponse, createCorsErrorResponse } from '../_shared/cors.ts'

serve(async (req) => {
  const origin = req.headers.get('origin')
  const isExtensionRequest = req.headers.has('x-extension-token')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin, isExtensionRequest)
  }

  try {
    console.log('🔐 Extension token verification request received')
    console.log(`📍 Method: ${req.method}`)

    // Only allow GET requests
    if (req.method !== 'GET') {
      return createCorsErrorResponse('Method not allowed. Use GET.', origin, 405, isExtensionRequest)
    }

    // Get extension token from header
    const extensionToken = req.headers.get('x-extension-token')
    console.log('🔐 Extension token present:', !!extensionToken)

    if (!extensionToken) {
      console.warn('⚠️  Missing extension token')
      return createCorsErrorResponse('Missing extension token', origin, 401, isExtensionRequest)
    }

    // Verify extension token
    const extensionTokenSecret = Deno.env.get('EXTENSION_TOKEN_SECRET')
    if (!extensionTokenSecret) {
      console.error('❌ EXTENSION_TOKEN_SECRET not configured')
      return createCorsErrorResponse('Server configuration error', origin, 500, isExtensionRequest)
    }

    let tokenPayload
    try {
      tokenPayload = await verifyExtensionTokenJWT(extensionToken, extensionTokenSecret)
      console.log('✅ Extension token verified:', tokenPayload.sessionId)
    } catch (error) {
      console.error('❌ Invalid extension token:', error.message)
      return createCorsErrorResponse('Invalid extension token', origin, 401, isExtensionRequest)
    }

    // Create service client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabaseService = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    )

    console.log('📝 Checking session status in database...')

    // Check if session is still active
    const { data: session, error: sessionError } = await supabaseService
      .from('extension_sessions')
      .select('id, user_id, is_revoked, expires_at')
      .eq('id', tokenPayload.sessionId)
      .eq('user_id', tokenPayload.userId) // Extra security check
      .single()

    if (sessionError || !session) {
      console.error('❌ Session not found:', sessionError?.message)
      return createCorsErrorResponse('Session not found', origin, 401, isExtensionRequest)
    }

    // Check if session is revoked
    if (session.is_revoked) {
      console.warn('⚠️  Session has been revoked')
      return createCorsErrorResponse('Session revoked', origin, 401, isExtensionRequest)
    }

    // Check if session has expired
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    
    if (now >= expiresAt) {
      console.warn('⏰ Session has expired')
      return createCorsErrorResponse('Session expired', origin, 401, isExtensionRequest)
    }

    // Update last used timestamp
    await supabaseService
      .from('extension_sessions')
      .update({ last_used_at: now.toISOString() })
      .eq('id', tokenPayload.sessionId)

    console.log('✅ Extension token is valid')

    // Build response
    const response = {
      success: true,
      valid: true,
      data: {
        sessionId: tokenPayload.sessionId,
        userId: tokenPayload.userId,
        expiresAt: session.expires_at,
      },
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    }

    console.log('📤 Sending verification response')

    return createCorsResponse(
      JSON.stringify(response),
      origin,
      {
        status: 200,
        contentType: 'application/json',
        isExtensionRequest: true,
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return createCorsErrorResponse('Internal server error', origin, 500, isExtensionRequest)
  }
})