/**
 * GET /applications
 * Fetches all job applications for the current user
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

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

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
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: applications, count, error } = await query
      .order('applied_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Applications fetch error:', error)
      return createCorsErrorResponse(error.message || 'Failed to fetch applications', origin, 500, isExtensionRequest)
    }

    return createCorsResponse(
      JSON.stringify({
        success: true,
        data: applications || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
        },
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
