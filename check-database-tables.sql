-- Database Tables Diagnostic Script
-- Run this in Supabase SQL Editor to see what tables exist

-- 1. List all tables in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Count records in each table
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Check which migrations have been applied
SELECT 
  version,
  name,
  applied_at
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- 4. Check RLS status for all tables
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. List all columns for each table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
