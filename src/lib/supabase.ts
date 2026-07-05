/**
 * Supabase Client Initialization
 * Single source of truth for Supabase configuration
 * Used by both Job Orbit web app and Chrome Extension
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY')
  console.error('App will not function correctly without these variables.')
}

/**
 * Supabase client instance
 * Shared between web app and Chrome Extension
 */
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
  },
})

export type { Session, User } from '@supabase/supabase-js'
export type { Database } from '@/integrations/supabase/types'

// Helper functions moved from integrations/supabase/client.ts
export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();

  return { data, error };
}
