# Quick Fix Checklist - 3 Steps to Working App

## Current Status
- ✅ Code fixed and ready
- ⏳ Waiting for deployment
- ⏳ Waiting for environment variables

---

## Step 1: Set Vercel Environment Variables (5 minutes)

1. Go to: https://vercel.com/dashboard
2. Click on your project: **job-orbit-flax**
3. Click **Settings** → **Environment Variables**
4. Add these 3 variables:

### Variable 1: VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://dsbkjkwefszqqzukgdtk.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

### Variable 2: VITE_API_URL (MOST IMPORTANT!)
```
Name: VITE_API_URL
Value: https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
Environments: ✓ Production ✓ Preview ✓ Development
```

### Variable 3: VITE_SUPABASE_PUBLISHABLE_KEY
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt
Environments: ✓ Production ✓ Preview ✓ Development
```

5. Click **Save** after adding each variable

---

## Step 2: Deploy Code Changes (5 minutes)

### Option A: Git Push (Recommended)
```bash
git add .
git commit -m "Fix: Add /functions/v1/ to Edge Function URLs and improve error handling"
git push origin main
```

Vercel will auto-deploy.

### Option B: Manual Redeploy
1. Go to **Deployments** tab in Vercel
2. Find latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. **UNCHECK** "Use existing Build Cache"
5. Click **Redeploy**

---

## Step 3: Deploy Edge Functions (10 minutes)

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Make script executable
chmod +x deploy-edge-functions.sh

# Run deployment script (it will guide you through)
./deploy-edge-functions.sh
```

The script will:
- ✅ Check CLI is installed
- ✅ Login to Supabase
- ✅ Link your project
- ✅ Set secrets
- ✅ Deploy all 14 functions
- ✅ Test CORS
- ✅ Show results

---

## Verification (2 minutes)

### Test 1: Check URL in Console

1. Go to: https://job-orbit-flax.vercel.app/extension-auth
2. Open DevTools (F12)
3. Click "Continue with Google"
4. Look for this log:
   ```
   📡 Request URL: https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session
   ```
5. ✅ Should see `/functions/v1/` in URL

### Test 2: Check Network Request

1. DevTools → **Network** tab
2. Filter: "extension-session"
3. Look at Request URL

**Expected** (after Edge Function deployment):
```
Request URL: https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session
Method: OPTIONS
Status: 200 OK ✅

Request URL: https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session
Method: GET
Status: 200 OK or 401 Unauthorized ✅
```

### Test 3: Full Extension Auth Flow

1. Go to: https://job-orbit-flax.vercel.app/extension-auth
2. Click "Continue with Google"
3. Sign in with Google
4. Should see: "✅ Success! Extension connected"
5. Window auto-closes

---

## Troubleshooting

### Issue: URL still missing /functions/v1/

**Cause**: Environment variables not set or deployment didn't pick them up

**Fix**:
1. Verify env vars are set in Vercel Dashboard
2. Redeploy WITHOUT cache: Deployments → Redeploy → UNCHECK "Use existing Build Cache"

### Issue: 404 Not Found on OPTIONS

**Cause**: Edge Functions not deployed yet

**Fix**: Run `./deploy-edge-functions.sh`

### Issue: CORS Error

**Cause**: Edge Functions not deployed or deployed incorrectly

**Fix**: 
```bash
supabase functions list  # Check if deployed
supabase functions deploy  # Redeploy all
```

### Issue: PostCSS timeout during build

**Cause**: Transient network issue

**Fix**: Just retry the build:
```bash
npm run build
```

---

## Success Criteria

After completing all 3 steps:

- ✅ Vercel build succeeds
- ✅ Console shows correct URL with `/functions/v1/`
- ✅ OPTIONS request returns 200 OK
- ✅ Extension auth flow works
- ✅ No CORS errors
- ✅ No "Something went wrong" errors

---

## Time Estimate

- Step 1 (Env vars): 5 minutes
- Step 2 (Deploy code): 5 minutes (automatic)
- Step 3 (Edge Functions): 10 minutes
- Verification: 2 minutes

**Total**: ~20 minutes to fully working app! 🚀

---

## Need Help?

See these detailed guides:
- `VERCEL_ENV_FIX.md` - Vercel environment setup
- `DEPLOYMENT_GUIDE.md` - Edge Function deployment
- `URGENT_FIXES_APPLIED.md` - What was fixed

Or check console logs to see what URL is being called.
