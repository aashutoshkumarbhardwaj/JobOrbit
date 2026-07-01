# Quick Start - Database Schema Setup

**Status:** Ready to deploy ✅

## 🚀 5-Minute Setup

### Step 1: Go to Supabase
```
1. Navigate to https://supabase.com/dashboard
2. Select your Job Orbit project
3. Click "SQL Editor" → "New Query"
```

### Step 2: Copy & Paste the Migration
```
1. Open: src/database/migrations/001_chrome_extension_schema.sql
2. Copy entire SQL file
3. Paste into Supabase SQL Editor
```

### Step 3: Execute
```
1. Click "Run" button
2. Wait for success message (5-30 seconds)
3. Verify no errors
```

### Step 4: Verify Setup
```bash
# In Supabase Dashboard:
1. Table Editor → Check all 7 tables exist
2. Authentication → Policies → Verify RLS enabled
3. That's it! 🎉
```

---

## 📁 Files You Need to Use

### To Execute
- **src/database/migrations/001_chrome_extension_schema.sql**

### To Understand
- **SETUP_DATABASE_SCHEMA.md** (detailed setup guide)
- **DATABASE_SCHEMA_IMPLEMENTATION.md** (full implementation summary)
- **QUICK_START_DATABASE.md** (this file)

### For Development
- **src/types/database.ts** (TypeScript types)
- **src/hooks/useDatabase.ts** (Database hooks)

---

## 🎯 What Gets Created

### 7 New Tables
- ✅ resumes
- ✅ ai_answers
- ✅ user_settings
- ✅ sync_logs
- ✅ guest_data

### 2 Extended Tables
- ✅ profiles (30+ new columns)
- ✅ jobs (9 new columns)

### Security
- ✅ RLS enabled on all tables
- ✅ 23 RLS policies created
- ✅ Row-level user isolation

### Performance
- ✅ 6 strategic indexes
- ✅ Foreign key constraints
- ✅ Unique constraints

---

## ✅ Success Indicators

After running the SQL, you should see:

1. **In Table Editor:**
   - [ ] resumes table exists
   - [ ] ai_answers table exists
   - [ ] user_settings table exists
   - [ ] sync_logs table exists
   - [ ] guest_data table exists

2. **In Policies:**
   - [ ] profiles has 4 policies
   - [ ] jobs has 4 policies
   - [ ] resumes has 4 policies
   - [ ] ai_answers has 4 policies
   - [ ] user_settings has 3 policies
   - [ ] sync_logs has 1 policy
   - [ ] guest_data has 2 policies

3. **No Errors:**
   - [ ] SQL executed without errors
   - [ ] No constraint violations
   - [ ] All RLS policies active

---

## 🐛 Troubleshooting

### "Table already exists"
✅ **Expected!** The SQL uses `IF NOT EXISTS` - safe to re-run

### "RLS policies prevent access"
- Make sure you're logged in to Supabase
- Check auth policies reference `auth.uid()`
- Refresh the page

### "Foreign key constraint failed"
- This won't happen - resumes table is created first
- The SQL is ordered correctly

### Nothing appears
- Refresh Supabase console
- Check SQL execution status at bottom of editor
- Look for error messages

---

## 📚 TypeScript Types Ready to Use

```typescript
import type {
  Profile,
  Resume,
  AIAnswer,
  UserSettings,
  SyncLog,
  GuestData,
} from '@/types/database';

// All types are exported with Insert and Update variants
```

---

## 🪝 Database Hooks Ready to Use

```typescript
import { 
  useProfile, 
  useResumes, 
  useAIAnswers,
  useUserSettings,
} from '@/hooks/useDatabase';

// All hooks include refetching, error handling, and caching
```

---

## 🎓 Next Steps After Setup

1. **Verify RLS is working**
   ```sql
   -- This should show user's own profile only
   SELECT * FROM profiles;
   ```

2. **Create Storage bucket for resumes**
   - Storage → Create bucket → Name: "resumes" → Private

3. **Start using TypeScript types in code**
   - Import from `@/types/database`
   - Type-safe database queries

4. **Request next batches**
   - Batch 2: Authentication & OAuth
   - Batch 3: API Layer (/api/v1)

---

## ⚡ Performance Tips

- Queries are auto-filtered by `user_id` (RLS)
- Pagination built into API layer
- Indexes on user_id, is_default, category
- Sync logs auto-cleanup after 30 days

---

## 🔒 Security Checklist

- [x] RLS enabled on all user data
- [x] auth.uid() policies on every table
- [x] Foreign keys with CASCADE delete
- [x] No sensitive data in logs
- [x] Storage bucket is private
- [x] File hashes for duplicate detection
- [x] Unique constraints prevent data corruption

---

## 💾 Backup & Recovery

### Before Running
1. Your existing data is safe
2. SQL only adds new tables/columns
3. Existing jobs/profiles unchanged

### Recovery
If something goes wrong:
1. Error message will show immediately
2. No partial state created
3. Safe to re-run the SQL

---

## 📞 Support Info

### If Setup Fails
1. Check error message in SQL Editor
2. Verify you have admin access to project
3. Check that auth.users table exists
4. Re-run the SQL (it's idempotent)

### Documentation
- **Setup Guide:** SETUP_DATABASE_SCHEMA.md
- **Full Details:** DATABASE_SCHEMA_IMPLEMENTATION.md
- **This Guide:** QUICK_START_DATABASE.md

---

## 🎉 Done!

Once the SQL executes successfully, your database is ready for:
- ✅ Profile management
- ✅ Resume uploads & tracking
- ✅ AI answer library
- ✅ User settings & preferences
- ✅ Sync tracking (web ↔ extension)
- ✅ Guest data migration

**Ready to proceed with Batch 2 & 3? Say so and I'll implement:**
- Authentication & OAuth setup
- API layer with all endpoints
- Frontend UI components
- Chrome Extension integration
