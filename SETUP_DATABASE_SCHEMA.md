# Chrome Extension Integration - Database Schema Setup Guide

## Overview

This guide walks you through setting up the Chrome Extension Integration database schema in Supabase. All SQL migrations are in `src/database/migrations/001_chrome_extension_schema.sql`.

## Prerequisites

- Supabase account with an active project
- Access to Supabase SQL Editor
- Existing Job Orbit database with `profiles` and `jobs` tables

## Setup Steps

### Step 1: Access Supabase SQL Editor

1. Go to [supabase.com](https://supabase.com)
2. Navigate to your Job Orbit project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Execute the Migration SQL

1. Open `src/database/migrations/001_chrome_extension_schema.sql`
2. Copy the entire SQL content
3. Paste into the Supabase SQL Editor
4. Click **Run** button
5. Wait for completion (should take 5-30 seconds)

### Step 3: Verify the Migration

After successful execution, verify all tables were created:

1. Go to **Table Editor** in Supabase
2. Verify these new tables exist:
   - `resumes`
   - `ai_answers`
   - `user_settings`
   - `sync_logs`
   - `guest_data`

3. Verify these tables were extended:
   - `profiles` (now has 30+ additional columns)
   - `jobs` (now has 9 additional columns)

### Step 4: Verify RLS Policies

1. Go to **Authentication** → **Policies** in Supabase
2. Expand each table and verify RLS is enabled and policies exist:

#### profiles
- ✓ "Users can view their own profile"
- ✓ "Users can update their own profile"
- ✓ "Users can insert their own profile"

#### jobs
- ✓ "Users can view their own jobs"
- ✓ "Users can create jobs"
- ✓ "Users can update their own jobs"
- ✓ "Users can delete their own jobs"

#### resumes
- ✓ "Users can view their own resumes"
- ✓ "Users can upload resumes"
- ✓ "Users can update their own resumes"
- ✓ "Users can delete their own resumes"

#### ai_answers
- ✓ "Users can view their own answers"
- ✓ "Users can create answers"
- ✓ "Users can update their own answers"
- ✓ "Users can delete their own answers"

#### user_settings
- ✓ "Users can view their own settings"
- ✓ "Users can update their own settings"
- ✓ "Users can insert their own settings"

#### sync_logs
- ✓ "Users can view their own sync logs"

#### guest_data
- ✓ "Users can view their own guest data"
- ✓ "Users can update their own guest data"

### Step 5: Verify Indexes

1. Go to **Table Editor**
2. Select each table and verify indexes exist on frequently queried columns

### Step 6: Update Supabase Client Types (Optional)

If you have Supabase type generation enabled, regenerate types:

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

## Database Schema Summary

### New Tables Created

#### 1. **resumes** (UUID: id)
- Stores user resume files with metadata
- Tracks file version history
- Default resume selection
- ATS score placeholder

**Key Columns:**
- `user_id` - References auth.users
- `file_url` - Supabase Storage URL
- `file_hash` - SHA256 for duplicate detection
- `is_default` - Boolean, one per user
- `version` - Track versions
- `ats_score` - Future ML integration

**Indexes:**
- `idx_resumes_user_id`
- `idx_resumes_is_default`

#### 2. **ai_answers** (UUID: id)
- Stores pre-written interview answers
- Categorized by question type
- Tracks usage statistics
- Favorites/bookmarking

**Key Columns:**
- `user_id` - References auth.users
- `category` - Answer type
- `tags` - Array of tags
- `is_favorite` - Boolean
- `usage_count` - Track usage

**Indexes:**
- `idx_ai_answers_user_id`
- `idx_ai_answers_category`
- `idx_ai_answers_is_favorite`

#### 3. **user_settings** (UUID: id)
- Stores user preferences
- Theme, language, timezone
- Extension behavior settings
- AI assistant preferences
- Privacy settings

**Key Columns:**
- `user_id` - Unique, references auth.users
- `theme` - 'light', 'dark', 'auto'
- `preferred_resume_id` - Links to resumes table
- `ai_writing_style` - 'formal', 'conversational', 'creative'

#### 4. **sync_logs** (UUID: id)
- Tracks all sync events between web and extension
- Records success/failure
- Stores sync duration metrics

**Key Columns:**
- `user_id` - References auth.users
- `source` - 'web' or 'extension'
- `action` - Type of action synced
- `data` - JSONB of synced data
- `status` - 'success', 'failed', 'pending'

**Indexes:**
- `idx_sync_logs_user_id`
- `idx_sync_logs_created_at`

#### 5. **guest_data** (UUID: id)
- Stores guest data for migration
- Used when guest user signs up
- Tracks migration status

**Key Columns:**
- `user_id` - Unique, references auth.users
- `resumes` - JSONB
- `answers` - JSONB
- `migration_status` - 'pending', 'completed', 'failed'

### Extended Tables

#### profiles Table (Enhanced)
Added 30+ columns for comprehensive user profile:

**Personal Information:**
- `first_name`, `last_name`, `phone`, `avatar_url`

**Address:**
- `address_line_1`, `address_line_2`, `city`, `state`, `country`, `zip_code`

**Professional:**
- `current_role`, `years_of_experience`, `notice_period_days`
- `current_salary`, `expected_salary`, `employment_type`

**Social Links:**
- `linkedin_url`, `github_url`, `portfolio_url`
- `leetcode_url`, `hackerrank_url`, `website_url`

**Preferences (Arrays):**
- `preferred_locations[]`
- `work_mode_preferences[]` - ['remote', 'hybrid', 'onsite']
- `job_categories[]`
- `skills[]`

**Other:**
- `seniority_level` - 'entry', 'mid', 'senior', 'lead'
- `profile_completion_percentage` - 0-100
- `bio` - User bio

#### jobs Table (Enhanced)
Added 9 columns for Chrome Extension tracking:

- `cover_letter` - TEXT
- `resume_id` - UUID (FK to resumes)
- `extension_id` - VARCHAR(255)
- `interview_type` - 'phone', 'video', 'inperson'
- `recruiter_name`, `recruiter_email`, `recruiter_phone`
- `company_notes` - TEXT
- `job_description` - TEXT
- `employment_type` - 'full-time', 'part-time', 'contract'

## Security: Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Policy Pattern for User Data Tables

```sql
-- View own data
CREATE POLICY "Users can view their own [table]"
  ON [table] FOR SELECT
  USING (auth.uid() = user_id);

-- Update own data
CREATE POLICY "Users can update their own [table]"
  ON [table] FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert own data
CREATE POLICY "Users can insert their own [table]"
  ON [table] FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete own data
CREATE POLICY "Users can delete their own [table]"
  ON [table] FOR DELETE
  USING (auth.uid() = user_id);
```

**Key Security Features:**
- ✅ All policies use `auth.uid()` comparison
- ✅ No cross-user data access
- ✅ Automatic filtering in all queries
- ✅ Prevents SQL injection
- ✅ Protects from privilege escalation

## Storage Setup

Resumes are stored in Supabase Storage. Create a bucket:

1. Go to **Storage** in Supabase
2. Click **Create a new bucket**
3. Name: `resumes`
4. Set to **Private** (not public)
5. In **Policies**, add RLS policy to allow authenticated users to upload their own files

**Storage Path Pattern:** `/resumes/{user_id}/{resume_id}`

## TypeScript Types

Generated types are in `src/types/database.ts`:

```typescript
import type {
  Profile,
  Resume,
  AIAnswer,
  UserSettings,
  SyncLog,
  GuestData,
} from '@/types/database';

// All types include Insert and Update variants
type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'email'>>;
```

## Troubleshooting

### Error: "RLS policies prevent access"

**Solution:** Ensure you're authenticated and the policies reference `auth.uid()` correctly.

### Error: "UNIQUE constraint violation"

**Solution:** Some tables have unique constraints:
- `profiles(user_id)` - One profile per user
- `user_settings(user_id)` - One settings per user
- `guest_data(user_id)` - One guest data per user
- `resumes(user_id, is_default)` - Only one default resume per user

### Foreign Key Error on `resume_id` in jobs

**Solution:** This is expected. The constraint is created after the `resumes` table exists.

### Tables not appearing

**Solution:** Refresh the Supabase console or check for SQL errors in the query output.

## Next Steps

1. **API Layer** - Create `/api/v1` endpoints for CRUD operations
2. **Types** - Regenerate Supabase types with `npx supabase gen types typescript`
3. **Frontend** - Build components for profile, resume, answers management
4. **Extension** - Set up Chrome Extension communication
5. **Sync** - Implement real-time sync with Supabase realtime

## Performance Considerations

- **Indexes:** Created on frequently queried columns (user_id, is_default, category)
- **Pagination:** API layer handles pagination (default 20 items)
- **Caching:** Frontend caches with React Query
- **Cleanup:** Sync logs auto-cleanup after 30 days (scheduled job)

## Data Migration

For existing users:
1. Insert default settings when user first logs in
2. No need to migrate existing jobs
3. Optional: Prompt users to complete their profiles

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/sql-createindex.html)

---

**Migration Status:** ✅ Complete
**Last Updated:** 2024
**Version:** 1.0
