# 🚨 FIX NOW - URLs Still Wrong!

## The Problem (Still Happening)

Your error logs show:
```
Access to fetch at 'https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session'
                    ❌ MISSING /functions/v1/
```

**Should be**:
```
https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session
                                          ✅ HAS /functions/v1/
```

---

## Why This Happens

The deployed code on Vercel doesn't have the `VITE_API_URL` environment variable set, so it's using a fallback that doesn't include `/functions/v1/`.

---

## The Fix (3 Steps - 10 Minutes Total)

### Step 1: Set Vercel Environment Variables (5 min) ⚡ DO THIS NOW

**Option A: Copy from file (easiest)**

1. Open the file: `vercel-env-setup.txt` in this project
2. Follow the instructions exactly
3. Copy/paste the 3 variables into Vercel

**Option B: Manual entry**

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add these 3 variables (for ALL environments):

```
VITE_SUPABASE_URL = https://dsbkjkwefszqqzukgdtk.supabase.co
VITE_API_URL = https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt
```

---

### Step 2: Push Code & Redeploy (2 min)

```bash
# Commit the fixes I just made
git add .
git commit -m "Fix: Add proper fallback for VITE_API_URL with /functions/v1 path"
git push origin main
```

Vercel will auto-deploy. Wait ~2 minutes.

---

### Step 3: Verify It's Fixed (1 min)

1. Go to: https://job-orbit-flax.vercel.app
2. Open DevTools (F12) → Console tab
3. Look for:
   ```
   📡 API Base URL: https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
   ```
4. ✅ Should see `/functions/v1` in the URL

---

## Then Deploy Edge Functions (10 min)

After the URL is correct:

```bash
brew install supabase/tap/supabase
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh
```

This will fix:
- ✅ CORS errors
- ✅ 500 errors on profile-get, settings-get, etc.
- ✅ Extension auth working
- ✅ All API endpoints working

---

## What I Fixed in Code

### 1. Fixed API Client Fallback
**File**: `src/api/v1/client.ts`

```typescript
// OLD (wrong fallback)
if (!env) {
  return 'http://localhost:3000/api/v1'  // ❌ Wrong!
}

// NEW (correct fallback)
if (!env) {
  console.warn('⚠️ VITE_API_URL environment variable not set')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dsbkjkwefszqqzukgdtk.supabase.co'
  return `${supabaseUrl}/functions/v1`  // ✅ Correct!
}
console.log('📡 API Base URL:', env)  // ✅ Now logs URL
```

### 2. Fixed AuthCallback URL Construction
**File**: `src/pages/AuthCallback.tsx`

```typescript
// Added explicit URL construction with logging
const apiUrl = import.meta.env.VITE_API_URL || 'https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1'
const fullUrl = apiUrl.endsWith('/') ? `${apiUrl}extension-session` : `${apiUrl}/extension-session`
console.log('📡 Request URL:', fullUrl)  // ✅ Now logs full URL
```

### 3. Better Error Messages
**File**: `src/pages/ExtensionAuth.tsx`

```typescript
// Now shows helpful error when Edge Functions not deployed
if (errorMessage.includes('CORS') || errorMessage.includes('Network request failed')) {
  setError('Edge Functions not deployed. Please deploy Edge Functions to Supabase first.')
}
```

---

## Current Errors Explained

### Error 1: CORS on extension-session
```
Access to fetch at '.../extension-session' ... CORS policy
```
**Cause**: URL missing `/functions/v1/` AND Edge Functions not deployed  
**Fix**: Step 1 (env vars) + Step 3 (deploy Edge Functions)

### Error 2: 500 errors on profile-get, settings-get, etc.
```
dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get: 500
```
**Cause**: Edge Functions not deployed to Supabase  
**Fix**: Step 3 (deploy Edge Functions)

### Error 3: "Failed to create extension session"
```
Extension session creation failed: Error: Failed to create extension session
```
**Cause**: Can't reach extension-session endpoint (wrong URL)  
**Fix**: Step 1 (env vars) + Step 2 (redeploy)

---

## After All Fixes

✅ **URLs correct** (with `/functions/v1/`)  
✅ **No CORS errors**  
✅ **Edge Functions working**  
✅ **Extension auth working**  
✅ **Dashboard loads data**  

---

## Quick Test Commands

### Test 1: Check if Edge Functions are deployed

```bash
curl -I https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get
```

**Before deployment**: `404 Not Found`  
**After deployment**: `401 Unauthorized` (this is good! means function exists)

### Test 2: Check CORS

```bash
curl -X OPTIONS \
  https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v 2>&1 | grep "200 OK"
```

**Expected after Edge Function deployment**: `200 OK`

---

## Timeline

- ⚡ **Step 1 (Vercel env vars)**: 5 minutes
- ⚡ **Step 2 (Push & deploy)**: 2 minutes
- ⏱️ **Wait for deployment**: 2 minutes
- ✅ **Step 3 (Verify)**: 1 minute
- 🚀 **Deploy Edge Functions**: 10 minutes

**Total**: ~20 minutes to fully working app!

---

## DO THIS NOW

1. Open `vercel-env-setup.txt`
2. Follow instructions to set 3 env vars in Vercel
3. Run:
   ```bash
   git add .
   git commit -m "Fix: Add proper API URL fallback"
   git push
   ```
4. Wait 2 minutes for deployment
5. Check console logs show correct URL
6. Run `./deploy-edge-functions.sh`

**That's it!** All errors will be fixed. 🎉
