# Vercel Environment Variables Setup

**Status**: ⚠️ CRITICAL - App is crashing due to missing environment variables

---

## Error on Production

```
Something went wrong
Error ID: error-1783226338706-duvm7ootzReload
```

This error occurs when the app starts but crashes during initialization, likely due to missing environment variables.

---

## Required Environment Variables

The app requires these environment variables to be set in Vercel:

### 1. Supabase Configuration
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. OAuth Configuration (Optional - for social login)
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
```

---

## How to Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Select your project: `JobOrbit`
3. Click "Settings" tab
4. Click "Environment Variables" in the sidebar

### Step 2: Add Environment Variables
For each variable:
1. Click "Add"
2. Enter the KEY (e.g., `VITE_SUPABASE_URL`)
3. Enter the VALUE (get from your .env file or Supabase dashboard)
4. Select environments: **Production**, **Preview**, **Development** (check all)
5. Click "Save"

### Step 3: Get Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Settings" → "API"
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

### Step 4: Redeploy
After adding all environment variables:
1. Go to "Deployments" tab
2. Click the three dots menu (•••) on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

---

## Verification

### Check if Variables are Set
After setting the variables, check the build logs:
- ✅ Should NOT see: "Missing Supabase environment variables"
- ✅ Should see: App loads without errors

### Test the App
1. Open your deployed URL
2. Should see the landing page (not error page)
3. Try to sign in
4. Check browser console for any errors

---

## Local .env File (for reference)

Your local `.env` file should have:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=...
VITE_GITHUB_CLIENT_ID=...
VITE_MICROSOFT_CLIENT_ID=...
```

**Note**: The `.env` file is NOT deployed to Vercel. You must set these in Vercel's dashboard.

---

## Common Issues

### Issue 1: App still crashes after setting variables
**Solution**: Make sure to **redeploy** after setting environment variables. Vercel doesn't automatically rebuild.

### Issue 2: Variables not showing in build logs
**Solution**: Make sure variables start with `VITE_` prefix. Vite only exposes variables with this prefix to the client.

### Issue 3: "Invalid API key" error
**Solution**: Double-check you're using the `anon public` key, not the `service_role` key.

---

## Quick Fix Checklist

- [ ] Copy `VITE_SUPABASE_URL` from Supabase dashboard
- [ ] Copy `VITE_SUPABASE_PUBLISHABLE_KEY` from Supabase dashboard (anon key)
- [ ] Add both variables to Vercel environment variables
- [ ] Select all environments (Production, Preview, Development)
- [ ] Save changes
- [ ] Redeploy from Vercel dashboard
- [ ] Wait for deployment to complete
- [ ] Test the app in browser
- [ ] Check browser console for errors

---

## After Setup

Once environment variables are set correctly:
- ✅ App loads successfully
- ✅ No "Something went wrong" error
- ✅ Login/signup works
- ✅ Dashboard accessible after login

**The app is fully functional once these variables are configured!**
