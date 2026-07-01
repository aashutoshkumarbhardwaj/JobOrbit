# Edge Functions & Security Implementation

## 📋 Overview

Job Orbit uses **Supabase Edge Functions** for all API operations and **Row-Level Security (RLS)** policies for data protection. This ensures:
- ✅ Chrome Extension never connects directly to the database
- ✅ All API calls require valid JWT tokens
- ✅ Users can only access their own data
- ✅ Zero database credential exposure
- ✅ Secure, scalable serverless architecture

## 🏗️ Edge Functions Architecture

### Functions Overview

All Edge Functions are located in `supabase/functions/` and automatically deployed to:
```
https://<project-id>.supabase.co/functions/v1/<function-name>
```

### Available Functions

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| profile-get | GET | `/profile` | Fetch current user's profile |
| profile-patch | PATCH | `/profile` | Update current user's profile |
| settings-get | GET | `/settings` | Fetch current user's settings |
| settings-patch | PATCH | `/settings` | Update current user's settings |
| resumes-get | GET | `/resumes` | Fetch all resumes for user |
| resumes-post | POST | `/resumes` | Create new resume |
| answers-get | GET | `/answers` | Fetch all AI answers (with filters) |
| answers-post | POST | `/answers` | Create new AI answer |
| applications-get | GET | `/applications` | Fetch job applications (with pagination) |
| applications-post | POST | `/applications` | Create new job application |
| applications-patch | PATCH | `/applications/:id` | Update application status |

## 🔐 Security Model

### Authentication Flow

```
Chrome Extension / Web App
    ↓
Request with Authorization Header
    Bearer <JWT_TOKEN>
    ↓
Edge Function receives request
    ↓
Supabase validates JWT token
    ↓
Extract user_id from token (auth.uid())
    ↓
All database queries filtered by user_id
    ↓
RLS policies enforce auth.uid() = user_id
    ↓
Only user's own data is accessible
```

### No Direct Database Access

```
❌ NOT ALLOWED:
Chrome Extension → Supabase Database (direct connection)

✅ CORRECT:
Chrome Extension → Edge Function → Supabase Database
                    (with JWT token verification)
```

## 🛡️ Row-Level Security (RLS)

### What is RLS?

Row-Level Security ensures that database queries are automatically filtered based on the current user:

```sql
-- Example: RLS policy on profiles table
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- This means:
-- SELECT * FROM profiles;
-- Only returns rows where auth.uid() (current user) = user_id
```

### RLS Policies by Table

Every data table has 4 policies (SELECT, INSERT, UPDATE, DELETE):

#### Profiles Table
```
- SELECT: User can view their own profile only
- INSERT: User can create profile only for themselves
- UPDATE: User can update their own profile only
- DELETE: User can delete their own profile only
```

#### Jobs Table (Applications)
```
- SELECT: User can view their own job applications only
- INSERT: User can create applications only for themselves
- UPDATE: User can update their own applications only
- DELETE: User can delete their own applications only
```

#### Resumes Table
```
- SELECT: User can view their own resumes only
- INSERT: User can upload resumes only for themselves
- UPDATE: User can update their own resumes only
- DELETE: User can delete their own resumes only
```

#### AI Answers Table
```
- SELECT: User can view their own answers only
- INSERT: User can create answers only for themselves
- UPDATE: User can update their own answers only
- DELETE: User can delete their own answers only
```

#### User Settings Table
```
- SELECT: User can view their own settings only
- INSERT: User can create settings only for themselves
- UPDATE: User can update their own settings only
- DELETE: User can delete their own settings only
```

#### Sync Logs Table
```
- SELECT: User can view their own sync logs only
- INSERT: User can create logs only for themselves
- UPDATE: User can update their own logs only
- DELETE: User can delete their own logs only
```

#### Guest Data Table
```
- SELECT: User can view their own guest data only
- INSERT: User can create guest data only for themselves
- UPDATE: User can update their own guest data only
- DELETE: User can delete their own guest data only
```

#### Notifications Table
```
- SELECT: User can view their own notifications only
- INSERT: User can create notifications only for themselves
- UPDATE: User can update their own notifications only
- DELETE: User can delete their own notifications only
```

### Public Tables (No RLS)

```
- landing_stats: Publicly readable (landing page data)
- testimonials: Publicly readable (landing page testimonials)
```

## 🚀 Deployment

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy profile-get

# Deploy with specific .env
supabase functions deploy --project-ref <project-id>
```

### Deploy RLS Migration

```bash
# Apply RLS enforcement migration
supabase db push

# Or in Supabase Dashboard:
1. Go to SQL Editor
2. Create new query
3. Paste the contents of: supabase/migrations/20260120000000_enforce_rls_security.sql
4. Click Run
```

## 📱 Using Edge Functions

### From Web App

```typescript
import { supabase } from '@/lib/supabase'

// Get profile via Edge Function
const { data, error } = await supabase.functions.invoke('profile-get')

// Update profile via Edge Function
const { data, error } = await supabase.functions.invoke('profile-patch', {
  body: {
    first_name: 'John',
    last_name: 'Doe',
  },
})

// Get resumes
const { data: resumes } = await supabase.functions.invoke('resumes-get')

