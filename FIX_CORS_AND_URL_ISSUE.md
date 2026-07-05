# Fix CORS and URL Issues for Vercel Deployment

## The Problem

Your error shows:
```
GET https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session
```

**Wrong!** Should be:
```
GET https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session
```

Missing `/functions/v1/` in the URL + CORS not configured for Vercel domain.

---

## Root Causes

### 1. Missing Environment Variable on Vercel
Your Vercel deployment doesn't have `VITE_API_URL` set, so it's falling back to constructing the wrong URL.

### 2. CORS Not Allowing Vercel Domain
The Edge Function needs to allow requests from `https://job-orbit-flax.vercel.app`

---

## Fix 1: Set Environment Variable on Vercel

### Via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your **job-orbit** project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

   **Name:** `VITE_API_URL`  
   **Value:** `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`  
   **Environments:** Production, Preview, Development (check all)

5. Click **Save**

6. **Redeploy:**
   - Go to **Deployments** tab
   - Click **•••** on the latest deployment
   - Click **Redeploy**

### Via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Set environment variable
vercel env add VITE_API_URL production
# Paste: https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1

# Redeploy
vercel --prod
```

---

## Fix 2: Update CORS in Edge Function

The Edge Function is already configured with `Access-Control-Allow-Origin: *` which should work, but let's verify it's deployed.

### Deploy the Edge Function

```bash
cd /Users/aashutoshkumarbhardwaj/Documents/GitHub/JobOrbit

# Deploy extension-session function
supabase functions deploy extension-session

# Verify deployment
supabase functions list
```

### Test the Edge Function

```bash
# Get your Supabase anon key from .env
ANON_KEY="your_anon_key_from_env"

# Test from command line
curl -X GET "https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -v

# Should return CORS headers in response:
# Access-Control-Allow-Origin: *
```

---

## Fix 3: Verify API Client Configuration

Check that the API client is correctly getting the base URL:

```typescript
// In src/api/v1/client.ts (already fixed in refactor)

const getApiBaseUrl = (): string => {
  const env = import.meta.env.VITE_API_URL
  if (!env) {
    console.warn('⚠️ VITE_API_URL not set')
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    return `${supabaseUrl}/functions/v1` // ✅ Includes /functions/v1
  }
  return env
}
```

This is already correct in your codebase after the refactor.

---

## Fix 4: Check Vercel Build Settings

Make sure Vercel is reading environment variables during build:

### In `vercel.json` (create if doesn't exist):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1",
    "VITE_SUPABASE_URL": "https://dsbkjkwefszqqzukgdtk.supabase.co",
    "VITE_SUPABASE_PUBLISHABLE_KEY": "@supabase_anon_key"
  }
}
```

**Note:** For sensitive keys, use Vercel's secret variables feature.

---

## Verification Steps

### 1. Check Environment Variable in Browser

After redeploying, open your Vercel app and run in browser console:

```javascript
console.log(import.meta.env.VITE_API_URL)
// Should log: https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
```

### 2. Check Network Request

1. Open browser DevTools → Network tab
2. Try logging in from extension
3. Look for the request to `/extension-session`
4. Should be: `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session`

### 3. Check CORS Headers

In Network tab, click on the request, check Response Headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, OPTIONS
```

---

## Alternative: Use Vercel Environment Variables UI

### Step-by-Step with Screenshots:

1. **Go to Vercel Dashboard**
   - Open: https://vercel.com
   - Click on your project: **job-orbit**

2. **Open Settings**
   - Click **Settings** tab
   - Click **Environment Variables** in left sidebar

3. **Add Variable**
   - Click **Add New**
   - Key: `VITE_API_URL`
   - Value: `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Find latest deployment
   - Click **•••** (three dots)
   - Click **Redeploy**
   - Wait for deployment to finish

5. **Test**
   - Open: https://job-orbit-flax.vercel.app
   - Try logging in from extension
   - Should work now!

---

## Additional: Set All Required Environment Variables

Make sure ALL these are set in Vercel:

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

## Troubleshooting

### Still Getting CORS Error After Fixing?

1. **Clear browser cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

2. **Check if old deployment is cached**
   - Try in incognito mode
   - Check deployment timestamp on Vercel

3. **Verify Edge Function is deployed**
   ```bash
   supabase functions list
   # Should show: extension-session [deployed]
   ```

4. **Test Edge Function directly**
   ```bash
   curl https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

### URL Still Wrong After Fixing?

Check the built JavaScript file:
1. Go to Vercel deployment
2. View source
3. Search for "extension-session"
4. Should find: `functions/v1/extension-session`

If not, the environment variable wasn't available during build.

**Fix:** Redeploy with environment variable set.

---

## Quick Fix Summary

1. **Set `VITE_API_URL` on Vercel** → `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`
2. **Deploy Edge Function** → `supabase functions deploy extension-session`
3. **Redeploy Vercel** → Deployments → Redeploy
4. **Test** → Login from extension should work

---

**Time:** ~5 minutes  
**Difficulty:** Easy  
**Required:** Vercel dashboard access + Supabase CLI
