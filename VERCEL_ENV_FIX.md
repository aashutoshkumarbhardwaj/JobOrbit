# Vercel Environment Variable Fix

## Problem

The web app is making requests to the wrong URL:

**Current (WRONG)**:
```
https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session
```

**Expected (CORRECT)**:
```
https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session
```

This causes **404 Not Found** errors because Edge Functions MUST be accessed via `/functions/v1/` path.

---

## Root Cause

`VITE_API_URL` environment variable is missing or incorrect in Vercel production.

---

## Quick Fix

### Step 1: Add Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: **job-orbit-flax**
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://dsbkjkwefszqqzukgdtk.supabase.co` | Production, Preview, Development |
| `VITE_API_URL` | `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt` | Production, Preview, Development |

**CRITICAL**: `VITE_API_URL` MUST include `/functions/v1` at the end!

### Step 2: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Check "Use existing Build Cache" is **UNCHECKED**
5. Click **Redeploy**

---

## Verification

After redeployment, check browser console:

### Before Fix (WRONG)
```
GET https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session
❌ 404 Not Found
```

### After Fix (CORRECT)
```
GET https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session
✅ 200 OK (or 401 if Edge Function not deployed)
```

---

## Alternative: Use vercel.json

Create `vercel.json` in project root:

```json
{
  "env": {
    "VITE_SUPABASE_URL": "https://dsbkjkwefszqqzukgdtk.supabase.co",
    "VITE_API_URL": "https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1",
    "VITE_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt"
  }
}
```

**Note**: This exposes values in git. Prefer Vercel Dashboard for secrets.

---

## Code Changes Made

Updated `src/pages/AuthCallback.tsx` to:
1. Log the full URL being called
2. Add fallback URL if `VITE_API_URL` is missing
3. Handle trailing slashes correctly

```typescript
const apiUrl = import.meta.env.VITE_API_URL || 'https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1'
const fullUrl = apiUrl.endsWith('/') ? `${apiUrl}extension-session` : `${apiUrl}/extension-session`
console.log('📡 Request URL:', fullUrl)
```

Now you can check the console to see what URL is actually being called.

---

## Test After Fix

### 1. Check Environment Variable in Console

Open browser console on deployed site and run:
```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
```

**Expected**: `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`

### 2. Check Network Request

1. Open DevTools → Network tab
2. Filter by "extension-session"
3. Click on request
4. Check **Request URL**

**Expected**: `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session`

### 3. Check CORS Preflight

Look for **OPTIONS** request to same URL.

**Expected**: 
- Status: `200 OK` (if Edge Function deployed)
- Status: `404 Not Found` (if Edge Function NOT deployed yet)

---

## Still Not Working?

If URL is correct but still getting errors:

### Error: 404 Not Found
**Cause**: Edge Functions not deployed to Supabase  
**Fix**: Deploy Edge Functions (see DEPLOYMENT_GUIDE.md)

```bash
brew install supabase/tap/supabase
./deploy-edge-functions.sh
```

### Error: CORS Policy
**Cause**: Either:
1. Edge Functions not deployed
2. OPTIONS preflight failing

**Fix**: Deploy Edge Functions with proper CORS headers (already in code)

### Error: 401 Unauthorized
**Good news!** This means:
- ✅ URL is correct
- ✅ Edge Function is deployed
- ✅ CORS is working
- ⚠️  Just need valid auth token

This is expected behavior when not logged in.

---

## Summary

**Problem**: `VITE_API_URL` missing in Vercel → Wrong URL → 404  
**Solution**: Add `VITE_API_URL` in Vercel Dashboard → Redeploy  
**Result**: Correct URL with `/functions/v1/` path

After this fix, requests will go to the correct URL! 🚀
