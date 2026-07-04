# Edge Functions Deployment Checklist

**Date**: July 5, 2026  
**Status**: Ready for deployment

---

## Pre-Deployment Verification

### ✅ Code Changes Complete

- [x] Created `supabase/functions/_shared/extension-token.ts`
- [x] Updated `supabase/functions/extension-session/index.ts` imports
- [x] Fixed CORS headers to include `apikey` and `x-client-info`
- [x] Verified all 14 Edge Functions follow consistent patterns
- [x] Removed duplicate code

### ✅ Architecture Verified

- [x] All imports resolve correctly
- [x] Shared modules properly organized
- [x] Authentication flow validated
- [x] CORS configuration complete
- [x] OPTIONS handled before authentication in all functions
- [x] Error responses include CORS headers

---

## Local Testing (Before Deployment)

### Step 1: Start Supabase

```bash
# Start Docker if not running
open -a Docker

# Wait for Docker to start, then:
supabase start
```

**Expected Output**:
```
Started supabase local development setup.
```

### Step 2: Test Function Bundling

```bash
# This will validate all functions can be bundled
supabase functions serve
```

**Expected**: No bundling errors, all 14 functions load

### Step 3: Test CORS Headers

```bash
# Run the CORS test script
./test-cors.sh
```

**Expected**: All tests pass (green checkmarks)

### Step 4: Test Specific Endpoints

```bash
# Get Supabase URL and key
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

# Test profile-get (standard auth)
curl -X GET "${SUPABASE_URL}/functions/v1/profile-get" \
  -H "Origin: http://localhost:5173" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -v

# Test extension-session (the function we fixed)
curl -X GET "${SUPABASE_URL}/functions/v1/extension-session" \
  -H "Origin: http://localhost:5173" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -v
```

**Expected**:
- Status 200 or 401 (not 500)
- CORS headers present in response
- No "Module not found" errors

---

## Production Deployment

### Step 1: Commit Changes

```bash
git add .
git commit -m "fix: create missing extension-token shared module and consolidate utilities"
git push origin main
```

### Step 2: Deploy Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually to test
supabase functions deploy extension-session
supabase functions deploy extension-logout
supabase functions deploy extension-refresh
```

**Expected**: "Deployed function successfully"

### Step 3: Verify Deployment

```bash
# List all deployed functions
supabase functions list
```

**Expected**: All 14 functions listed with status "deployed"

### Step 4: Test Production Endpoints

```bash
# Get production URL from Supabase dashboard
PROD_URL="https://your-project.supabase.co"

# Test profile-get
curl -X OPTIONS "${PROD_URL}/functions/v1/profile-get" \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization, apikey, x-client-info" \
  -v

# Test extension-logout (the fixed function)
curl -X OPTIONS "${PROD_URL}/functions/v1/extension-logout" \
  -H "Origin: chrome-extension://abc123" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: x-extension-token, authorization" \
  -v
```

**Expected**: 200 OK with CORS headers

---

## Post-Deployment Testing

### Web App Testing

1. **Login Flow**
   ```
   ✓ Open https://job-orbit-flax.vercel.app
   ✓ Click "Sign in with Google"
   ✓ Complete OAuth flow
   ✓ Verify dashboard loads
   ```

2. **API Calls**
   ```
   ✓ Navigate to Applications page
   ✓ Create new application
   ✓ Update application status
   ✓ Delete application
   ✓ Check browser console for CORS errors (should be none)
   ```

3. **Profile Operations**
   ```
   ✓ View profile
   ✓ Update profile
   ✓ Upload resume
   ```

### Chrome Extension Testing

1. **Extension Login**
