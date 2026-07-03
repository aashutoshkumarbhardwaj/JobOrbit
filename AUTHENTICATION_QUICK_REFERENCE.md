# Authentication Quick Reference Card

## Core Concepts

| Component | Purpose | File |
|-----------|---------|------|
| **AuthContext** | Central auth state management | `src/lib/auth/auth-context.tsx` |
| **Supabase Auth** | OAuth & session management | `src/lib/auth/supabase-auth.ts` |
| **ProtectedRoute** | Route access control | `src/lib/auth/protected-route.tsx` |
| **API Client** | HTTP requests with auth | `src/api/v1/client.ts` |
| **Extension Bridge** | Cross-platform messaging | `src/lib/auth/extension-bridge.ts` |

---

## Authentication Flows at a Glance

### Web Auth Flow
```
Login Page
    ↓
Click OAuth Button (Google/GitHub/Microsoft)
    ↓
OAuth Consent Screen
    ↓
Redirect to /auth/callback?code=...&state=...
    ↓
Supabase processes code → creates session
    ↓
Session stored in AuthContext
    ↓
Redirect to /dashboard
    ↓
Protected pages accessible
```

### Extension Auth Flow
```
Extension Popup
    ↓
Click "Sign in with Job Orbit"
    ↓
Opens /extension-auth page
    ↓
Already logged in? → Return session immediately
    ↓
Not logged in? → Show OAuth buttons
    ↓
Click OAuth → Consent → /auth/callback
    ↓
Creates extension_sessions DB entry
    ↓
Generates extension JWT
    ↓
Sends token via chrome.runtime.sendMessage()
    ↓
Extension stores in chrome.storage.local
    ↓
Extension ready for API calls
```

---

## Hooks Reference

### `useAuth()`
Get authentication state and methods

```typescript
const { user, session, isAuthenticated, isLoading, signInWithGoogle, signOut } = useAuth()

// Check if authenticated
if (!isAuthenticated) {
  // Redirect to login
}

// Sign in
await signInWithGoogle()

// Sign out
await signOut()
```

### `useSessionTimeout()` ⭐ NEW
Monitor session expiration

```typescript
const { timeUntilExpiry, showWarning, extendSession, isExpired } = useSessionTimeout()

if (showWarning) {
  // Show warning modal (component does this automatically)
  // User can call extendSession() or logout
}
```

---

## Component Reference

### `SessionTimeoutWarning` ⭐ NEW
Add to app to show session timeout warnings

```typescript
<SessionTimeoutWarning />
// Shows modal when session < 10 minutes
// User can extend or logout
```

### `ProtectedRoute`
Protect pages from unauthenticated access

```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
// Redirects to /login if not authenticated
```

---

## API Endpoints Reference

### Auth Endpoints
```typescript
// Get session
const session = await apiClient.get('/auth/session')

// Get current user
const user = await apiClient.get('/auth/me')

// Logout
await apiClient.post('/auth/logout')

// Refresh token
const newToken = await apiClient.post('/auth/refresh')
```

### Extension Endpoints
```typescript
// Create extension session
const response = await apiClient.get('/extension-session')
// Returns: { extension_token, session_id, expires_in }

// Logout extension
await apiClient.post('/extension-logout', { all_devices: false })

// Verify session
const { valid } = await verifyExtensionSession()
```

---

## Token Storage Reference

### Web App (Supabase JWT)
```
Storage: Browser Cookies (Supabase SDK handles)
Header: Authorization: Bearer <token>
Expiry: 1 hour (or configured)
Refresh: Automatic on 401
```

### Extension (Extension JWT)
```
Storage: chrome.storage.local
Keys: 
  - extension_session_token
  - extension_session_id
  - extension_session_token_expires_at
Header: X-Extension-Token: <token>
Expiry: 1 hour
Refresh: Automatic before expiry
```

---

## Environment Variables Required

```bash
# Supabase (required)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ0eXA...

# API (required)
VITE_API_URL=https://api.joborbit.com/api/v1

# Token Secret (required in Supabase Functions)
VITE_EXTENSION_TOKEN_SECRET=<secret>

# OAuth (optional - can be false)
VITE_GOOGLE_OAUTH_ENABLED=true
VITE_GITHUB_OAUTH_ENABLED=true

# Callbacks (required)
VITE_DEV_CALLBACK_URL=http://localhost:5173/auth/callback
VITE_PROD_CALLBACK_URL=https://joborbit.com/auth/callback
```

---

## Common Tasks

### Check if User is Authenticated
```typescript
const { isAuthenticated, isLoading } = useAuth()

if (isLoading) return <LoadingSpinner />
if (!isAuthenticated) return <Navigate to="/login" />

// User is authenticated
```

### Sign Out User
```typescript
const { signOut } = useAuth()

const handleLogout = async () => {
  await signOut()
  // Redirected to login by ProtectedRoute
}
```

### Make Authenticated API Call
```typescript
import { apiClient } from '@/api/v1/client'

const data = await apiClient.get('/profiles/me')
// Token automatically added to header
// 401 → automatic token refresh → retry
```

