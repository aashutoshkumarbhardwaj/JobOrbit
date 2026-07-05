# Edge Functions Deployment & CORS Fix

**Status**: ⚠️ CRITICAL - Edge Functions not deployed or CORS misconfigured

---

## The Problem

Your web app is making requests to Edge Functions, but getting CORS errors:

```
Access to fetch at 'https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**All Edge Functions failing with 500 errors:**
- `extension-session` - CORS blocked
- `settings-get` - 500 error
- `profile-get` - 500 error  
- `answers-get` - 500 error
- `resumes-get` - 500 error

---

## Root Cause

1. **Edge Functions not deployed** to Supabase
2. OR Edge Functions deployed but **CORS headers missing**
3. OR Edge Functions deployed but **crashing on startup**

---

## Solution Steps

### Step 1: Deploy Edge Functions to Supabase

You need to deploy the Edge Functions we created. They exist in your code but aren't deployed to Supabase yet.

#### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or with npm
npm install -g supabase
```

#### Login to Supabase

```bash
supabase login
```

This will open a browser for authentication.

#### Link Your Project

```bash
supabase link --project-ref dsbkjkwefszqqzukgdtk
```

(Your project ref is in the error: `dsbkjkwefszqqzukgdtk`)

#### Deploy ALL Edge Functions

```bash
# Deploy all functions at once
supabase functions deploy
```

Or deploy individually:

```bash
supabase functions deploy extension-session
supabase functions deploy extension-logout
supabase functions deploy extension-refresh
supabase functions deploy profile-get
supabase functions deploy profile-patch
supabase functions deploy settings-get
supabase functions deploy settings-patch
supabase functions deploy applications-get
supabase functions deploy applications-post
supabase functions deploy applications-patch
supabase functions deploy resumes-get
supabase functions deploy resumes-post
supabase functions deploy answers-get
supabase functions deploy answers-post
```

---

### Step 2: Set Edge Function Secrets

Edge Functions need environment variables:

```bash
# Set the extension token secret
supabase secrets set EXTENSION_TOKEN_SECRET=your-secret-key-here

# Verify secrets are set
supabase secrets list
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

Use this output as your `EXTENSION_TOKEN_SECRET`.

---

### Step 3: Verify Deployment

#### Check if functions are deployed

```bash
supabase functions list
```

You should see all 14 functions listed.

#### Test a function

```bash
# Test OPTIONS (CORS preflight)
curl -X OPTIONS https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization, apikey" \
  -v
```

**Expected**: Should return 200 OK with CORS headers

---

### Step 4: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Edge Functions" in sidebar
4. You should see all 14 functions listed
5. Click on each function to see logs and status

---

## Alternative: Deploy via Dashboard

If CLI doesn't work, you can deploy via Supabase Dashboard:

1. Go to your project dashboard
2. Click "Edge Functions"
3. Click "Deploy new function"
4. Upload the function code
5. Set environment variables in "Secrets"

---

## Verification Checklist

After deployment:

- [ ] All 14 functions show as "deployed" in dashboard
- [ ] `EXTENSION_TOKEN_SECRET` is set in secrets
- [ ] OPTIONS request returns 200 OK with CORS headers
- [ ] GET request with valid token returns data (not 500)
- [ ] No CORS errors in browser console
- [ ] Extension auth flow works
- [ ] Dashboard loads user data

---

## Quick Test Commands

### Test CORS (should return 200)

```bash
curl -X OPTIONS \
  https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

### Test Function (should return 401, not 500)

```bash
curl -X GET \
  https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -H "Authorization: Bearer test" \
  -v
```

**Expected**: 401 Unauthorized (not 500 Server Error)

---

## Common Issues

### Issue 1: "Function not found"

**Cause**: Functions not deployed  
**Fix**: Run `supabase functions deploy`

### Issue 2: "500 Internal Server Error"

**Cause**: Missing environment variables or code error  
**Fix**: 
1. Check function logs: `supabase functions logs <function-name>`
2. Set secrets: `supabase secrets set EXTENSION_TOKEN_SECRET=...`

### Issue 3: "CORS error"

**Cause**: OPTIONS not handled or wrong origin  
**Fix**: Redeploy functions (CORS code is already correct)

### Issue 4: "Cannot read property 'supabase'"

**Cause**: Missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`  
**Fix**: These are automatically set by Supabase, no action needed

---

## What the Web App Expects

Your web app is trying to call:

1. `GET /extension-session` - Create extension session token
2. `GET /profile-get` - Fetch user profile  
3. `GET /settings-get` - Fetch user settings
4. `GET /resumes-get` - Fetch user resumes
5. `GET /answers-get` - Fetch AI answers

**All of these need to be deployed and working!**

---

## Expected Result After Fix

```
✅ extension-session: 200 OK (returns token)
✅ profile-get: 200 OK (returns profile data)
✅ settings-get: 200 OK (returns settings)
✅ resumes-get: 200 OK (returns resumes)
✅ answers-get: 200 OK (returns answers)
✅ No CORS errors in console
✅ Extension auth works
✅ Dashboard loads successfully
```

---

## Summary

**Problem**: Edge Functions exist in code but NOT deployed to Supabase  
**Solution**: Deploy them using Supabase CLI  
**Commands**:
```bash
supabase login
supabase link --project-ref dsbkjkwefszqqzukgdtk
supabase secrets set EXTENSION_TOKEN_SECRET=$(openssl rand -base64 32)
supabase functions deploy
```

**After deployment, your app will work perfectly!** 🚀
