# Set Vercel Environment Variable - Step by Step

## The Problem

Your error shows:
```
GET https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session ❌
                                                   ^^^^^^^^^^^^^^^^^^
                                        MISSING: /functions/v1/
```

**This happens because `VITE_API_URL` is NOT set on Vercel.**

---

## SOLUTION: Set Environment Variable on Vercel

### Step 1: Open Vercel Dashboard

1. Go to: **https://vercel.com/dashboard**
2. Find and click on your **job-orbit** project

### Step 2: Go to Settings

1. Click **Settings** tab (top navigation)
2. In the left sidebar, click **Environment Variables**

### Step 3: Add the Variable

1. Click **Add New** button (top right)

2. Fill in these EXACT values:

   **Key (Name):**
   ```
   VITE_API_URL
   ```

   **Value:**
   ```
   https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
   ```

   **Environments:** Check ALL three boxes:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

3. Click **Save**

### Step 4: Redeploy

**CRITICAL:** Environment variables only apply to NEW deployments!

1. Go to **Deployments** tab
2. Find the latest deployment (should say "Ready" with green checkmark)
3. Click the **•••** (three dots) on the right
4. Click **Redeploy**
5. Click **Redeploy** again to confirm
6. Wait ~2-3 minutes for deployment to complete

---

## Verification

### After Redeployment:

1. **Open your Vercel app:** https://job-orbit-flax.vercel.app

2. **Open Browser Console (F12)**

3. **Type this command:**
   ```javascript
   // For Vite apps, check build-time env vars
   console.log(window.__ENV__)
   ```

4. **Check Network Tab:**
   - Try logging in from extension
   - Look for request to `extension-session`
   - URL should be: `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session` ✅

---

## If You Don't Have Vercel Dashboard Access

Ask your team member who has access to:

1. Go to Vercel → job-orbit → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`
3. Redeploy the app

---

## Alternative: Add to Project Config

If you can't access Vercel dashboard, add a `vercel.json` file:

```json
{
  "env": {
    "VITE_API_URL": "https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1"
  }
}
```

Then commit and push:
```bash
cd /Users/aashutoshkumarbhardwaj/Documents/GitHub/JobOrbit
echo '{"env":{"VITE_API_URL":"https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1"}}' > vercel.json
git add vercel.json
git commit -m "Add VITE_API_URL to Vercel config"
git push origin main
```

Vercel will auto-deploy with the new config.

---

## Why This Is Required

Vite replaces `import.meta.env.VITE_*` variables **at build time**.

If the variable isn't set when Vercel builds your app, it stays `undefined`, and the code falls back to constructing the wrong URL.

**Build-time replacement means:**
- Variable must exist BEFORE deployment
- Changing it requires re-deployment
- Can't be changed after deployment

---

## Common Mistakes

### ❌ Setting variable AFTER deployment
Won't work - variables are baked into build

### ❌ Not redeploying after setting variable  
Won't work - need new build with variable

### ✅ Set variable → Redeploy → Works!

---

## Expected Result

After setting the variable and redeploying:

**Before:**
```
API Request: GET https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session
Error: CORS blocked ❌
```

**After:**
```
API Request: GET https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/extension-session  
Success: 200 OK ✅
```

---

## Troubleshooting

### "I set the variable but still seeing wrong URL"

**Did you redeploy?** Environment variables don't apply to existing deployments.

1. Go to Deployments tab
2. Click ••• → Redeploy
3. Wait for new deployment

### "How do I know if variable is set correctly?"

Check deployment logs:
1. Go to Deployments → Latest deployment
2. Click on deployment
3. Click "Building" → View build logs
4. Search for `VITE_API_URL` in logs

Should see: `VITE_API_URL: https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`

### "Still not working after all this"

1. Clear browser cache (Cmd+Shift+R)
2. Try incognito mode
3. Check Network tab - verify URL includes `/functions/v1/`

---

## Summary Checklist

- [ ] Open Vercel Dashboard
- [ ] Go to Settings → Environment Variables
- [ ] Add `VITE_API_URL` = `https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1`
- [ ] Check all 3 environment boxes (Production, Preview, Development)
- [ ] Click Save
- [ ] Go to Deployments tab
- [ ] Click ••• → Redeploy on latest deployment
- [ ] Wait ~2-3 minutes for deployment
- [ ] Test extension login
- [ ] Verify URL in Network tab includes `/functions/v1/`

---

**Time Required:** 3 minutes  
**Difficulty:** Easy  
**Blocker:** Can't proceed without this step
