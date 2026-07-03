/**
 * POST /applications
 * Creates a new job application
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

    const { data: application, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        company: body.company,
        role: body.role,
        status: body.status || 'applied',
        location: body.location,
        salary: body.salary,
        applied_date: body.applied_date || new Date().toISOString().split('T')[0],
        interview_date: body.interview_date,
        notes: body.notes,
        url: body.url,
        resume_id: body.resume_id,
        interview_type: body.interview_type,
        recruiter_name: body.recruiter_name,
        recruiter_email: body.recruiter_email,
        recruiter_phone: body.recruiter_phone,
        company_notes: body.company_notes,
        job_description: body.job_description,
      })
      .select()
      .single()

    if (error) {
      console.error('Application creation error:', error)
      return createCorsErrorResponse(error.message || 'Failed to create application', origin, 500, isExtensionRequest)
    }

    return createCorsResponse(
      JSON.stringify({
        success: true,
        data: application,
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
