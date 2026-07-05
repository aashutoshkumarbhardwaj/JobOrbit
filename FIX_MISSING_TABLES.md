# Fix Missing Database Tables - Complete Guide

## Problem

You mentioned only **3 tables** are created in Supabase, but there should be many more based on your migrations.

## Expected Tables

According to your migrations, you should have:

### Core Tables (from initial migration)
1. `profiles` - User profile data
2. `jobs` - Job applications

### Additional Tables (from later migrations)
3. `notifications` - User notifications
4. `extension_sessions` - Chrome extension sessions
5. `resumes` - User resumes/CVs
6. `ai_answers` - AI-generated answers for applications
7. `user_settings` - User preferences
8. `sync_logs` - Synchronization logs
9. `guest_data` - Guest user data before signup

**Total Expected:** 9 tables

---

## Step 1: Diagnose the Issue

### 1.1 Check What Tables Exist

**In Supabase Dashboard:**
1. Go to **Table Editor**
2. Look at the left sidebar
3. Count how many tables you see

**Or run this SQL:**
```sql
-- Copy and paste into SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 1.2 Check Applied Migrations

**In Supabase Dashboard → SQL Editor:**
```sql
SELECT version, name, applied_at 
FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

This shows which migrations have been applied.

---

## Step 2: Common Causes & Solutions

### Cause 1: Migrations Not Applied to Remote Database

**Problem:** Migrations exist locally but were never applied to Supabase.

**Solution:** Apply migrations manually

#### Option A: Use Supabase CLI (Recommended)

```bash
cd /Users/aashutoshkumarbhardwaj/Documents/GitHub/JobOrbit

# Link to your project (if not already)
supabase link --project-ref dsbkjkwefszqqzukgdtk

# Push all migrations to remote database
supabase db push

# Or apply migrations individually
supabase migration up
```

#### Option B: Manual SQL Execution

1. Go to **Supabase Dashboard → SQL Editor**
2. Open each migration file from `supabase/migrations/`
3. Copy the SQL content
4. Paste into SQL Editor
5. Click "Run"

**Order matters!** Apply in this sequence:
1. `20260114001546_dbb63a9a-b5cf-4d55-87f0-718fc59e5742.sql`
2. `20260115000000_landing_page_data.sql`
3. `20260117000000_create_notifications_table.sql`
4. `20260120000000_enforce_rls_security.sql`
5. `20260202000000_create_extension_sessions_table.sql`
6. `20260203000000_create_resumes_table.sql`
7. `20260204000000_create_ai_answers_table.sql`
8. `20260205000000_create_user_settings_table.sql`
9. `20260206000000_create_sync_logs_table.sql`
10. `20260207000000_create_guest_data_table.sql`

---

### Cause 2: Migration Errors During Execution

**Problem:** A migration failed partway through, blocking subsequent migrations.

**How to Check:**
1. Go to **Supabase Dashboard → Logs → Postgres Logs**
2. Look for error messages
3. Check SQL Editor for red error messages

**Common Errors:**

#### Error: "relation already exists"
```
ERROR: relation "profiles" already exists
```
**Fix:** The table exists but wasn't tracked in migrations. Use `CREATE TABLE IF NOT EXISTS`.

#### Error: "foreign key constraint violation"
```
ERROR: foreign key constraint "jobs_resume_id_fkey" violates foreign key constraint
```
**Fix:** Ensure parent tables exist before creating foreign keys. Check migration order.

#### Error: "column already exists"
```
ERROR: column "full_name" of relation "profiles" already exists
```
**Fix:** Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

**Solution:** 
- Fix the problematic migration SQL
- Re-run it
- Continue with remaining migrations

---

### Cause 3: Wrong Project/Database

**Problem:** Migrations were applied to local database instead of remote.

**How to Check:**
```bash
# Check which project you're linked to
supabase status

# Or check .supabase/config.toml
cat .supabase/config.toml | grep project_id
```

**Solution:** Link to correct project:
```bash
supabase link --project-ref dsbkjkwefszqqzukgdtk
supabase db push
```

---

### Cause 4: Permissions Issue

**Problem:** Your Supabase user doesn't have permission to create tables.

**How to Check:**
- Try creating a simple table manually in SQL Editor
- If you get permission denied, you're not an admin

**Solution:**
- Ensure you're logged into Supabase Dashboard as project owner
- Check project settings for your role

---

## Step 3: Apply All Migrations (Full Reset Method)

If you want to start fresh and ensure all tables are created:

### 3.1 Backup Existing Data (if any)
```sql
-- Export critical data if you have any users or jobs
SELECT * FROM profiles;
SELECT * FROM jobs;
-- Save the results
```

