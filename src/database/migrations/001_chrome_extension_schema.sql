-- Chrome Extension Integration Database Schema Migration
-- Execute this in Supabase SQL Editor to set up all necessary tables

-- ============================================================================
-- 1. EXTEND PROFILES TABLE
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_role VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_of_experience INT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notice_period_days INT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_salary NUMERIC(12, 2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expected_salary NUMERIC(12, 2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leetcode_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hackerrank_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_locations TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_mode_preferences TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_categories TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seniority_level VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============================================================================
-- 2. EXTEND JOBS TABLE
-- ============================================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resume_id UUID;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS extension_id VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_type VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_name VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_email VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_phone VARCHAR(20);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_description TEXT;

-- ============================================================================
-- 3. CREATE RESUMES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50),
  file_hash VARCHAR(64) UNIQUE,
  
  is_default BOOLEAN DEFAULT FALSE,
  preview_text TEXT,
  ats_score INT,
  
  version INT DEFAULT 1,
  previous_version_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, is_default)
);

-- Create indexes for resumes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_default ON resumes(user_id, is_default);

-- ============================================================================
-- 4. CREATE AI_ANSWERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_answers (
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

-- Create indexes for ai_answers
CREATE INDEX IF NOT EXISTS idx_ai_answers_user_id ON ai_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_answers_category ON ai_answers(user_id, category);
CREATE INDEX IF NOT EXISTS idx_ai_answers_is_favorite ON ai_answers(user_id, is_favorite);

-- ============================================================================
-- 5. CREATE USER_SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  theme VARCHAR(20) DEFAULT 'auto',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  
  extension_auto_fill BOOLEAN DEFAULT TRUE,
  extension_floating_button BOOLEAN DEFAULT TRUE,
  extension_auto_save_applications BOOLEAN DEFAULT TRUE,
  extension_notifications_enabled BOOLEAN DEFAULT TRUE,
  
  ai_writing_style VARCHAR(50) DEFAULT 'conversational',
  ai_response_length VARCHAR(20) DEFAULT 'medium',
  ai_auto_insert_answers BOOLEAN DEFAULT TRUE,
  preferred_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  
  notify_interview_reminders BOOLEAN DEFAULT TRUE,
  notify_status_updates BOOLEAN DEFAULT TRUE,
  notify_weekly_summary BOOLEAN DEFAULT FALSE,
  notify_important_only BOOLEAN DEFAULT FALSE,
  
  allow_analytics BOOLEAN DEFAULT TRUE,
  allow_usage_tracking BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. CREATE SYNC_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  source VARCHAR(50),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  
  data JSONB,
  status VARCHAR(20),
  error_message TEXT,
  
  sync_duration_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(user_id, created_at DESC);

-- ============================================================================
-- 7. CREATE GUEST_DATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS guest_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  resumes JSONB,
  answers JSONB,
  settings JSONB,
  applications JSONB,
  profile JSONB,
  
  migrated_at TIMESTAMP WITH TIME ZONE,
  migration_status VARCHAR(20) DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jobs RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own jobs" ON jobs;
CREATE POLICY "Users can view their own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create jobs" ON jobs;
CREATE POLICY "Users can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own jobs" ON jobs;
CREATE POLICY "Users can update their own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own jobs" ON jobs;
CREATE POLICY "Users can delete their own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Resumes RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own resumes" ON resumes;
CREATE POLICY "Users can view their own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upload resumes" ON resumes;
CREATE POLICY "Users can upload resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resumes" ON resumes;
CREATE POLICY "Users can update their own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resumes" ON resumes;
CREATE POLICY "Users can delete their own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- AI Answers RLS
ALTER TABLE ai_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own answers" ON ai_answers;
CREATE POLICY "Users can view their own answers"
  ON ai_answers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create answers" ON ai_answers;
CREATE POLICY "Users can create answers"
  ON ai_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own answers" ON ai_answers;
CREATE POLICY "Users can update their own answers"
  ON ai_answers FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own answers" ON ai_answers;
CREATE POLICY "Users can delete their own answers"
  ON ai_answers FOR DELETE
  USING (auth.uid() = user_id);

-- User Settings RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sync Logs RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sync logs" ON sync_logs;
CREATE POLICY "Users can view their own sync logs"
  ON sync_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Guest Data RLS
ALTER TABLE guest_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own guest data" ON guest_data;
CREATE POLICY "Users can view their own guest data"
  ON guest_data FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own guest data" ON guest_data;
CREATE POLICY "Users can update their own guest data"
  ON guest_data FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. UPDATE JOBS TABLE FOREIGN KEY FOR RESUMES
-- ============================================================================

ALTER TABLE jobs ADD CONSTRAINT jobs_resume_id_fk
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All tables have been created/extended and RLS policies have been applied.
-- The database is now ready for the Chrome Extension Integration system.
