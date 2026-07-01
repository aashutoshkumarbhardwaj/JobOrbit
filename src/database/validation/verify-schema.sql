-- Database Schema Verification Script
-- Run this after executing the migration to verify all tables and policies are created correctly

-- ============================================================================
-- 1. VERIFY TABLES EXIST
-- ============================================================================

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings', 'sync_logs', 'guest_data') 
    THEN 'EXPECTED' 
    ELSE 'UNKNOWN' 
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings', 'sync_logs', 'guest_data')
ORDER BY table_name;

-- Expected output: 7 rows with EXPECTED status

-- ============================================================================
-- 2. VERIFY PROFILES TABLE COLUMNS
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected: Original columns + ~30 new columns

-- ============================================================================
-- 3. VERIFY JOBS TABLE COLUMNS
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
WHERE column_name IN (
  'cover_letter', 'resume_id', 'extension_id', 'interview_type',
  'recruiter_name', 'recruiter_email', 'recruiter_phone',
  'company_notes', 'job_description', 'employment_type'
)
ORDER BY column_name;

-- Expected: 9 rows (all new columns)

-- ============================================================================
-- 4. VERIFY RESUMES TABLE STRUCTURE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'resumes'
ORDER BY ordinal_position;

-- Expected: 15 columns including id, user_id, file_url, is_default, etc.

-- ============================================================================
-- 5. VERIFY AI_ANSWERS TABLE STRUCTURE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ai_answers'
ORDER BY ordinal_position;

-- Expected: 13 columns including id, user_id, title, content, category, etc.

-- ============================================================================
-- 6. VERIFY USER_SETTINGS TABLE STRUCTURE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_settings'
ORDER BY ordinal_position;

-- Expected: 21 columns for settings

-- ============================================================================
-- 7. VERIFY SYNC_LOGS TABLE STRUCTURE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sync_logs'
ORDER BY ordinal_position;

-- Expected: 11 columns

-- ============================================================================
-- 8. VERIFY GUEST_DATA TABLE STRUCTURE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'guest_data'
ORDER BY ordinal_position;

-- Expected: 9 columns

-- ============================================================================
-- 9. VERIFY RLS IS ENABLED
-- ============================================================================

SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings', 'sync_logs', 'guest_data')
ORDER BY tablename;

-- Expected: All tables have rowsecurity = TRUE

-- ============================================================================
-- 10. VERIFY RLS POLICIES EXIST
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings', 'sync_logs', 'guest_data')
ORDER BY tablename, policyname;

-- Expected: 23 total policies across all tables

-- ============================================================================
-- 11. VERIFY INDEXES EXIST
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('resumes', 'ai_answers', 'sync_logs')
ORDER BY tablename, indexname;

-- Expected: At least 6 indexes

-- ============================================================================
-- 12. VERIFY FOREIGN KEYS
-- ============================================================================

SELECT
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
AND column_name LIKE '%_id'
AND foreign_table_name IS NOT NULL
ORDER BY table_name, column_name;

-- Expected: Foreign keys for user_id references and resume_id in jobs

-- ============================================================================
-- 13. VERIFY UNIQUE CONSTRAINTS
-- ============================================================================

SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
AND constraint_type = 'UNIQUE'
ORDER BY table_name, constraint_name;

-- Expected: UNIQUE constraints on user_id (most tables) and (user_id, is_default) for resumes

-- ============================================================================
-- 14. VERIFY DEFAULT VALUES
-- ============================================================================

SELECT 
  table_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_default IS NOT NULL
AND table_name IN ('resumes', 'ai_answers', 'user_settings', 'sync_logs')
ORDER BY table_name, column_name;

-- Expected: Default values like NOW(), FALSE, TRUE, 0, 'auto', etc.

-- ============================================================================
-- 15. TABLE SIZE & ROW COUNTS (Current State)
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = schemaname AND table_name = tablename) as exists
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings', 'sync_logs', 'guest_data')
ORDER BY tablename;

-- Expected: Empty tables (unless you have existing data)

-- ============================================================================
-- 16. POLICY DETAILS FOR DEBUGGING
-- ============================================================================

-- Check profiles policies specifically
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check resumes policies specifically
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'resumes'
ORDER BY policyname;

-- ============================================================================
-- SUMMARY CHECKS (Run these individually for quick verification)
-- ============================================================================

-- Check 1: All tables exist
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings', 'sync_logs', 'guest_data');
-- Expected: 7

-- Check 2: All policies exist
SELECT COUNT(*) as policy_count FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings', 'sync_logs', 'guest_data');
-- Expected: >= 23

-- Check 3: All indexes exist
SELECT COUNT(*) as index_count FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';
-- Expected: >= 6

-- Check 4: RLS enabled on all tables
SELECT COUNT(*) as rls_count FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = TRUE
AND tablename IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings', 'sync_logs', 'guest_data');
-- Expected: 7

-- ============================================================================
-- QUICK VALIDATION SCRIPT
-- ============================================================================
-- Run this query to get a complete status report:

WITH table_check AS (
  SELECT 
    'profiles' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') as exists,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count
  UNION ALL
  SELECT 'jobs', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs'),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'jobs')
  UNION ALL
  SELECT 'resumes', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resumes'),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'resumes')
  UNION ALL
  SELECT 'ai_answers', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_answers'),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_answers')
  UNION ALL
  SELECT 'user_settings', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings'),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_settings')
  UNION ALL
  SELECT 'sync_logs', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sync_logs'),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'sync_logs')
  UNION ALL
  SELECT 'guest_data', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guest_data'),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'guest_data')
)
SELECT 
  table_name,
  CASE WHEN exists THEN '✓ EXISTS' ELSE '✗ MISSING' END as status,
  policy_count as policies,
  CASE WHEN policy_count > 0 THEN '✓ SECURED' ELSE '✗ NO RLS' END as security
FROM table_check
ORDER BY table_name;

-- ============================================================================
-- End of Verification Script
-- ============================================================================
