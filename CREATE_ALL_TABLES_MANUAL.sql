-- =============================================================================
-- CREATE ALL MISSING TABLES - Run this in Supabase SQL Editor
-- =============================================================================
-- This combines all migrations into one file for easy execution
-- Copy and paste this entire file into Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- 1. CREATE NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
CREATE POLICY "notifications_delete_policy" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 2. CREATE EXTENSION_SESSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.extension_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extension_sessions_user_id ON extension_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_sessions_token_hash ON extension_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_extension_sessions_expires_at ON extension_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_extension_sessions_active ON extension_sessions(user_id, is_active);

ALTER TABLE public.extension_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extension_sessions_select_policy" ON public.extension_sessions;
CREATE POLICY "extension_sessions_select_policy" ON public.extension_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "extension_sessions_insert_policy" ON public.extension_sessions;
CREATE POLICY "extension_sessions_insert_policy" ON public.extension_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "extension_sessions_update_policy" ON public.extension_sessions;
CREATE POLICY "extension_sessions_update_policy" ON public.extension_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "extension_sessions_delete_policy" ON public.extension_sessions;
CREATE POLICY "extension_sessions_delete_policy" ON public.extension_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 3. CREATE RESUMES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50),
  file_hash VARCHAR(64),
  is_default BOOLEAN DEFAULT FALSE,
  preview_text TEXT,
  ats_score INT,
  version INT DEFAULT 1,
  previous_version_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop constraint if it exists (for re-runs)
ALTER TABLE public.resumes DROP CONSTRAINT IF EXISTS unique_default_per_user;
ALTER TABLE public.resumes DROP CONSTRAINT IF EXISTS resumes_file_hash_key;

-- Add constraints
ALTER TABLE public.resumes ADD CONSTRAINT unique_default_per_user 
  UNIQUE(user_id, is_default) 
  DEFERRABLE INITIALLY DEFERRED;

-- Make file_hash unique if not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_file_hash ON resumes(file_hash) WHERE file_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_default ON resumes(user_id, is_default);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resumes_select_policy" ON public.resumes;
CREATE POLICY "resumes_select_policy" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "resumes_insert_policy" ON public.resumes;
CREATE POLICY "resumes_insert_policy" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "resumes_update_policy" ON public.resumes;
CREATE POLICY "resumes_update_policy" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "resumes_delete_policy" ON public.resumes;
CREATE POLICY "resumes_delete_policy" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
CREATE TRIGGER update_resumes_updated_at 
  BEFORE UPDATE ON public.resumes 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. CREATE AI_ANSWERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  difficulty_level VARCHAR(20),
  estimated_delivery_seconds INT,
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_answers_user_id ON ai_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_answers_category ON ai_answers(user_id, category);
CREATE INDEX IF NOT EXISTS idx_ai_answers_favorite ON ai_answers(user_id, is_favorite);

ALTER TABLE public.ai_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_answers_select_policy" ON public.ai_answers;
CREATE POLICY "ai_answers_select_policy" ON public.ai_answers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_answers_insert_policy" ON public.ai_answers;
CREATE POLICY "ai_answers_insert_policy" ON public.ai_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_answers_update_policy" ON public.ai_answers;
CREATE POLICY "ai_answers_update_policy" ON public.ai_answers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_answers_delete_policy" ON public.ai_answers;
CREATE POLICY "ai_answers_delete_policy" ON public.ai_answers
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ai_answers_updated_at ON public.ai_answers;
CREATE TRIGGER update_ai_answers_updated_at 
  BEFORE UPDATE ON public.ai_answers 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. CREATE USER_SETTINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- UI Preferences
  theme VARCHAR(20) DEFAULT 'light',
  ui_density VARCHAR(20) DEFAULT 'comfortable',
  font_size VARCHAR(20) DEFAULT 'medium',
  
  -- Extension Settings
  extension_auto_fill BOOLEAN DEFAULT TRUE,
  extension_floating_button BOOLEAN DEFAULT TRUE,
  extension_auto_save_applications BOOLEAN DEFAULT TRUE,
  extension_default_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  
  -- Notifications
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_push BOOLEAN DEFAULT TRUE,
  notifications_application_updates BOOLEAN DEFAULT TRUE,
  notifications_interview_reminders BOOLEAN DEFAULT TRUE,
  notifications_weekly_summary BOOLEAN DEFAULT TRUE,
  
  -- Privacy
  profile_visibility VARCHAR(20) DEFAULT 'private',
  show_salary_expectations BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_select_policy" ON public.user_settings;
CREATE POLICY "user_settings_select_policy" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_insert_policy" ON public.user_settings;
CREATE POLICY "user_settings_insert_policy" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_update_policy" ON public.user_settings;
CREATE POLICY "user_settings_update_policy" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_delete_policy" ON public.user_settings;
CREATE POLICY "user_settings_delete_policy" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON public.user_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create user_settings when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- 6. CREATE SYNC_LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  source VARCHAR(50) NOT NULL, -- 'web' or 'extension'
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  
  changes JSONB,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_logs_select_policy" ON public.sync_logs;
CREATE POLICY "sync_logs_select_policy" ON public.sync_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sync_logs_insert_policy" ON public.sync_logs;
CREATE POLICY "sync_logs_insert_policy" ON public.sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. CREATE GUEST_DATA TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.guest_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  resumes JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  applications JSONB DEFAULT '[]'::jsonb,
  profile JSONB DEFAULT '{}'::jsonb,
  
  migration_status VARCHAR(50) DEFAULT 'pending',
  migrated_at TIMESTAMP WITH TIME ZONE,
  migration_errors JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_data_user_id ON guest_data(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_data_migration_status ON guest_data(migration_status);

ALTER TABLE public.guest_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_data_select_policy" ON public.guest_data;
CREATE POLICY "guest_data_select_policy" ON public.guest_data
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "guest_data_insert_policy" ON public.guest_data;
CREATE POLICY "guest_data_insert_policy" ON public.guest_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "guest_data_update_policy" ON public.guest_data;
CREATE POLICY "guest_data_update_policy" ON public.guest_data
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "guest_data_delete_policy" ON public.guest_data;
CREATE POLICY "guest_data_delete_policy" ON public.guest_data
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_guest_data_updated_at ON public.guest_data;
CREATE TRIGGER update_guest_data_updated_at 
  BEFORE UPDATE ON public.guest_data 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- VERIFICATION - Run this to check all tables were created
-- =============================================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count,
  (SELECT rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = t.table_name) as rls_enabled
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- You should see 9 tables total:
-- 1. ai_answers
-- 2. extension_sessions
-- 3. guest_data
-- 4. jobs
-- 5. notifications
-- 6. profiles
-- 7. resumes
-- 8. sync_logs
-- 9. user_settings
