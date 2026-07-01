# Supabase Authentication Implementation

## 📋 Overview

Job Orbit now uses **Supabase Authentication** as the unified authentication system for both:
- **Job Orbit Web App** (React SPA)
- **ATS Resume Optimizer Chrome Extension**

This ensures single login, shared sessions, and seamless data synchronization across both platforms.

## ✅ Implementation Status

### Completed Features

✅ **Email/Password Authentication**
- Sign up with email and password
- Sign in with email and password
- Password reset via email
- Email verification (optional, configurable in Supabase)

✅ **OAuth Providers**
- Google OAuth
- GitHub OAuth
- Microsoft/Azure AD (optional, requires additional setup)

✅ **Session Management**
- Automatic session persistence
- Session refresh on tab/window open
- Cross-tab authentication sync
- Logout all devices

✅ **Security**
- Secure token storage
- Automatic token refresh on expiration
- Bearer token injection in API requests
- Row-level security (RLS) on database tables

✅ **Chrome Extension Support**
- Session sharing with extension
- Cross-extension messaging for auth
- Extension can use same session as web app

✅ **Protected Routes**
- ProtectedRoute component for access control
- Automatic redirect to login if not authenticated
- Loading state during auth check

## 🏗️ Architecture

### Core Authentication Files

```
src/lib/auth/
├── supabase-auth.ts              # Supabase Auth methods
├── auth-context.tsx              # React Context for auth state
├── chrome-extension-auth.ts       # Extension communication
└── protected-route.tsx            # Route protection

src/lib/supabase.ts               # Supabase client initialization

src/api/v1/endpoints/auth.ts      # Auth API endpoints wrapper
```

### Authentication Flow

```
User Login/Signup
    ↓
Supabase Auth.signIn/signUp()
    ↓
Session Created
    ↓
Token Stored in localStorage
    ↓
API Client Injects Token
    ↓
API Call with Authorization Header
    ↓
Response/Redirect to Dashboard
```

## 🔧 Configuration

### Environment Variables Required

```bash
# .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Supabase Configuration Steps

1. **Create Supabase Project** at https://supabase.com/dashboard
2. **Enable Providers** in Authentication → Providers:
   - ✅ Email (default, enabled)
   - ✅ Google OAuth (configure with your Google Cloud Project)
   - ✅ GitHub OAuth (configure with your GitHub App)
   - ⚠️ Microsoft/Azure (optional)

3. **Configure OAuth Redirects**:
   - Authorized redirect URLs:
     - `http://localhost:5173/auth/callback` (dev)
     - `https://yourdomain.com/auth/callback` (prod)
     - `chrome://YOUR-EXTENSION-ID/popup.html` (extension, if popup-based)

4. **Configure Email Settings** (optional):
   - SMTP configuration for custom email templates
   - Email templates for verification, password reset, etc.

## 📱 Usage in React Components

### Using Authentication Context

```typescript
import { useAuth } from '@/lib/auth/auth-context'

export function MyComponent() {
  const {
    user,           // Current user object
    session,        // Current session
    isAuthenticated, // Is user logged in?
    isLoading,      // Is auth loading?
    signInWithEmail,
    signInWithGoogle,
    signOutuseAuth
  } = useAuth()

  // Component logic
}
```

### Using Authentication Hooks

```typescript
import { 
  useAuth, 
  useUser, 
  useSession, 
  useIsAuthenticated 
} from '@/lib/auth/auth-context'

// Get current user
const user = useUser()

// Check if authenticated
const isAuth = useIsAuthenticated()

// Get full auth context
const { user, session, isLoading } = useAuth()
```

### Using Protected Routes

```typescript
import { ProtectedRoute } from '@/lib/auth/protected-route'

<Routes>
  <Route path="/login" element={<Login />} />
  <Route 
    path="/dashboard" 
    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
  />
</Routes>
```

## 🔐 Supabase Auth Methods

### Sign Up

```typescript
import * as supabaseAuth from '@/lib/auth/supabase-auth'

const result = await supabaseAuth.signUpWithEmail({
  email: 'user@example.com',
  password: 'secure-password',
  fullName: 'John Doe'
})
```

### Sign In

```typescript
const session = await supabaseAuth.signInWithEmail({
  email: 'user@example.com',
  password: 'secure-password'
})
```

### OAuth Sign In

```typescript
// Google
await supabaseAuth.signInWithGoogle()

// GitHub
await supabaseAuth.signInWithGitHub()

// Microsoft
await supabaseAuth.signInWithMicrosoft()
```

### Sign Out

```typescript
// Sign out current session
await supabaseAuth.signOut()

// Sign out all devices
await supabaseAuth.signOutAllDevices()
```

### Password Reset

```typescript
// Request reset email
await supabaseAuth.requestPasswordReset('user@example.com')

// Confirm reset with token
await supabaseAuth.confirmPasswordReset(token, 'new-password')
```

### Get Current Session

