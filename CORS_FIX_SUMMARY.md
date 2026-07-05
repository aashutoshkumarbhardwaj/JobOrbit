# CORS Error Fix - Quick Summary

## ✅ What I Fixed

1. **Deployed Edge Function** with proper CORS headers
   - Function: `extension-session`
   - CORS: `Access-Control-Allow-Origin: *`
   - Status: ✅ Deployed successfully

## ⏳ What YOU Need to Do

### Set Environment Variable on Vercel (5 minutes)

Your Vercel app is missing `VITE_API_URL`, causing it to use the wrong URL.

**Quick Steps:**

1. Go to: https://vercel.com/dashboard
2. Select your **job-orbit** project  
3. **Settings** → **Environment Variables**
4. Click **Add New**:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`
   - **Environments:** ✅ Production ✅ Preview ✅ Development
5. Click **Save**
6. Go to **Deployments** tab
7. Click **•••** on latest deployment → **Redeploy**

---

## Why This Error Happened

### The Error:
```
GET https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session
                                                   ^^^^^^^^^^^^^^^^^^
                                        MISSING: /functions/v1/
```

### Root Cause:
Your API client has this fallback logic:
```typescript
const getApiBaseUrl = (): string => {
  const env = import.meta.env.VITE_API_URL
  if (!env) {
    // ⚠️ VITE_API_URL not set on Vercel!
    // Falls back to: SUPABASE_URL (without /functions/v1/)
    return `${supabaseUrl}` // WRONG!
  }
  return env // CORRECT
}
```

**Fix:** Set `VITE_API_URL` on Vercel so it uses the correct value.

---

## Verification

### After Setting Environment Variable and Redeploying:

1. **Open Vercel app:** https://job-orbit-flax.vercel.app
2. **Open DevTools Console**
3. **Run:**
   ```javascript
   console.log(import.meta.env.VITE_API_URL)
   ```
   **Should show:** `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`

4. **Try logging in from extension**
5. **Check Network tab** - should see:
   ```
   GET https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session
   ```

---

## All Required Vercel Environment Variables

Make sure these are ALL set:

```bash
VITE_SUPABASE_URL=https://dsbkjkwefszqqzukgdtk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt
VITE_API_URL=https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
VITE_SUPABASE_PROJECT_ID=dsbkjkwefszqqzukgdtk
VITE_APP_NAME=Job Orbit
VITE_GOOGLE_OAUTH_ENABLED=true
VITE_GITHUB_OAUTH_ENABLED=true
```

---

## Still Not Working?

### Clear Cache
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Try incognito mode

### Check Deployment
- Verify environment variable is saved
- Check deployment timestamp (should be recent)
- View build logs for errors

### Test Edge Function Directly
```bash
curl https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -v
```

Should return 401 (unauthorized) but with CORS headers present.

---

**Status:** Edge Function deployed ✅  
**Next:** Set VITE_API_URL on Vercel ⏳  
**Time:** ~5 minutes
