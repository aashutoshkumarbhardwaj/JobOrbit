/**
 * GET /answers
 * Fetches all AI answers for the current user
 * 
 * Security: Requires valid JWT token, RLS enforces user_id match
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0'
import { getCorsHeaders, securityHeaders, handleCorsPreflight, createCorsResponse, createCorsErrorResponse } from '../_shared/cors.ts'

serve(async (req) => {
  const origin = req.headers.get('origin')
  const isExtensionRequest = req.headers.has('x-extension-token')

  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin, isExtensionRequest)
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return createCorsErrorResponse('Missing authorization header', origin, 401, isExtensionRequest)
    }

    // Get query parameters
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const isFavorite = url.searchParams.get('is_favorite') === 'true'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return createCorsErrorResponse('Unauthorized', origin, 401, isExtensionRequest)
    }

    let query = supabase
      .from('ai_answers')
      .select('*')
      .eq('user_id', user.id)

    if (category) {
      query = query.eq('category', category)
    }

    if (isFavorite) {
      query = query.eq('is_favorite', true)
    }

    const { data: answers, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Answers fetch error:', error)
      return createCorsErrorResponse(error.message || 'Failed to fetch answers', origin, 500, isExtensionRequest)
    }

    return createCorsResponse(
      JSON.stringify({
        success: true,
        data: answers || [],
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      }),
      origin,
      {
        status: 200,
        contentType: 'application/json',
        isExtensionRequest,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return createCorsErrorResponse('Internal server error', origin, 500, isExtensionRequest)
  }
})
