# Complete Supabase Setup Guide

## ✅ Your Configuration

Your `.env` file is now configured with:

```env
VITE_SUPABASE_URL=https://dsbkjkwefszqqzukgdtk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=dsbkjkwefszqqzukgdtk
```

## 🚀 Step-by-Step Setup

### Step 1: Apply Database Migrations

You need to run the SQL migrations in your Supabase project:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/dsbkjkwefszqqzukgdtk
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20260114001546_dbb63a9a-b5cf-4d55-87f0-718fc59e5742.sql`
5. Click **Run**
6. Repeat for `supabase/migrations/20260115000000_landing_page_data.sql`

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref dsbkjkwefszqqzukgdtk

# Push migrations
supabase db push
```

### Step 2: Verify Tables Were Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see these tables:
   - ✅ `profiles`
   - ✅ `jobs`
   - ✅ `landing_stats` (NEW)
   - ✅ `testimonials` (NEW)

### Step 3: Verify Default Data

Check that default data was inserted:

#### landing_stats table should have:
- Active users: 10k+
- Jobs tracked: 250k+
- Success rate: 85%

#### testimonials table should have:
- Sarah Chen (Google)
- Mike Johnson (Apple)
- Emily Davis (Netflix)

### Step 4: Test the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173 and check:
- ✅ Landing page loads
- ✅ Statistics show (10k+, 250k+, 85%)
- ✅ Testimonials show (3 cards)
- ✅ No console errors

## 🔧 Troubleshooting

### Issue: "relation does not exist"

**Problem:** Tables haven't been created yet.

**Solution:** Run the migrations (Step 1 above)

### Issue: "Invalid API key"

**Problem:** Wrong anon key in .env file.

**Solution:** 
1. Go to Supabase Dashboard > Settings > API
2. Copy the `anon` `public` key
3. Update `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`
4. Restart dev server

### Issue: "No data showing on landing page"

**Problem:** Either migrations not run or RLS blocking access.

**Solution:**
1. Check tables exist in Table Editor
2. Check data exists in tables
3. Run this SQL to verify RLS policies:

```sql
-- Check landing_stats policy
SELECT * FROM pg_policies WHERE tablename = 'landing_stats';

-- Check testimonials policy
SELECT * FROM pg_policies WHERE tablename = 'testimonials';
```

Should show policies allowing public SELECT.

### Issue: "CORS error"

**Problem:** Supabase URL mismatch.

**Solution:**
1. Verify URL in `.env` matches your project
2. Check no trailing slash in URL
3. Restart dev server after changing `.env`

## 📊 Managing Data

### Update Statistics

```sql
-- Go to SQL Editor and run:
UPDATE landing_stats 
SET stat_value = '15k+' 
WHERE stat_key = 'active_users';

UPDATE landing_stats 
SET stat_value = '300k+' 
WHERE stat_key = 'jobs_tracked';

UPDATE landing_stats 
SET stat_value = '90%' 
WHERE stat_key = 'success_rate';
```

### Add New Testimonial

```sql
INSERT INTO testimonials (
  quote,
  author_name,
  author_role,
  author_company,
  rating,
  is_featured,
  display_order
) VALUES (
  'JobTracker helped me land my dream job in just 3 weeks!',
  'Alex Rivera',
  'Senior Developer',
  'Microsoft',
  5,
  true,
  4
);
```

### Hide/Show Testimonials

```sql
-- Hide a testimonial
UPDATE testimonials 
SET is_featured = false 
WHERE author_name = 'Alex Rivera';

-- Show a testimonial
UPDATE testimonials 
SET is_featured = true 
WHERE author_name = 'Alex Rivera';
```

### Reorder Items

```sql
-- Change display order (lower numbers appear first)
UPDATE landing_stats 
SET display_order = 1 
WHERE stat_key = 'success_rate';

UPDATE testimonials 
SET display_order = 1 
WHERE author_name = 'Sarah Chen';
```

## 🔒 Security Check

### Verify RLS is Enabled

Run this SQL:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

### Verify Policies

```sql
-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Should show:
- `landing_stats`: Public SELECT policy
- `testimonials`: Public SELECT policy (where is_featured = true)
- `jobs`: User-specific policies
- `profiles`: User-specific policies

## 🎯 Testing Checklist

- [ ] Migrations applied successfully
- [ ] Tables visible in Table Editor
- [ ] Default data exists in tables
- [ ] `.env` file has correct values
- [ ] Dev server starts without errors
- [ ] Landing page loads
- [ ] Statistics display correctly
- [ ] Testimonials display correctly
- [ ] No console errors
- [ ] Data updates reflect on page (after cache expires)

## 📝 Quick Reference

### Environment Variables (Vite)
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### React Query Cache Times
- Landing stats: 5 minutes
- Testimonials: 5 minutes
- User job stats: 1 minute

### Database Tables
- `landing_stats` - Public read
- `testimonials` - Public read (featured only)
- `jobs` - User-specific
- `profiles` - User-specific

## 🆘 Need Help?

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click **Logs** in sidebar
3. Select **Postgres Logs**
4. Look for errors

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Check Network tab for failed requests

### Verify Connection
Run the test script:
```bash
npx tsx test-supabase.ts
```

This will test:
- Environment variables
- Database connection
- Table access
- Data retrieval

## ✅ Success Indicators

When everything is working:

1. **Landing Page:**
   - Shows "10k+ Active users"
   - Shows "250k+ Jobs tracked"
   - Shows "85% Success rate"
   - Shows 3 testimonial cards
   - No loading spinners stuck
   - No error messages

2. **Console:**
   - No red errors
   - React Query shows successful fetches
   - Supabase client initialized

3. **Network Tab:**
   - Successful requests to Supabase
   - Status 200 responses
   - Data returned in responses

## 🎉 You're All Set!

Once you complete the steps above, your application will:
- ✅ Connect to Supabase
- ✅ Fetch dynamic data
- ✅ Display statistics and testimonials
- ✅ Cache data for performance
- ✅ Update automatically when data changes

The landing page is now fully dynamic and managed through your Supabase database!
