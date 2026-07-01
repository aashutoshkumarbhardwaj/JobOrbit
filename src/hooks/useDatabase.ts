/**
 * Supabase Database Hooks
 * Custom hooks for accessing and managing Chrome Extension Integration database tables
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import type {
  Profile,
  ProfileUpdate,
  Resume,
  ResumeInsert,
  ResumeUpdate,
  AIAnswer,
  AIAnswerInsert,
  AIAnswerUpdate,
  UserSettings,
  UserSettingsUpdate,
  SyncLog,
  GuestData,
} from '@/types/database';

// ============================================================================
// Generic Database Hook
// ============================================================================

interface UseQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  cacheTime?: number;
}

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for fetching data from Supabase
 */
function useQuery<T>(
  queryFn: () => Promise<T>,
  options: UseQueryOptions = {}
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { enabled = true, refetchInterval } = options;

  const execute = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [enabled, queryFn]);

  useEffect(() => {
    execute();

    if (refetchInterval) {
      const interval = setInterval(execute, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [execute, refetchInterval]);

  return { data, loading, error, refetch: execute };
}

// ============================================================================
// Profile Hooks
// ============================================================================

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const uid = userId || user?.id;

  return useQuery<Profile | null>(
    async () => {
      if (!uid) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (error) throw error;
      return data;
    },
    { enabled: !!uid }
  );
}

export async function updateProfile(updates: ProfileUpdate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getProfileCompletionPercentage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('profile_completion_percentage')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return (data?.profile_completion_percentage || 0) as number;
}

// ============================================================================
// Resume Hooks
// ============================================================================

export function useResumes() {
  const { user } = useAuth();

  return useQuery<Resume[]>(
    async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    { enabled: !!user?.id, refetchInterval: 30000 }
  );
}

export function useDefaultResume() {
  const { user } = useAuth();

  return useQuery<Resume | null>(
    async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    { enabled: !!user?.id }
  );
}

export async function uploadResume(
  file: File,
  title: string,
  fileHash: string
): Promise<Resume> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Upload file to storage
  const fileName = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName);

  // Create resume record
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      title,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type.split('/')[1],
      file_hash: fileHash,
      is_default: false,
      version: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setDefaultResume(resumeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Unset current default
  await supabase
    .from('resumes')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .eq('is_default', true);

  // Set new default
  const { data, error } = await supabase
    .from('resumes')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResume(resumeId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Delete from storage first
  const resume = await supabase
    .from('resumes')
    .select('file_url')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single();

  if (resume.data?.file_url) {
    const filePath = resume.data.file_url.split('/').slice(-2).join('/');
    await supabase.storage.from('resumes').remove([filePath]);
  }

  // Delete record
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function updateResume(resumeId: string, updates: ResumeUpdate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('resumes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// AI Answer Hooks
// ============================================================================

export function useAIAnswers(category?: string) {
  const { user } = useAuth();

  return useQuery<AIAnswer[]>(
    async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('ai_answers')
        .select('*')
        .eq('user_id', user.id);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    { enabled: !!user?.id, refetchInterval: 30000 }
  );
}

export async function createAIAnswer(answer: AIAnswerInsert): Promise<AIAnswer> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('ai_answers')
    .insert({
      ...answer,
      user_id: user.id,
      is_favorite: false,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAIAnswer(
  answerId: string,
  updates: AIAnswerUpdate
): Promise<AIAnswer> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('ai_answers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', answerId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleFavoriteAnswer(answerId: string): Promise<AIAnswer> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: current } = await supabase
    .from('ai_answers')
    .select('is_favorite')
    .eq('id', answerId)
    .eq('user_id', user.id)
    .single();

  const { data, error } = await supabase
    .from('ai_answers')
    .update({
      is_favorite: !current?.is_favorite,
      updated_at: new Date().toISOString(),
    })
    .eq('id', answerId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAIAnswer(answerId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('ai_answers')
    .delete()
    .eq('id', answerId)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ============================================================================
// User Settings Hooks
// ============================================================================

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery<UserSettings | null>(
    async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    { enabled: !!user?.id, refetchInterval: 30000 }
  );
}

export async function updateUserSettings(updates: UserSettingsUpdate): Promise<UserSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createUserSettingsIfNotExists(): Promise<UserSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try to get existing settings
  const { data: existing } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existing) return existing;

  // Create default settings
  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: user.id,
      theme: 'auto',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      date_format: 'MM/DD/YYYY',
      extension_auto_fill: true,
      extension_floating_button: true,
      extension_auto_save_applications: true,
      extension_notifications_enabled: true,
      ai_writing_style: 'conversational',
      ai_response_length: 'medium',
      ai_auto_insert_answers: true,
      notify_interview_reminders: true,
      notify_status_updates: true,
      notify_weekly_summary: false,
      notify_important_only: false,
      allow_analytics: true,
      allow_usage_tracking: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// Sync Logs Hooks
// ============================================================================

export function useSyncLogs(limit = 50) {
  const { user } = useAuth();

  return useQuery<SyncLog[]>(
    async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    { enabled: !!user?.id, refetchInterval: 60000 }
  );
}

export async function logSync(
  source: 'web' | 'extension',
  action: string,
  entityType: string,
  entityId: string | undefined,
  data: unknown,
  status: 'success' | 'failed' | 'pending',
  errorMessage?: string,
  syncDurationMs?: number
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('sync_logs')
    .insert({
      user_id: user.id,
      source,
      action,
      entity_type: entityType,
      entity_id: entityId,
      data: data as Record<string, unknown>,
      status,
      error_message: errorMessage,
      sync_duration_ms: syncDurationMs,
    });

  if (error) throw error;
}

// ============================================================================
// Guest Data Hooks
// ============================================================================

export function useGuestData() {
  const { user } = useAuth();

  return useQuery<GuestData | null>(
    async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('guest_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    { enabled: !!user?.id }
  );
}

export async function updateGuestDataStatus(status: 'pending' | 'completed' | 'failed') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('guest_data')
    .update({
      migration_status: status,
      migrated_at: status === 'completed' ? new Date().toISOString() : undefined,
    })
    .eq('user_id', user.id);

  if (error) throw error;
}

// ============================================================================
// Real-time Subscriptions
// ============================================================================

export function subscribeToProfileChanges(
  userId: string,
  callback: (profile: Profile) => void
) {
  const subscription = supabase
    .from(`profiles:user_id=eq.${userId}`)
    .on('*', (payload) => {
      callback(payload.new as Profile);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}

export function subscribeToResumesChanges(
  userId: string,
  callback: (resumes: Resume[]) => void
) {
  const subscription = supabase
    .from(`resumes:user_id=eq.${userId}`)
    .on('*', async () => {
      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId);
      callback(data || []);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}

export function subscribeToSettingsChanges(
  userId: string,
  callback: (settings: UserSettings) => void
) {
  const subscription = supabase
    .from(`user_settings:user_id=eq.${userId}`)
    .on('*', (payload) => {
      callback(payload.new as UserSettings);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}