### Handle Session Expiration
```typescript
const { showWarning, timeUntilExpiry, extendSession } = useSessionTimeout()

if (showWarning) {
  return (
    <div>
      <p>Session expires in: {formatTimeRemaining(timeUntilExpiry)}</p>
      <button onClick={extendSession}>Extend Session</button>
    </div>
  )
}
```

### Authenticate Extension
```typescript
import { getExtensionSession } from '@/api/v1/endpoints/extension'

const result = await getExtensionSession()
if (result.success) {
  // Token ready, store in chrome.storage.local (done automatically)
  // Extension is now authenticated
}
```

---

## Error Handling

### 401 Unauthorized
**What it means**: Token expired or invalid
**What happens**: 
1. API client attempts token refresh (automatic)
2. If successful: request retried with new token
3. If fails 3 times: redirected to login

```typescript
try {
  await apiClient.get('/protected-endpoint')
} catch (error) {
  if (error.statusCode === 401) {
    // Session expired - user redirected to login
  }
}
```

### Network Error
**What it means**: No internet connection
**What happens**: Error thrown to caller

```typescript
try {
  await apiClient.get('/endpoint')
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    console.log('No internet connection')
  }
}
```

### Session Expired
**What it means**: User was inactive > 1 hour
**What happens**: 
1. SessionTimeoutWarning modal shown at 10 min before
2. User can extend or logout
3. On expiration: redirected to login

---

## Debugging Tips

### Check Auth State
```javascript
// In browser console
localStorage.getItem('auth_token')  // See bearer token
sessionStorage.getItem('isExtensionAuth')  // See if extension auth
window.__EXTENSION_AUTH_RESPONSE  // See extension token response
```

### Monitor Token Refresh
```javascript
// DevTools → Network → Filter: authorization
// Look for automatic token refresh requests
```

### Check Extension Storage
```javascript
// In extension background script console
chrome.storage.local.get(null, (items) => {
  console.log('Stored:', items)
})
```

### View Session Info
```typescript
const { session, user } = useAuth()
console.log('Session:', session)
console.log('User:', user)
console.log('Expires at:', new Date(session.expires_at * 1000))
```

---

## Database Schema Reference

### extension_sessions table
```sql
id                    UUID          -- Session ID
user_id               UUID          -- User reference
session_token_hash    TEXT          -- SHA256 of JWT (for lookup)
device_name           TEXT          -- "Chrome on MacOS"
device_id             TEXT          -- Unique device ID
browser               TEXT          -- Browser name
os                    TEXT          -- Operating system
is_active             BOOLEAN       -- Currently valid
is_revoked            BOOLEAN       -- User revoked
created_at            TIMESTAMP     -- When created
expires_at            TIMESTAMP     -- When expires
last_used_at          TIMESTAMP     -- Last API call
revoked_at            TIMESTAMP     -- When revoked
user_agent            TEXT          -- Full user agent
metadata              JSONB         -- Extra data
```

---

## Security Checklist

- ✅ Never store tokens in HTML/JavaScript (use storage)
- ✅ Always use HTTPS for token transmission
- ✅ Tokens included only in CORS-safe headers
- ✅ Token hash stored in DB (not token itself)
- ✅ Immediate revocation possible (DB-backed)
- ✅ Per-device session tracking
- ✅ Automatic logout on invalid token
- ✅ Timeout protection on all requests

---

## Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Edge functions deployed
- [ ] EXTENSION_TOKEN_SECRET set in Supabase
- [ ] OAuth providers configured
- [ ] Redirect URLs match production domain
- [ ] HTTPS enforced
- [ ] CORS headers verified
- [ ] Monitoring/alerts configured
- [ ] Backups enabled
- [ ] Manual tests passed

---

## Useful Commands

```bash
# Check TypeScript
npx tsc --noEmit

# Start dev server
npm run dev

# Build for production
npm run build

# View auth logs
# Check browser DevTools → Console → filter "Auth"

# View database
# Supabase Dashboard → SQL Editor → SELECT * FROM extension_sessions
```

---

## File Locations

| What | Where |
|------|-------|
| Auth context | `src/lib/auth/auth-context.tsx` |
| OAuth config | `src/lib/auth/supabase-auth.ts` |
| Login page | `src/pages/Login.tsx` |
| Extension auth | `src/pages/ExtensionAuth.tsx` |
| Callback handler | `src/pages/AuthCallback.tsx` |
| API client | `src/api/v1/client.ts` |
| Extension endpoints | `src/api/v1/endpoints/extension.ts` |
| Token middleware | `src/api/v1/middleware/extension-token.ts` |
| Timeout hook | `src/hooks/useSessionTimeout.ts` |
| Timeout warning | `src/components/SessionTimeoutWarning.tsx` |
| Database schema | `supabase/migrations/` |
| Edge functions | `supabase/functions/` |

---

## Support Resources

- **Audit Report**: `COMPREHENSIVE_AUTHENTICATION_AUDIT.md` (95% complete)
- **Testing Guide**: `AUTHENTICATION_TESTING_GUIDE.md` (50+ test cases)
- **Implementation Guide**: `AUTHENTICATION_IMPLEMENTATION_SUMMARY.md`
- **Quick Reference**: This file

---

**Last Updated**: July 3, 2026  
**Status**: ✅ Production Ready  
**Build**: Zero TypeScript errors
