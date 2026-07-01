# Setup & Deployment Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone & Install

```bash
git clone https://github.com/yourusername/JobOrbit.git
cd JobOrbit
npm install
```

### Step 2: Configure Environment

Create `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://dsbkjkwefszqqzukgdtk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt

# API Configuration (Optional - for custom backend)
VITE_API_URL=http://localhost:3000/api/v1
```

### Step 3: Deploy Database Schema

```bash
# Copy the RLS migration
supabase db push

# Or manually in Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select JobOrbit project
3. SQL Editor → New Query
4. Paste: supabase/migrations/20260120000000_enforce_rls_security.sql
5. Click Run
```

### Step 4: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy profile-get
supabase functions deploy profile-patch
supabase functions deploy settings-get
supabase functions deploy settings-patch
supabase functions deploy resumes-get
supabase functions deploy resumes-post
supabase functions deploy answers-get
supabase functions deploy answers-post
supabase functions deploy applications-get
supabase functions deploy applications-post
supabase functions deploy applications-patch
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open `http://localhost:5173` and sign in!

---

## 📋 Full Setup Checklist

### Database Setup

- [ ] Supabase project created at https://supabase.com
- [ ] RLS migration deployed (`supabase/migrations/20260120000000_enforce_rls_security.sql`)
- [ ] All tables have RLS policies enabled
- [ ] Verify with: `SELECT * FROM pg_policies WHERE tablename LIKE '%'`

### Edge Functions Deployment

- [ ] All 11 Edge Functions deployed
- [ ] Functions are accessible at: `https://<project>.supabase.co/functions/v1/<function-name>`
- [ ] Verify in Supabase Dashboard → Edge Functions
- [ ] Monitor logs for errors

### Authentication Setup

- [ ] Email/Password auth enabled
- [ ] Google OAuth configured (optional)
- [ ] GitHub OAuth configured (optional)
- [ ] OAuth redirect URLs configured:
  - `http://localhost:5173/auth/callback` (dev)
  - `https://yourdomain.com/auth/callback` (prod)
  - `chrome://extension-id/popup.html` (extension)

### Web App Setup

- [ ] `.env` file configured with Supabase keys
- [ ] Dependencies installed: `npm install`
- [ ] Development server running: `npm run dev`
- [ ] Login page accessible at `http://localhost:5173/login`
- [ ] Can sign up and authenticate
- [ ] Dashboard loads after login

### Chrome Extension Setup

- [ ] Extension source code prepared
- [ ] `manifest.json` configured
- [ ] Supabase keys added to extension
- [ ] Message listeners implemented
- [ ] Extension can message web app
- [ ] Session sharing working
- [ ] Data loading on login

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Users / Browsers                      │
└──────────┬──────────────────────┬──────────────────────┘
           │                      │
           ↓                      ↓
    ┌──────────────┐      ┌──────────────┐
    │  Job Orbit   │      │    Chrome    │
    │   Web App    │      │  Extension   │
    │  (React)     │      │              │
    └──────────────┘      └──────────────┘
           │                      │
           └──────────┬───────────┘
                      ↓
           ┌──────────────────────┐
           │   Supabase Auth      │
           │  (JWT Tokens)        │
           └──────┬───────────────┘
                  ↓
    ┌─────────────────────────────────┐
    │    Supabase Edge Functions      │
    │ (API Layer - JWT Validation)    │
    │                                 │
    │ - profile-get/patch             │
    │ - settings-get/patch            │
    │ - resumes-get/post              │
    │ - answers-get/post              │
    │ - applications-get/post/patch   │
    └──────────────┬──────────────────┘
                   ↓
    ┌─────────────────────────────────┐
    │   Supabase PostgreSQL           │
    │   (RLS Policies)                │
    │                                 │
    │ - profiles                      │
    │ - jobs (applications)           │
    │ - resumes                       │
    │ - ai_answers                    │
    │ - user_settings                 │
    │ - sync_logs                     │
    │ - guest_data                    │
    │ - notifications                 │
    └─────────────────────────────────┘
```

---

## 🔐 Security Verification

### Verify RLS Policies

```bash
# SSH into Supabase
supabase db remote version

# Or in SQL Editor:
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename IN (
  'profiles', 'jobs', 'resumes', 'ai_answers',
  'user_settings', 'sync_logs', 'guest_data', 'notifications'
)
ORDER BY tablename;
```

Expected output: 8 policies per table (SELECT, INSERT, UPDATE, DELETE)

### Verify JWT Token Validation

```bash
# Test without token (should fail)
curl -X GET https://<project>.supabase.co/functions/v1/profile-get

# Should return: 401 Unauthorized

# Test with token
curl -X GET \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  https://<project>.supabase.co/functions/v1/profile-get

# Should return: 200 with user profile data
```

### Test Cross-User Access Prevention

```sql
-- In SQL Editor as User A:
SELECT * FROM profiles;
-- Result: Only your profile

