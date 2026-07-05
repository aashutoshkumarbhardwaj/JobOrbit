# Database Tables Issue - Quick Fix

## Problem

Only **3 tables** created in Supabase, but you have 10 migration files.

**Expected tables:** 9  
**Currently exist:** 3  
**Missing:** ~6 tables

---

## Root Cause

Your migration files exist locally but were **never applied to the remote Supabase database**.

Having migration files ≠ Tables created in Supabase

---

## Quick Fix (2 minutes)

### Option 1: Automated Script (Recommended)

```bash
cd /Users/aashutoshkumarbhardwaj/Documents/GitHub/JobOrbit
./apply-all-migrations.sh
```

This will:
1. Check if Supabase CLI is installed
2. Link to your project
3. Push all migrations
4. Verify tables created

### Option 2: Manual via CLI

```bash
cd /Users/aashutoshkumarbhardwaj/Documents/GitHub/JobOrbit

# Link to project
supabase link --project-ref dsbkjkwefszqqzukgdtk

# Push all migrations
supabase db push
```

### Option 3: Manual via Dashboard (No CLI)

1. Go to **Supabase Dashboard → SQL Editor**
2. Open each file in `supabase/migrations/` (in order!)
3. Copy SQL content
4. Paste into SQL Editor
5. Click **Run**

**Apply in this order:**
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

## Verify Tables Created

### In Supabase Dashboard

1. Go to **Table Editor**
2. Count tables in left sidebar
3. Should see **9 tables:**
   - `profiles`
   - `jobs`
   - `notifications`
   - `extension_sessions`
   - `resumes`
   - `ai_answers`
   - `user_settings`
   - `sync_logs`
   - `guest_data`

### Via SQL

Run in **SQL Editor:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should return 9 rows.

---

## Why This Happened

**Common reasons:**

1. **Never ran migrations on remote**
   - Migration files created locally
   - Never pushed to Supabase
   - **Fix:** Run `supabase db push`

2. **Used wrong database**
   - Applied to local Docker instance
   - Not applied to remote Supabase
   - **Fix:** Link correct project first

3. **Migration failed silently**
   - Error during migration
   - Stopped at migration #3
   - **Fix:** Check logs, fix error, re-run

---

## Detailed Guides

- **Complete troubleshooting:** `FIX_MISSING_TABLES.md`
- **Diagnostic queries:** `check-database-tables.sql`
- **Automated script:** `apply-all-migrations.sh`

---

## After Fixing

Once all tables are created:

1. **Test table access:**
   ```sql
   SELECT * FROM profiles LIMIT 1;
   SELECT * FROM jobs LIMIT 1;
   SELECT * FROM resumes LIMIT 1;
   ```

2. **Verify RLS enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
   
   All should show `rowsecurity = true`

3. **Test your app:**
   ```bash
   npm run dev
   # Login and verify data loads
   ```

---

## Quick Commands Reference

```bash
# Check what's linked
supabase status

# Link to project
supabase link --project-ref dsbkjkwefszqqzukgdtk

# Apply all migrations
supabase db push

# Check remote database
supabase db diff

# Reset local database (testing)
supabase db reset
```

---

**Status:** Ready to fix  
**Time:** ~2 minutes  
**Difficulty:** Easy
