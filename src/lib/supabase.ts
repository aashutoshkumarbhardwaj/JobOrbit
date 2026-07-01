/**
 * Supabase Client Initialization
 * Single source of truth for Supabase configuration
 * Used by both Job Orbit web app and Chrome Extension
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Missing Supabase environment variables')
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY')
}

/**
 * Supabase client instance
 * Shared between web app and Chrome Extension
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type { Session, User } from '@supabase/supabase-js'