-- Try to access another user's data:
SELECT * FROM profiles WHERE user_id = 'different-user-id';
-- Result: Empty (RLS prevents access)
```

---

## 📦 Build & Deployment

### Development Build

```bash
npm run dev
```

Runs Vite dev server on `http://localhost:5173`

### Production Build

```bash
npm run build
```

Creates optimized build in `dist/` directory

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

### Deploy Edge Functions

```bash
# To production
supabase functions deploy --project-ref <project-ref>

# View logs
supabase functions logs <function-name>
```

---

## 🔍 Monitoring & Debugging

### View Application Logs

```bash
# Browser console
console.log('Debug message')

# Check Chrome DevTools
F12 → Console tab
```

### View Edge Function Logs

```bash
# In Supabase Dashboard
Edge Functions → <function-name> → Logs

# Or via CLI
supabase functions logs profile-get
```

### View Database Logs

```bash
# In Supabase Dashboard
Logs → Database → SQL
```

### Check Real-time Subscriptions

```typescript
// In browser console
supabase
  .from('profiles')
  .on('*', payload => console.log('Change:', payload))
  .subscribe()
```

---

## 🚨 Troubleshooting

### Issue: 401 Unauthorized on API Calls

**Problem:** Edge functions reject request

**Solution:**
1. Check JWT token is valid: `supabase.auth.getSession()`
2. Verify Authorization header: `Authorization: Bearer <token>`
3. Check RLS policies: `SELECT * FROM pg_policies`

### Issue: Extension Cannot Message Web App

**Problem:** `chrome.runtime.sendMessage()` fails

**Solution:**
1. Verify extension has `content_scripts` permissions
2. Check message handler is registered:
   ```typescript
   chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
     console.log('Received message:', msg)
   })
   ```
3. Test with simple echo message

### Issue: RLS Policy Denies Access

**Problem:** User cannot access their own data

**Solution:**
1. Verify `user_id` matches `auth.uid()`
2. Check RLS policy: `USING (auth.uid() = user_id)`
3. Test with SQL:
   ```sql
   SELECT auth.uid();  -- Should return current user ID
   SELECT * FROM profiles;  -- Should return only your profile
   ```

### Issue: Real-time Subscriptions Not Working

**Problem:** Changes not appearing automatically

**Solution:**
1. Check subscriptions are created:
   ```typescript
   supabase.from('profiles').on('*', ...).subscribe()
   ```
2. Verify Realtime is enabled in Supabase
3. Check firewall/network allows WebSocket connections

---

## 📱 Chrome Extension Setup

### Enable Extension

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select extension directory

### Test Extension

1. Open extension popup
2. Click "Sign in with Job Orbit"
3. Authenticate
4. Extension should load user data
5. Verify data appears in popup

### Debug Extension

1. Right-click extension icon
2. Select "Inspect popup" or "Inspect background page"
3. Use DevTools Console
4. Check for errors

---

## 🎯 Next Steps

After deployment:

1. **Create User Account**
   - Go to http://localhost:5173/signup
   - Sign up with email/password or OAuth
   - Verify profile loads

2. **Test Extension Login**
   - Click extension icon
   - Select "Sign in with Job Orbit"
   - Verify session is shared
   - Check data loads

3. **Test Data Operations**
   - Edit profile
   - Upload resume
   - Create application
   - Verify changes sync across web and extension

4. **Monitor Performance**
   - Check Edge Function metrics
   - Monitor database performance
   - Review Realtime subscription logs

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Chrome Extension Messaging](https://developer.chrome.com/docs/extensions/mv3/messaging/)
- [React Best Practices](https://react.dev)

---

## 💡 Tips & Best Practices

### Development

- Use `npm run dev` for hot reloading
- Check browser console for errors
- Use React DevTools for component debugging
- Monitor Edge Function logs for API issues

### Security

- Never expose Supabase keys in frontend code
- Always validate user_id server-side via RLS
- Use JWT tokens for API authentication
- Rotate keys regularly

### Performance

- Use React Query for caching
- Implement real-time subscriptions for live data
- Lazy load components
- Monitor bundle size: `npm run build`

### Testing

- Test login flows regularly
- Verify RLS policies prevent cross-user access
- Test extension-web app communication
- Test on multiple devices/browsers

---

## ✅ Production Checklist

Before launching:

- [ ] All environment variables configured
- [ ] Database schema deployed with RLS
- [ ] All Edge Functions deployed
- [ ] OAuth providers configured
- [ ] CORS settings correct
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error handling implemented
- [ ] Monitoring alerts setup
- [ ] Backup strategy defined
- [ ] Disaster recovery plan
- [ ] User documentation created
- [ ] Chrome Extension published
- [ ] Analytics configured
- [ ] Support system ready
