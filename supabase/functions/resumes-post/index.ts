/**
 * POST /resumes
 * Creates a new resume for the current user
 * 
 * Security: Requires valid JWT token, RLS enforces user_id match
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
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
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create resume' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: resume,
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      }),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
