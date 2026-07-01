# Database Schema - Chrome Extension Integration

## Overview
All tables have Row Level Security (RLS) enabled with auth.uid() policies.

## Existing Tables (Enhancements)

### profiles (ENHANCED)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) GENERATED ALWAYS AS (
    (SELECT email FROM auth.users WHERE id = user_id)
  ) STORED,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Address
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  zip_code VARCHAR(20),
  
  -- Professional
  current_role VARCHAR(255),
  years_of_experience INT,
  notice_period_days INT,
  current_salary NUMERIC(12, 2),
  expected_salary NUMERIC(12, 2),
  employment_type VARCHAR(50), -- 'full-time', 'part-time', 'contract'
  
  -- Social Links
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  leetcode_url TEXT,
  hackerrank_url TEXT,
  website_url TEXT,
  
  -- Preferences (JSON)
  preferred_locations TEXT[], -- Array of locations
  work_mode_preferences TEXT[], -- ['remote', 'hybrid', 'onsite']
  job_categories TEXT[], -- Array of job categories
  seniority_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'lead'
  skills TEXT[], -- Array of skills
  
  -- Metadata
  profile_completion_percentage INT DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### jobs (ENHANCED)
```sql
-- Add new columns to existing jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS extension_id VARCHAR(255); -- Unique ID from extension
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS interview_type VARCHAR(50); -- 'phone', 'video', 'inperson'
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_name VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_email VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_phone VARCHAR(20);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50); -- 'full-time', 'part-time', etc.

-- Add RLS if not already enabled
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);
```

## New Tables

### resumes
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50), -- 'pdf', 'docx', 'txt'
  file_hash VARCHAR(64) UNIQUE, -- SHA256 for duplicate detection
  
  is_default BOOLEAN DEFAULT FALSE,
  preview_text TEXT, -- Extracted text for preview
  ats_score INT, -- 0-100, placeholder for ML
  
  version INT DEFAULT 1,
  previous_version_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, is_default) -- Only one default per user
);

-- RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_is_default ON resumes(user_id, is_default);
```

### ai_answers
```sql
CREATE TABLE ai_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- Markdown/rich text
  category VARCHAR(100), -- 'about_yourself', 'why_hire', 'leadership', etc.
  tags TEXT[], -- Array of tags
  difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
  estimated_delivery_seconds INT, -- How long to deliver this answer
  
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE ai_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own answers"
  ON ai_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create answers"
  ON ai_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers"
  ON ai_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers"
  ON ai_answers FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ai_answers_user_id ON ai_answers(user_id);
CREATE INDEX idx_ai_answers_category ON ai_answers(user_id, category);
CREATE INDEX idx_ai_answers_is_favorite ON ai_answers(user_id, is_favorite);
```

### user_settings
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- UI Preferences
  theme VARCHAR(20) DEFAULT 'auto', -- 'light', 'dark', 'auto'
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  
  -- Extension Settings
  extension_auto_fill BOOLEAN DEFAULT TRUE,
  extension_floating_button BOOLEAN DEFAULT TRUE,
  extension_auto_save_applications BOOLEAN DEFAULT TRUE,
  extension_notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- AI Assistant Settings
  ai_writing_style VARCHAR(50) DEFAULT 'conversational', -- 'formal', 'conversational', 'creative'
  ai_response_length VARCHAR(20) DEFAULT 'medium', -- 'short', 'medium', 'long'
  ai_auto_insert_answers BOOLEAN DEFAULT TRUE,
  preferred_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  
  -- Notification Settings
  notify_interview_reminders BOOLEAN DEFAULT TRUE,
  notify_status_updates BOOLEAN DEFAULT TRUE,
  notify_weekly_summary BOOLEAN DEFAULT FALSE,
  notify_important_only BOOLEAN DEFAULT FALSE,
  
  -- Privacy Settings
  allow_analytics BOOLEAN DEFAULT TRUE,
  allow_usage_tracking BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### sync_logs
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  source VARCHAR(50), -- 'web', 'extension'
  action VARCHAR(100), -- 'profile_update', 'resume_upload', etc.
  entity_type VARCHAR(50), -- 'profile', 'resume', 'answer', 'application'
  entity_id UUID,
  
  data JSONB, -- Synced data
  status VARCHAR(20), -- 'success', 'failed', 'pending'
  error_message TEXT,
  
  sync_duration_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
  ON sync_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(user_id, created_at DESC);
```

### guest_data (For migration)
```sql
CREATE TABLE guest_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  resumes JSONB,
  answers JSONB,
  settings JSONB,
  applications JSONB,
  profile JSONB,
  
  migrated_at TIMESTAMP WITH TIME ZONE,
  migration_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE guest_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own guest data"
  ON guest_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own guest data"
  ON guest_data FOR UPDATE
  USING (auth.uid() = user_id);
```

## Migration Scripts

### Step 1: Create new tables
Run all CREATE TABLE statements above

### Step 2: Update existing profiles
```sql
-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_role VARCHAR(255),
ADD COLUMN IF NOT EXISTS years_of_experience INT,
ADD COLUMN IF NOT EXISTS notice_period_days INT,
ADD COLUMN IF NOT EXISTS current_salary NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS expected_salary NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS leetcode_url TEXT,
ADD COLUMN IF NOT EXISTS hackerrank_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS preferred_locations TEXT[],
ADD COLUMN IF NOT EXISTS work_mode_preferences TEXT[],
ADD COLUMN IF NOT EXISTS job_categories TEXT[],
ADD COLUMN IF NOT EXISTS seniority_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS profile_completion_percentage INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio TEXT;
```

### Step 3: Update jobs table
```sql
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS cover_letter TEXT,
ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS extension_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS interview_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS recruiter_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS recruiter_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS recruiter_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS company_notes TEXT,
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);
```

### Step 4: Enable RLS on all tables
Already included in CREATE TABLE statements above

## Key Design Decisions

1. **RLS Security**: All user data is protected by row-level security using `auth.uid()`
2. **Referential Integrity**: Foreign keys with CASCADE delete for data cleanup
3. **Soft Deletes**: Not used - relying on CASCADE delete for simplicity
4. **Indexes**: Strategic indexes on frequently queried columns
5. **JSONB Fields**: Used for flexible settings storage
6. **Timestamps**: All tables track creation and update times for sync
7. **File Storage**: Resumes stored in Supabase Storage with URLs in database
8. **Unique Constraints**: Ensures data integrity (e.g., one default resume per user)

## Storage Considerations

- Resumes stored in Supabase Storage at: `/resumes/{user_id}/{resume_id}`
- Max file size: 5MB
- File types: PDF, DOCX, TXT
- Public read disabled (only via authenticated API)
- Auto-backup via Supabase replicas

## Performance Notes

- All queries include user_id filter (leverages RLS indexes)
- Pagination built into API layer
- Caching implemented on client (React Query)
- Sync logs cleaned up after 30 days (via pg_cron)
- Regular index maintenance scheduled