```typescript
const session = await supabaseAuth.getSession()
if (session) {
  console.log('Access Token:', session.access_token)
  console.log('Refresh Token:', session.refresh_token)
  console.log('User:', session.user)
}
```

## 🔄 Chrome Extension Integration

### Extension Can Access Web Session

```typescript
// In Chrome Extension content script or popup
import { 
  getExtensionSession,
  getAuthorizationHeader,
  validateExtensionAccess 
} from '@/lib/auth/chrome-extension-auth'

// Get current session
const { session, user } = await getExtensionSession()

// Get auth header for API calls
const headers = await getAuthorizationHeader()

// Validate session is still valid
const isValid = await validateExtensionAccess()
```

### Web App Shares Session with Extension

```typescript
// Automatically happens in AuthContext when user logs in
// Extension receives SESSION_UPDATE message with tokens
```

### Message Communication

The web app and extension communicate via Chrome's messaging API:

```typescript
// Extension sending request to web app
chrome.runtime.sendMessage(
  {
    type: 'GET_SESSION',
    payload: {}
  },
  (response) => {
    console.log('Session:', response.session)
  }
)

// Web app responding
window.chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === 'GET_SESSION') {
      getExtensionSession().then(sendResponse)
      return true
    }
  }
)
```

## 🔗 API Client Integration

The API client automatically uses Supabase tokens:

```typescript
import { apiClient } from '@/api/v1/client'
import { setupApiClientAuth } from '@/lib/auth/supabase-auth'

// In App initialization
setupApiClientAuth(apiClient)

// API client now:
// 1. Injects Bearer token in all requests
// 2. Automatically refreshes token on 401
// 3. Retries request with new token
```

## 🛡️ Security Features

### Automatic Token Refresh

```
API Request (401 Unauthorized)
    ↓
Token Expired
    ↓
Attempt Token Refresh via Supabase
    ↓
Get New Access Token
    ↓
Retry API Request with New Token
```

### Secure Token Storage

- Tokens stored in browser `localStorage`
- Access token: Short-lived (typically 1 hour)
- Refresh token: Long-lived (typically 1 week)
- Supabase handles token validation server-side

### Row-Level Security

All database tables use RLS policies:

```sql
-- Example: Users can only see their own data
SELECT * FROM profiles 
WHERE auth.uid() = user_id
```

## 📝 Pages and Routes

### Auth Pages

- **`/login`** - Sign in with email/password or OAuth
- **`/signup`** - Create account
- **`/auth/callback`** - OAuth redirect handler
- **`/auth/reset-password`** - Password reset confirmation

### Protected Pages

- **`/dashboard`** - Main dashboard (requires auth)
- **`/applications`** - Job applications (requires auth)
- **`/board`** - Job board (requires auth)
- **`/calendar`** - Calendar view (requires auth)
- **`/notifications`** - Notifications (requires auth)

## 🧪 Testing Authentication

### Test Email/Password Flow

1. Go to `http://localhost:5173/signup`
2. Fill in email, password, and name
3. Click "Create Account"
4. Should redirect to `/dashboard`

### Test Google OAuth

1. Go to `http://localhost:5173/login`
2. Click "Google" button
3. Follow Google login flow
4. Should redirect back to `/auth/callback` then `/dashboard`

### Test Password Reset

1. Go to `http://localhost:5173/login`
2. Click "Forgot password?" link
3. Enter email address
4. Check email for reset link
5. Click link (should go to `/auth/reset-password`)
6. Enter new password
7. Should redirect to `/login`

## 🚀 Deployment Checklist

- [ ] Add production Supabase URL to `.env.production`
- [ ] Add production Supabase key to `.env.production`
- [ ] Configure OAuth redirect URLs in Supabase for production domain
- [ ] Configure CORS in Supabase if API is on different domain
- [ ] Enable email verification (optional)
- [ ] Set up password reset email templates
- [ ] Test OAuth flows in production
- [ ] Test protected routes redirect properly
- [ ] Monitor authentication errors in logs

## 🔗 Useful Links

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Auth Redirects](https://supabase.com/docs/guides/auth/overview)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/management-api#email-templates)
- [Chrome Extension Messaging](https://developer.chrome.com/docs/extensions/mv3/messaging/)

## ❓ FAQ

**Q: How are tokens stored?**
A: Supabase stores them in `localStorage` and manages refresh automatically.

**Q: How does token refresh work?**
A: API client intercepts 401 errors, calls `refreshToken()`, and retries with new token.

**Q: Can users use both email and OAuth?**
A: Yes, if they use the same email address, both auth methods are linked.

**Q: How does Chrome Extension get authenticated?**
A: Extension uses messaging API to get session from web app, same tokens.

**Q: What happens if extension tries to access web app session offline?**
A: It gets null session, can show "Not authenticated" UI.

**Q: How to log out from extension?**
A: Web app logs out, extension receives `SESSION_INVALIDATE` message.

**Q: How to handle auth errors?**
A: Use `error` from `useAuth()` hook or catch in try/catch block.