### 3.2 Drop All Tables (⚠️ DANGEROUS)
```sql
-- Only do this if you're sure!
DROP TABLE IF EXISTS guest_data CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS ai_answers CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS extension_sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop migration tracking
TRUNCATE supabase_migrations.schema_migrations;
```

### 3.3 Re-apply All Migrations
```bash
cd /Users/aashutoshkumarbhardwaj/Documents/GitHub/JobOrbit
supabase db push --force
```

---

## Step 4: Verify Tables Created

### 4.1 Count Tables
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: 9
```

### 4.2 List All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected output:**
```
ai_answers
extension_sessions
guest_data
jobs
notifications
profiles
resumes
sync_logs
user_settings
```

### 4.3 Check RLS Enabled
```sql
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rls_enabled = true`.

---

## Step 5: Test Table Access

### 5.1 Insert Test Data
```sql
-- Test profiles (replace with your user ID)
INSERT INTO profiles (user_id, full_name) 
VALUES ('YOUR_USER_ID', 'Test User');

-- Test jobs
INSERT INTO jobs (user_id, company, role, status) 
VALUES ('YOUR_USER_ID', 'Test Company', 'Software Engineer', 'applied');
```

### 5.2 Verify RLS Works
```sql
-- This should only show your own data when authenticated
SELECT * FROM profiles WHERE user_id = auth.uid();
SELECT * FROM jobs WHERE user_id = auth.uid();
```

---

## Quick Fix Script

Run this in **Supabase SQL Editor** to apply all migrations at once:

```sql
-- WARNING: This will re-run all migrations
-- Use only if you're sure tables don't exist yet

-- 1. Create profiles and jobs
\i supabase/migrations/20260114001546_dbb63a9a-b5cf-4d55-87f0-718fc59e5742.sql

-- 2. Add landing page data
\i supabase/migrations/20260115000000_landing_page_data.sql

-- 3. Create notifications
\i supabase/migrations/20260117000000_create_notifications_table.sql

-- 4. Enforce RLS security
\i supabase/migrations/20260120000000_enforce_rls_security.sql

-- 5. Create extension_sessions
\i supabase/migrations/20260202000000_create_extension_sessions_table.sql

-- 6. Create resumes
\i supabase/migrations/20260203000000_create_resumes_table.sql

-- 7. Create ai_answers
\i supabase/migrations/20260204000000_create_ai_answers_table.sql

-- 8. Create user_settings
\i supabase/migrations/20260205000000_create_user_settings_table.sql

-- 9. Create sync_logs
\i supabase/migrations/20260206000000_create_sync_logs_table.sql

-- 10. Create guest_data
\i supabase/migrations/20260207000000_create_guest_data_table.sql
```

**Note:** `\i` doesn't work in SQL Editor. You need to copy-paste each file's content.

---

## Alternative: Use Supabase CLI

This is the **recommended** approach:

```bash
# 1. Make sure you're in the project directory
cd /Users/aashutoshkumarbhardwaj/Documents/GitHub/JobOrbit

# 2. Check if linked to correct project
supabase status

# 3. If not linked, link it
supabase link --project-ref dsbkjkwefszqqzukgdtk

# 4. Push all migrations
supabase db push

# 5. Verify
supabase db diff
```

---

## Troubleshooting

### "Cannot connect to database"
- Check internet connection
- Verify project ID is correct
- Check Supabase project is active (not paused)

### "Migration already applied"
- This is OK! It means that migration was already run
- Continue to next migration

### "Table already exists"
- Check which tables exist
- Skip migrations for existing tables
- Only run migrations for missing tables

### "Foreign key constraint fails"
- Ensure parent tables are created first
- Check migration order
- Example: `resumes` must exist before adding `resume_id` FK to `jobs`

---

## Prevention

To avoid this in the future:

1. **Always use Supabase CLI:**
   ```bash
   supabase migration new <name>
   supabase db push
   ```

2. **Test locally first:**
   ```bash
   supabase start
   supabase db reset  # Applies all migrations locally
   supabase db push   # Then push to remote
   ```

3. **Track migrations:**
   - Keep `supabase_migrations.schema_migrations` table updated
   - Don't manually delete migration records

4. **Use version control:**
   - Commit migrations to git
   - Don't manually edit applied migrations

---

## Need More Help?

**Run the diagnostic script:**
```bash
# Copy check-database-tables.sql content
# Paste into Supabase SQL Editor
# Run and share the output
```

**Or tell me:**
1. Which 3 tables DO exist?
2. What error messages do you see?
3. Output of `supabase status`

---

**Created:** July 5, 2026  
**Status:** Ready to use
