-- ============================================================================
-- Row-Level Security (RLS) Enforcement Migration
-- 
-- This migration enforces comprehensive Row-Level Security on all tables
-- to ensure users can only access their own data
--
-- Every table:
-- - Has RLS enabled
-- - Has policies for SELECT, INSERT, UPDATE, DELETE using auth.uid()
-- - Prevents cross-user data access at the database level
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. JOBS TABLE - RLS
-- ============================================================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

-- Create comprehensive RLS policies for jobs
CREATE POLICY "jobs_select_policy" ON public.jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "jobs_insert_policy" ON public.jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_update_policy" ON public.jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_delete_policy" ON public.jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. RESUMES TABLE - RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resumes_select_policy" ON public.resumes;
DROP POLICY IF EXISTS "resumes_insert_policy" ON public.resumes;
DROP POLICY IF EXISTS "resumes_update_policy" ON public.resumes;
DROP POLICY IF EXISTS "resumes_delete_policy" ON public.resumes;

CREATE POLICY "resumes_select_policy" ON public.resumes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "resumes_insert_policy" ON public.resumes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_update_policy" ON public.resumes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_delete_policy" ON public.resumes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. AI_ANSWERS TABLE - RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.ai_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_answers_select_policy" ON public.ai_answers;
DROP POLICY IF EXISTS "ai_answers_insert_policy" ON public.ai_answers;
DROP POLICY IF EXISTS "ai_answers_update_policy" ON public.ai_answers;
DROP POLICY IF EXISTS "ai_answers_delete_policy" ON public.ai_answers;

CREATE POLICY "ai_answers_select_policy" ON public.ai_answers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_answers_insert_policy" ON public.ai_answers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_answers_update_policy" ON public.ai_answers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_answers_delete_policy" ON public.ai_answers
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. USER_SETTINGS TABLE - RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_select_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_policy" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_delete_policy" ON public.user_settings;

CREATE POLICY "user_settings_select_policy" ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_policy" ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_policy" ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_delete_policy" ON public.user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. SYNC_LOGS TABLE - RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_logs_select_policy" ON public.sync_logs;
DROP POLICY IF EXISTS "sync_logs_insert_policy" ON public.sync_logs;
DROP POLICY IF EXISTS "sync_logs_update_policy" ON public.sync_logs;
DROP POLICY IF EXISTS "sync_logs_delete_policy" ON public.sync_logs;

CREATE POLICY "sync_logs_select_policy" ON public.sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sync_logs_insert_policy" ON public.sync_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_logs_update_policy" ON public.sync_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_logs_delete_policy" ON public.sync_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. GUEST_DATA TABLE - RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.guest_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_data_select_policy" ON public.guest_data;
DROP POLICY IF EXISTS "guest_data_insert_policy" ON public.guest_data;
DROP POLICY IF EXISTS "guest_data_update_policy" ON public.guest_data;
DROP POLICY IF EXISTS "guest_data_delete_policy" ON public.guest_data;

CREATE POLICY "guest_data_select_policy" ON public.guest_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "guest_data_insert_policy" ON public.guest_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guest_data_update_policy" ON public.guest_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guest_data_delete_policy" ON public.guest_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE - RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_policy" ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. PUBLIC TABLES - No RLS (intentionally public)
-- ============================================================================

-- Landing stats and testimonials are public, no RLS needed
ALTER TABLE public.landing_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. VERIFICATION - Check All RLS Policies
-- ============================================================================

-- View all RLS policies to verify they were created correctly:
-- SELECT * FROM pg_policies WHERE tablename IN (
--   'profiles', 'jobs', 'resumes', 'ai_answers', 
--   'user_settings', 'sync_logs', 'guest_data', 'notifications'
-- );