// Create new resume
const { data: resume } = await supabase.functions.invoke('resumes-post', {
  body: {
    title: 'Main Resume',
    file_url: 'https://...',
    file_name: 'resume.pdf',
    file_size: 12345,
  },
})
```

### From Chrome Extension

```typescript
// Use same Supabase client
const { data: profile } = await supabase.functions.invoke('profile-get')

// Extension has access to same JWT token as web app
// All requests are automatically authenticated
```

## 🔌 API Response Format

All Edge Functions return standardized responses:

### Success Response (2xx)

```json
{
  "success": true,
  "data": { /* actual data */ },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "error": "Error message"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  },
  "meta": { /* ... */ }
}
```

## 🔐 Key Security Features

### 1. JWT Token Validation

Every request includes:
```
Authorization: Bearer <JWT_TOKEN>
```

Edge Function validates the token and extracts `user_id`.

### 2. User ID Enforcement

All queries include:
```sql
WHERE user_id = auth.uid()
```

This is enforced at **two levels**:
1. Edge Function level (explicit WHERE clause)
2. Database level (RLS policy)

### 3. No Credentials Exposure

- ❌ Database credentials NEVER exposed to frontend
- ❌ Service role keys NEVER exposed to frontend
- ❌ Direct database connections NEVER allowed
- ✅ Only JWT tokens transmitted to client

### 4. CORS Protection

All Edge Functions include CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: authorization, content-type
```

### 5. Automatic Token Refresh

Supabase SDK automatically:
- Detects token expiration (401 responses)
- Refreshes token silently
- Retries request with new token

## ⚠️ Security Best Practices

### DO ✅

```typescript
// DO: Use Edge Functions for all API calls
const { data } = await supabase.functions.invoke('profile-get')

// DO: Include Authorization header
const headers = {
  'Authorization': `Bearer ${session.access_token}`
}

// DO: Validate user_id matches on both client and server
// Edge Function already does this via RLS

// DO: Never store service role keys in frontend
// Only use publishable key and user JWT tokens
```

### DON'T ❌

```typescript
// DON'T: Connect directly to Supabase database
// This exposes credentials and bypasses RLS
const client = new postgres.Client({
  connectionString: DATABASE_URL
})

// DON'T: Expose service role key to frontend
process.env.SUPABASE_SERVICE_ROLE_KEY

// DON'T: Query tables without RLS in place
// Always verify RLS policies exist

// DON'T: Trust client-side user_id filtering
// Always enforce server-side via auth.uid()
```

## 🧪 Testing Security

### Test RLS Policy

```sql
-- Test as User A
COPY auth.jwt('{"sub":"user-a-id","role":"authenticated"}');

SELECT * FROM profiles;
-- Result: Only returns profiles where user_id = 'user-a-id'

-- Test as User B
-- Result: Different set of profiles (user-b-id)
```

### Test Edge Function Authorization

```bash
# Without token - should fail
curl https://<project>.supabase.co/functions/v1/profile-get
# Response: 401 Unauthorized

# With valid token - should succeed
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  https://<project>.supabase.co/functions/v1/profile-get
# Response: 200 { success: true, data: {...} }
```

## 📊 Monitoring

### Check RLS Policies

```sql
-- List all RLS policies
SELECT * FROM pg_policies 
WHERE tablename IN ('profiles', 'jobs', 'resumes', 'ai_answers', 'user_settings')
ORDER BY tablename, policyname;
```

### Monitor Edge Function Usage

```
Supabase Dashboard → Edge Functions → Function Metrics
- Invocations per minute
- Error rate
- Latency
```

### View Audit Logs

```
Supabase Dashboard → Logs → Edge Functions
- Request logs with timestamps
- Error messages
- Performance metrics
```

## 🔄 Environment Variables

### Required in Supabase Project

```
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> (NEVER expose to frontend)
```

### In Frontend .env

```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

## 📝 Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Missing or invalid JWT token

**Solution**:
```typescript
// Ensure token is included
const { data: { session } } = await supabase.auth.getSession()
const headers = {
  'Authorization': `Bearer ${session?.access_token}`
}
```

### Issue: RLS Policy Denies Access

**Cause**: Trying to access another user's data

**Solution**: RLS is working correctly. User can only access their own data.

### Issue: Edge Function Returns 500

**Cause**: Server error in function code

**Solution**: Check Edge Function logs in Supabase Dashboard

### Issue: CORS Error

**Cause**: Missing CORS headers

**Solution**: All Edge Functions include CORS headers. If error persists, check browser console.

## 🔗 Related Documentation

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [JWT Authentication](https://supabase.com/docs/guides/auth)
- [Postgres Row Security](https://www.postgresql.org/docs/current/sql-createpolicy.html)

## 📋 Checklist

Before deploying to production:

- [ ] All Edge Functions deployed
- [ ] RLS migration applied to database
- [ ] JWT token validation working
- [ ] CORS configured correctly
- [ ] Credentials not exposed in frontend code
- [ ] RLS policies tested for all users
- [ ] Error handling implemented
- [ ] Monitoring and logging enabled
- [ ] Rate limiting configured (if needed)
- [ ] Security audit completed
