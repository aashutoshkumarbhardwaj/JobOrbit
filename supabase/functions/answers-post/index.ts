/**
 * POST /answers
 * Creates a new AI answer for the current user
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

    const { data: answer, error } = await supabase
      .from('ai_answers')
      .insert({
        user_id: user.id,
        title: body.title,
        content: body.content,
        category: body.category,
        tags: body.tags || [],
        difficulty_level: body.difficulty_level,
        estimated_delivery_seconds: body.estimated_delivery_seconds,
        is_favorite: body.is_favorite || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Answer creation error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create answer' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: answer,
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
