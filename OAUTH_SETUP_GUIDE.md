# OAuth Setup Guide

## 📋 Overview

Your Job Orbit application supports OAuth authentication via:
- ✅ **Google** - For personal accounts
- ✅ **GitHub** - For developers
- ✅ **Microsoft (Azure)** - For enterprise (optional)

All OAuth is configured through **Supabase**, which acts as the centralized authentication provider.

## 🔑 Your Current Configuration

### Supabase Project
```
Project URL:         https://dsbkjkwefszqqzukgdtk.supabase.co
Project ID:          dsbkjkwefszqqzukgdtk
Publishable Key:     sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt
```

### OAuth Endpoints (Auto-Configured)
```
Authorization:       https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/oauth/authorize
Token Endpoint:      https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/oauth/token
JWKS:               https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/.well-known/jwks.json
OIDC Discovery:     https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/.well-known/openid-configuration
```

---

## 🚀 Setup Google OAuth

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a Project** → **New Project**
3. Enter project name: `Job Orbit`
4. Click **Create**

### Step 2: Enable OAuth APIs

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for `Google+ API`
3. Click on it and press **Enable**
4. Go back and search for `Google Identity`
5. Enable **Google Identity Service API**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - User type: **External**
   - Fill in App information
   - Add scopes: `email`, `profile`
   - Add test users (your email)
   - Save and continue

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Job Orbit Web`
   - Authorized redirect URIs:
     ```
     https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     https://yourdomain.com/auth/callback
     ```
   - Click **Create**

5. Copy the credentials:
   - **Client ID**: `xxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `your_client_secret`

### Step 4: Add to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select **Job Orbit** project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click **Enable**
5. Paste your Google credentials:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `your_client_secret`
6. Click **Save**

### Step 5: Test Google OAuth

1. Open Job Orbit at `http://localhost:5173/login`
2. Click **"Continue with Google"**
3. Sign in with your Google account
4. You should be redirected to dashboard

---

## 🐙 Setup GitHub OAuth

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### Step 2: Fill App Details

```
Application name:     Job Orbit
Homepage URL:         https://dsbkjkwefszqqzukgdtk.supabase.co
Application description: Smart job application tracker
Authorization callback URL:
  https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/callback
```

### Step 3: Copy Credentials

1. After creating, you'll see:
   - **Client ID**: `xxxxxxxxxxxxxxxx`
   - **Client Secret**: Click **Generate** and copy

### Step 4: Add to Supabase

1. Go to **Supabase Dashboard** → Select **Job Orbit**
2. Go to **Authentication** → **Providers**
3. Find **GitHub** and click **Enable**
4. Paste your GitHub credentials:
   - Client ID: `xxxxxxxxxxxxxxxx`
   - Client Secret: `your_client_secret`
5. Click **Save**

### Step 5: Test GitHub OAuth

1. Open Job Orbit at `http://localhost:5173/login`
2. Click **"Continue with GitHub"**
3. Authorize the app
4. You should be redirected to dashboard

---

## 🔷 Setup Microsoft (Azure) OAuth (Optional)

### Step 1: Create Azure Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for **App registrations**
3. Click **New registration**

### Step 2: Register Application

```
Name:                 Job Orbit
Supported account types: Accounts in any organizational directory and personal accounts
Redirect URI:         Web: https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/callback
```

### Step 3: Get Credentials

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Copy the secret value
4. Go to **Overview** and copy **Application (client) ID**

### Step 4: Add to Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Azure** and click **Enable**
3. Paste credentials:
   - Client ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Client Secret: `your_secret`
4. Tenant: `common` (for personal accounts)
5. Click **Save**

---

## 📱 .env Configuration

Your `.env` file is already configured with all the OAuth endpoints:

```env
# Current Configuration
VITE_SUPABASE_URL=https://dsbkjkwefszqqzukgdtk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt
VITE_SUPABASE_PROJECT_ID=dsbkjkwefszqqzukgdtk

# OAuth Endpoints (Auto-managed by Supabase)
VITE_SUPABASE_OAUTH_AUTHORIZE=https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/oauth/authorize
VITE_SUPABASE_OAUTH_TOKEN=https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/oauth/token
VITE_SUPABASE_OAUTH_JWKS=https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/.well-known/jwks.json
VITE_SUPABASE_OAUTH_OIDC_DISCOVERY=https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/.well-known/openid-configuration

# API Configuration
VITE_API_URL=https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1

# OAuth Providers
VITE_GOOGLE_OAUTH_ENABLED=true
VITE_GITHUB_OAUTH_ENABLED=true
VITE_MICROSOFT_OAUTH_ENABLED=false
```

