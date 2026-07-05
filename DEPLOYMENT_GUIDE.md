# Job Orbit Deployment Guide

This guide covers deploying both the web application and Edge Functions.

## Current Status

✅ **Web App**: Deployed to Vercel (https://job-orbit-flax.vercel.app)  
❌ **Edge Functions**: NOT DEPLOYED (causing CORS errors)  
⚠️ **Chrome Extension**: Needs Edge Functions to work

---

## Issue: CORS Errors

You're seeing these errors because Edge Functions aren't deployed yet:

```
Access to fetch at 'https://dsbkjkwefszqqzukgdtk.supabase.co/extension-session'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Root Cause**: Edge Functions exist in code but aren't deployed to Supabase servers.

---

## Quick Fix: Deploy Edge Functions

### Prerequisites

1. **Supabase CLI** (choose one method):
   ```bash
   # macOS (recommended)
   brew install supabase/tap/supabase
   
   # Or with npm
   npm install -g supabase
   ```

2. **Supabase Account**: You already have one (project ref: `dsbkjkwefszqqzukgdtk`)

---

### Method 1: Automated Deployment (Recommended)

Run the deployment script:

```bash
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh
```

This will:
1. Check if Supabase CLI is installed
2. Login to Supabase (if needed)
3. Link your project
4. Set environment secrets
5. Deploy all 14 Edge Functions
6. Test CORS
7. Show deployment summary

---

### Method 2: Manual Deployment

#### Step 1: Login to Supabase

```bash
supabase login
```

This opens a browser for authentication.

#### Step 2: Link Your Project

```bash
supabase link --project-ref dsbkjkwefszqqzukgdtk
```

#### Step 3: Set Secrets

Generate and set the extension token secret:

```bash
# Generate a secure random secret
SECRET=$(openssl rand -base64 32)

# Set it in Supabase
supabase secrets set EXTENSION_TOKEN_SECRET="$SECRET"

# Verify it was set
supabase secrets list
```

#### Step 4: Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
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

#### Step 5: Verify Deployment

```bash
# List deployed functions
supabase functions list

# Check specific function logs
supabase functions logs extension-session --tail
```

---

### Method 3: Deploy via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project (dsbkjkwefszqqzukgdtk)
3. Click "Edge Functions" in sidebar
4. Click "Deploy new function"
5. Upload each function folder from `supabase/functions/`
6. Set `EXTENSION_TOKEN_SECRET` in "Secrets" section

---

## Verification

### Test CORS (should return 200 OK)

```bash
curl -X OPTIONS \
  https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization, apikey" \
  -v 2>&1 | grep "200 OK"
```

### Test Function (should return 401, not 500)

```bash
curl -X GET \
  https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -H "Authorization: Bearer invalid-token" \
  -v
```

**Expected**: `401 Unauthorized` (not `500 Internal Server Error`)

### Test Your App

1. Go to https://job-orbit-flax.vercel.app
2. Login with your account
3. Dashboard should load without CORS errors
4. Check browser console (F12) - no red CORS errors
5. Extension auth should work: https://job-orbit-flax.vercel.app/extension-auth

---

## What Gets Deployed

### Edge Functions (14 total)

#### Authentication (3)
- `extension-session` - Create extension session token
- `extension-logout` - Logout from extension
- `extension-refresh` - Refresh extension token

#### User Data (6)
- `profile-get` - Get user profile
- `profile-patch` - Update user profile
- `settings-get` - Get user settings
- `settings-patch` - Update user settings

#### Applications (3)
- `applications-get` - List job applications
- `applications-post` - Create job application
- `applications-patch` - Update job application

#### Documents (2)
- `resumes-get` - List user resumes
- `resumes-post` - Upload resume

#### AI Answers (2)
- `answers-get` - List saved AI answers
- `answers-post` - Save AI answer

---

## After Deployment

### Expected Results

✅ Web app loads successfully  
✅ Login works  
✅ Dashboard shows user data  
✅ No CORS errors in console  
✅ Extension auth page works  
✅ All 14 functions responding  

### Check Deployment Status

```bash
# List all functions
supabase functions list

# Check specific function
supabase functions inspect extension-session

# View recent logs
supabase functions logs profile-get --tail 50
```

---

## Troubleshooting

### Issue: "Supabase CLI not found"

**Fix**:
```bash
# macOS
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### Issue: "Not logged in"

**Fix**:
```bash
supabase login
```

### Issue: "Project not linked"

**Fix**:
```bash
supabase link --project-ref dsbkjkwefszqqzukgdtk
```

### Issue: "Function deployment failed"

**Check logs**:
```bash
supabase functions logs <function-name>
```

**Common causes**:
- Missing environment secrets
- Syntax error in function code
- Missing dependencies

**Fix**:
1. Check function logs for specific error
2. Verify secrets are set: `supabase secrets list`
3. Redeploy: `supabase functions deploy <function-name>`

### Issue: "500 Internal Server Error"

**Cause**: Function code error or missing secrets

**Fix**:
```bash
# Check logs for stack trace
supabase functions logs <function-name> --tail 100

# Set required secrets
supabase secrets set EXTENSION_TOKEN_SECRET="$(openssl rand -base64 32)"

# Redeploy
supabase functions deploy <function-name>
```

### Issue: "CORS errors still appearing"

**Check**:
1. Functions are deployed: `supabase functions list`
2. OPTIONS returns 200: (see CORS test above)
3. Origin matches your domain exactly

**Fix**:
```bash
# Redeploy all functions
supabase functions deploy

# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Issue: "Build fails with PostCSS timeout"

**Cause**: Network/dependency issue during build

**Fix**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Retry build
npm run build
```

If still fails, the issue is temporary network connectivity. Try:
- Using a different network
- Disabling VPN
- Waiting a few minutes and retrying

---

## Build Locally (Before Deploying)

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build
npm run preview
```

If build succeeds locally, you can deploy to Vercel.

---

## Deploy to Vercel

### Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Via GitHub Integration

1. Push code to GitHub
2. Vercel auto-deploys on push to main branch

---

## Environment Variables

### Web App (.env)

Required for local development:

```env
VITE_SUPABASE_URL=https://dsbkjkwefszqqzukgdtk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
```

### Vercel (Production)

Set in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

### Supabase Secrets

Set via CLI:

```bash
# Required for extension tokens
supabase secrets set EXTENSION_TOKEN_SECRET="$(openssl rand -base64 32)"

# Verify
supabase secrets list
```

---

## Timeline

- **Install Supabase CLI**: 2 minutes
- **Login & Link**: 2 minutes
- **Set Secrets**: 1 minute
- **Deploy Functions**: 5 minutes (all 14 functions)
- **Test & Verify**: 2 minutes

**Total**: ~12 minutes to fully working app! 🚀

---

## Summary

Your web app is deployed and working, but Edge Functions need to be deployed separately to Supabase.

**Quick Fix**:
```bash
brew install supabase/tap/supabase
./deploy-edge-functions.sh
```

After deployment, everything will work perfectly! 🎉

---

## Support

If you encounter issues:

1. Check function logs: `supabase functions logs <function-name>`
2. Verify secrets: `supabase secrets list`
3. Test CORS: (see verification section)
4. Check Supabase Dashboard → Edge Functions
5. Review EDGE_FUNCTIONS_DEPLOYMENT_FIX.md for more details
