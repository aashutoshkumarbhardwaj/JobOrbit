# OAuth Configuration Reference Card

## 🎯 Quick Reference

### Your Supabase Project Details
```
URL:              https://dsbkjkwefszqqzukgdtk.supabase.co
Project ID:       dsbkjkwefszqqzukgdtk
Publishable Key:  sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt
```

### OAuth Redirect URI (Use in All OAuth Providers)
```
Development:  http://localhost:5173/auth/callback
Production:   https://yourdomain.com/auth/callback
```

---

## 🔑 Google OAuth

### Credentials Location
- **Google Cloud Console**: https://console.cloud.google.com/credentials

### Required URLs to Add
```
http://localhost:5173/auth/callback
https://yourdomain.com/auth/callback
https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/callback
```

### In Supabase Dashboard
```
Path: Authentication → Providers → Google
Toggle: ON
Client ID: [your_google_client_id@apps.googleusercontent.com]
Client Secret: [your_google_client_secret]
```

### Test URL
```
http://localhost:5173/login → Click "Continue with Google"
```

---

## 🐙 GitHub OAuth

### Credentials Location
- **GitHub Settings**: https://github.com/settings/developers → OAuth Apps

### Required URLs to Add
```
Authorization callback URL: https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/callback
Homepage URL: https://yourdomain.com
```

### In Supabase Dashboard
```
Path: Authentication → Providers → GitHub
Toggle: ON
Client ID: [your_github_client_id]
Client Secret: [your_github_client_secret]
```

### Test URL
```
http://localhost:5173/login → Click "Continue with GitHub"
```

---

## 🔷 Microsoft/Azure OAuth (Optional)

### Credentials Location
- **Azure Portal**: https://portal.azure.com/app registrations

### Required URLs to Add
```
Redirect URI: https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/callback
```

### In Supabase Dashboard
```
Path: Authentication → Providers → Azure
Toggle: ON
Client ID: [your_azure_client_id]
Client Secret: [your_azure_client_secret]
Tenant: common
```

### Test URL
```
http://localhost:5173/login → Click "Continue with Microsoft"
```

---

## 📋 Environment Variables (.env)

### Minimal Required
```env
VITE_SUPABASE_URL=https://dsbkjkwefszqqzukgdtk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt
VITE_SUPABASE_PROJECT_ID=dsbkjkwefszqqzukgdtk
VITE_API_URL=https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
```

### Optional (Already Configured)
```env
VITE_SUPABASE_OAUTH_AUTHORIZE=https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/oauth/authorize
VITE_SUPABASE_OAUTH_TOKEN=https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/oauth/token
VITE_SUPABASE_OAUTH_JWKS=https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/.well-known/jwks.json
VITE_SUPABASE_OAUTH_OIDC_DISCOVERY=https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/.well-known/openid-configuration
```

---

## ✅ Setup Checklist

### Google OAuth
- [ ] Create project in Google Cloud Console
- [ ] Enable Google+ API
- [ ] Create OAuth credentials (Web app)
- [ ] Add redirect URIs
- [ ] Copy Client ID and Secret
- [ ] Paste in Supabase Dashboard
- [ ] Click Save
- [ ] Test login

### GitHub OAuth
- [ ] Create OAuth App in GitHub Settings
- [ ] Add Authorization callback URL
- [ ] Copy Client ID and Secret
- [ ] Paste in Supabase Dashboard
- [ ] Click Save
- [ ] Test login

### Microsoft OAuth (Optional)
- [ ] Create app registration in Azure
- [ ] Add Redirect URI
- [ ] Copy Application (client) ID and Secret
- [ ] Paste in Supabase Dashboard
- [ ] Click Save
- [ ] Test login

---

## 🧪 Testing OAuth

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Open Login Page
```
http://localhost:5173/login
```

### Step 3: Click OAuth Provider
```
✓ Continue with Google
✓ Continue with GitHub
✓ Continue with Microsoft
```

### Step 4: Authenticate
```
Sign in with your account credentials
Authorize the app when prompted
```

### Step 5: Verify Success
```
✓ Redirected to /auth/callback
✓ Then redirected to /dashboard
✓ Dashboard loads with your data
✓ Profile is populated
```

---

## 🔍 Verification Steps

### Check Supabase Configuration
```
1. Go to https://supabase.com/dashboard
2. Select "Job Orbit" project
3. Go to Authentication → Providers
4. Verify each enabled provider:
   - Toggle is ON
   - Credentials are filled
   - No error messages
```

### Check .env File
```bash
# Should contain:
VITE_SUPABASE_URL=https://dsbkjkwefszqqzukgdtk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KbTCR-8BEKmM3AZYDGauhg_A3i41bVt
VITE_SUPABASE_PROJECT_ID=dsbkjkwefszqqzukgdtk
```

### Test Login Flow
```bash
# Open browser console (F12)
# Go to http://localhost:5173/login
# Click OAuth button
# Check console for:
  ✓ No CORS errors
  ✓ No 401 errors
  ✓ Redirect happens
  ✓ JWT token exists
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Provider is not configured" | Enable provider in Supabase → verify toggle is ON |
| "Redirect URI mismatch" | Ensure callback URL matches exactly in OAuth provider settings |
| "Invalid credentials" | Verify Client ID and Secret are correct, no extra spaces |
| "CORS error" | Supabase handles CORS - check network tab in DevTools |
| "401 Unauthorized" | Check JWT token is valid, verify RLS policies |
| "Blank page after login" | Check browser console for errors, verify redirect URL |

---

## 📱 Environment-Specific URLs

### Development
```
App URL:           http://localhost:5173
Callback URL:      http://localhost:5173/auth/callback
API URL:           http://localhost:5173/api/v1
```

### Production
```
App URL:           https://yourdomain.com
Callback URL:      https://yourdomain.com/auth/callback
API URL:           https://yourdomain.com/api/v1
```

### Supabase (All Environments)
```
Auth URL:          https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1
OAuth URL:         https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/oauth
API URL:           https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1
Callback URL:      https://dsbkjkwefszqqzukgdtk.supabase.co/auth/v1/callback
```

---

## 🔐 Security Reminders

✅ **DO:**
- Use HTTPS in production
- Store secrets in .env files
- Rotate credentials regularly
- Use separate credentials for dev/prod
- Validate JWTs server-side

❌ **DON'T:**
- Commit .env to git
- Share client secrets
- Use HTTP in production
- Expose secrets in code
- Reuse credentials across projects

---

## 📞 Quick Links

| Resource | Link |
|----------|------|
| Supabase Dashboard | https://supabase.com/dashboard |
| Google Cloud Console | https://console.cloud.google.com |
| GitHub OAuth Settings | https://github.com/settings/developers |
| Azure Portal | https://portal.azure.com |
| Job Orbit App (Dev) | http://localhost:5173 |
| Auth Callback (Dev) | http://localhost:5173/auth/callback |

---

## 🎓 Learn More

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/overview)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Guide](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Azure OAuth Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

---

## 💾 .gitignore Configuration

Ensure your `.env` file is in `.gitignore`:

```bash
# .gitignore
.env
.env.local
.env.production
.env.production.local
```

---

**Ready to enable OAuth authentication! 🚀**