**No additional configuration needed in .env!** Supabase handles all OAuth details.

---

## 🔒 Security Best Practices

### DO ✅

```
✅ Use HTTPS in production
✅ Keep client secrets secure
✅ Rotate secrets regularly
✅ Use separate credentials for dev/prod
✅ Validate JWT tokens
✅ Store secrets in .env (not in git)
```

### DON'T ❌

```
❌ Commit .env to version control
❌ Share client secrets
❌ Use same credentials for dev/prod
❌ Expose secrets in frontend code
❌ Use HTTP in production
```

---

## 🚨 Troubleshooting

### Issue: "OAuth Provider is not configured"

**Solution:**
1. Go to Supabase Dashboard
2. Check Authentication → Providers
3. Verify provider is enabled (toggle = ON)
4. Verify credentials are entered correctly
5. Click Save

### Issue: "Redirect URI mismatch"

**Solution:**
Ensure your callback URL matches exactly in:
1. **OAuth Provider settings** (Google Cloud, GitHub, Azure)
2. **Supabase Dashboard** → Authentication → Providers
3. Your `.env` file

Example valid URLs:
```
http://localhost:5173/auth/callback (development)
https://yourdomain.com/auth/callback (production)
```

### Issue: "Invalid client_id or client_secret"

**Solution:**
1. Double-check credentials are copied correctly
2. Verify there are no extra spaces
3. Make sure you copied the right credentials (not API key, etc.)
4. Regenerate credentials if needed

### Issue: "Access to XMLHttpRequest blocked by CORS"

**Solution:**
1. Supabase handles CORS automatically
2. Verify your app URL is in OAuth redirect URIs
3. Clear browser cache
4. Try in incognito/private mode

---

## 📊 Testing OAuth Flow

### Test Locally

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:5173/login

# 3. Click OAuth provider (Google, GitHub, etc.)

# 4. Sign in with your account

# 5. Should redirect to dashboard

# 6. Check browser console for any errors
```

### Test in Production

```bash
# After deploying to production:

# 1. Open https://yourdomain.com/login

# 2. Click OAuth provider

# 3. Verify callback URL is production URL

# 4. Should work seamlessly
```

---

## 🔄 OAuth Flow Diagram

```
User clicks "Sign in with Google"
        ↓
Redirects to Google login page
        ↓
User signs in and approves app
        ↓
Google redirects to Supabase callback
        ↓
Supabase exchanges code for JWT token
        ↓
Supabase redirects to Job Orbit /auth/callback
        ↓
App stores JWT token
        ↓
User authenticated and data loads
```

---

## 🔐 How OAuth Works in Your App

### 1. User Clicks OAuth Button
```typescript
// User clicks "Continue with Google"
await signInWithGoogle()
```

### 2. Supabase Handles OAuth
```
- Supabase redirects to Google
- User authenticates
- Google redirects back with code
- Supabase exchanges code for JWT token
```

### 3. App Receives JWT Token
```typescript
// Token automatically stored by Supabase
const { data: { session } } = await supabase.auth.getSession()
// session.access_token is your JWT
```

### 4. JWT Used for API Calls
```typescript
// All Edge Function calls include JWT
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 5. Database Validates JWT
```sql
-- RLS policies check auth.uid() from JWT
WHERE auth.uid() = user_id
```

---

## 📚 Environment Files Reference

### .env (Development)
- Used locally during `npm run dev`
- Contains dev credentials
- Callbacks to `localhost:5173`

### .env.production (Production)
- Used when building for production
- Contains production credentials
- Callbacks to your domain

### .env.example
- Template for reference
- Safe to commit to git
- Helps new developers

---

## ✅ Verification Checklist

### OAuth Setup Complete When:

- [ ] Google OAuth enabled in Supabase
- [ ] GitHub OAuth enabled in Supabase
- [ ] Credentials entered correctly
- [ ] Callback URLs configured
- [ ] Test login works
- [ ] Token is created
- [ ] Dashboard loads after login
- [ ] Extension receives session
- [ ] Real-time data loads

---

## 🎯 Next Steps

1. **Setup OAuth Providers** (follow steps above)
2. **Test Locally** (`npm run dev` + click OAuth buttons)
3. **Deploy to Production** (update callback URLs)
4. **Configure Chrome Extension** (use same OAuth)
5. **Monitor Usage** (Supabase Dashboard → Logs)

---

## 📞 Support Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth Docs**: https://developers.google.com/identity
- **GitHub OAuth Docs**: https://docs.github.com/en/apps/oauth-apps
- **Azure OAuth Docs**: https://learn.microsoft.com/en-us/azure/active-directory

**Your OAuth setup is now complete! 🎉**
