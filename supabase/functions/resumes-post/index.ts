/**
 * POST /resumes
 * Creates a new resume for the current user
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

    const body = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return createCorsErrorResponse('Unauthorized', origin, 401, isExtensionRequest)
    }

    const { data: resume, error } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title: body.title,
        file_url: body.file_url,
        file_name: body.file_name,
        file_size: body.file_size,
        file_type: body.file_type,
        file_hash: body.file_hash,
        is_default: body.is_default || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Resume creation error:', error)
      return createCorsErrorResponse(error.message || 'Failed to create resume', origin, 500, isExtensionRequest)
    }

    return createCorsResponse(
      JSON.stringify({
        success: true,
        data: resume,
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      }),
      origin,
      {
        status: 201,
        contentType: 'application/json',
        isExtensionRequest,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return createCorsErrorResponse('Internal server error', origin, 500, isExtensionRequest)
  }
})
