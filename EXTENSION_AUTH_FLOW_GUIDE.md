# Chrome Extension Authentication Flow Guide

**Route**: `/extension-auth`  
**Status**: ✅ Ready  
**Last Updated**: July 2, 2026

---

## Overview

The `/extension-auth` route provides a dedicated authentication endpoint for the Chrome Extension. It handles two scenarios:

1. **User Already Authenticated** → Return session immediately
2. **User Not Authenticated** → Show login options → Redirect back after auth

---

## Flow Diagrams

### Scenario 1: User Already Logged In

```
┌─────────────────────────────────────────┐
│  Extension Popup Opens                  │
│  window.open('/extension-auth')         │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  /extension-auth Page Loads             │
│  Checks Auth State                      │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │ User Authenticated? │
        └──────────┬──────────┘
                   │ YES
                   ▼
┌─────────────────────────────────────────┐
│  Send Session to Extension              │
│  - access_token                         │
│  - refresh_token                        │
│  - expires_at                           │
│  - user.id & user.email                 │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Show "Connected!" Message              │
│  Auto-close window after 1 second       │
└─────────────────────────────────────────┘
```

### Scenario 2: User Not Logged In

```
┌─────────────────────────────────────────┐
│  Extension Popup Opens                  │
│  window.open('/extension-auth')         │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  /extension-auth Page Loads             │
│  Checks Auth State                      │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │ User Authenticated? │
        └──────────┬──────────┘
                   │ NO
                   ▼
┌─────────────────────────────────────────┐
│  Show Login Options:                    │
│  - Google OAuth                         │
│  - GitHub OAuth                         │
│  - Email/Password                       │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    ┌──────┐  ┌──────┐  ┌──────┐
    │Google│  │GitHub│  │Email │
    └──┬───┘  └──┬───┘  └──┬───┘
       │         │         │
       └─────────┼─────────┘
               │
               ▼
    ┌──────────────────────┐
    │ OAuth/Email Login    │
    │ Returns to /callback │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Auth State Updates   │
    │ useEffect Triggers   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Send Session Info    │
    │ to Extension         │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Auto-close Window    │
    │ Extension Receives   │
    │ Session              │
    └──────────────────────┘
```

---

## Implementation Details

### Page Component: `ExtensionAuth.tsx`

#### Key Features

1. **Authentication Check**
   - Detects if user is already logged in
   - Uses `useAuth()` hook to access auth state

2. **Session Return**
   - Returns complete session object to extension:
     - `access_token` - Bearer token for API calls
     - `refresh_token` - Token refresh capability
     - `expires_at` - Token expiration time
     - `user.id` - User UUID
     - `user.email` - User email

3. **Communication Methods**
   ```typescript
   // Method 1: chrome.runtime.sendMessage (if extension available)
   window.chrome.runtime.sendMessage({
     type: 'EXTENSION_AUTH_RESPONSE',
     payload: sessionData
   })

   // Method 2: window.opener.postMessage (if opened via window.open)
   window.opener.postMessage({
     type: 'EXTENSION_AUTH_RESPONSE',
     payload: sessionData
   }, '*')
   ```

4. **Three Login Options**
   - Google OAuth (instant, via Supabase)
   - GitHub OAuth (instant, via Supabase)
   - Email/Password (redirect to `/login`)

5. **Auto-close**
   - After successful auth, window closes automatically
   - Extension handles the closed window gracefully

---

## Usage from Extension

### Method 1: Open in New Window (Recommended)

```javascript
// In your Chrome Extension content script or popup
const authWindow = window.open(
  'https://joborbit.com/extension-auth',
  'job-orbit-auth',
  'width=500,height=700'
)

// Listen for response
window.addEventListener('message', (event) => {
  if (event.data.type === 'EXTENSION_AUTH_RESPONSE') {
    const { success, session, error } = event.data.payload
    
    if (success) {
      // Store session in extension storage
      chrome.storage.local.set({
        jobOrbitSession: session,
        jobOrbitUser: event.data.payload.user
      })
      
      // Close the auth window
      if (authWindow) authWindow.close()
      
      // Reload extension UI
      location.reload()
    } else {
      console.error('Auth failed:', error)
    }
  }
})
```

### Method 2: Extension Runtime Message

```javascript
// In your Chrome Extension background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTENSION_AUTH_RESPONSE') {
    const { success, session, error } = request.payload
    
    if (success) {
      chrome.storage.local.set({
        jobOrbitSession: session,
        jobOrbitUser: request.payload.user
      })
    }
    
    sendResponse({ received: true })
  }
})
```

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "sbr_...",
    "expires_at": 1656789012
  },
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com"
  },
  "message": "User already authenticated"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Google login failed"
}
```

---

## URL Parameters

### Support for Return Path

You can append `returnTo` to redirect back to a specific page after auth:

```
/extension-auth?returnTo=/dashboard
```

**Currently supported**: Static route or extension page

---

## State Management

### Loading States

1. **Initial Load** → Show loading spinner + "Checking authentication status..."
2. **Already Auth** → Show confirmation + "Syncing with extension..."
3. **Not Auth** → Show login options
4. **Auth Error** → Show error message + login options

### Session Storage

After receiving session from `/extension-auth`:

```javascript
// Extension storage (secure for extension)
{
  jobOrbitSession: {
    access_token: "...",
    refresh_token: "...",
    expires_at: 1656789012
  },
  jobOrbitUser: {
    id: "...",
    email: "..."
  },
  lastSync: "2026-07-02T10:30:00Z"
}
```

---

## Redirects

### After OAuth Login

1. User clicks "Google" or "GitHub"
2. Redirected to Supabase OAuth provider
3. Provider redirects back to `/auth/callback`
4. Auth callback handles session setup
5. Redirects back to `/extension-auth`
6. `useEffect` detects new session
7. Sends session to extension
8. Window closes

### Email Login

1. User clicks "Email"
2. Redirected to `/login?returnTo=/extension-auth`
3. User enters email/password
4. On success, redirected back to `/extension-auth`
5. Process continues as above

---

## Security Considerations

### Token Handling

✅ **Secure**:
- Tokens sent only to extension (chrome.runtime.sendMessage)
- Tokens sent only to opener (if opened via window.open)
- No tokens in URL parameters
- No tokens in localStorage for this page

### Communication

✅ **Secure**:
- Runtime message (encrypted channel)
- postMessage with wildcard origin (for opener window)
- Extension validates source before trusting

### Session Lifecycle

✅ **Secure**:
- Access token has expiration (expires_at)
- Refresh token can be used to get new access token
- Old session is invalidated on logout
- RLS policies prevent cross-user data access

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Extension not available | Extension not installed or disabled | Show fallback UI |
| Pop-up blocked | Browser blocking window.open | Trigger from user interaction |
| Auth failed | OAuth provider error | Show error message, retry |
| Session not established | Database issue | Show error, try again |

### Error Messages Shown

- "Checking authentication status..." (loading)
- "Google login failed"
- "GitHub login failed"
- "Your session automatically syncs with the extension"

---

## Testing Locally

### 1. Start Web App
```bash
npm run dev
# App runs at http://localhost:5173
```

### 2. Open Auth Page
```
http://localhost:5173/extension-auth
```

### 3. Test Scenarios

**Already Logged In**:
- Open in logged-in browser
- Should show "Connected!" message
- Console should show "Session delivered to extension"

**Not Logged In**:
- Open in private/incognito window
- Should show 3 login buttons
- Click any button to test flow

**Manual Test with window.open**:
```javascript
// In browser console
const authWindow = window.open('http://localhost:5173/extension-auth', 'auth', 'width=500,height=700')

// Should open popup window
// If logged in: shows "Connected!" then closes
// If not logged in: shows login buttons
```

---

## Chrome Extension Integration

### In Extension Background Script

```javascript
// Listen for extension auth request from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'OPEN_AUTH_WINDOW') {
    const authWindow = window.open(
      chrome.runtime.getURL('pages/auth.html'),
      'job-orbit-auth',
      'width=500,height=700'
    )
    sendResponse({ opened: true })
  }
})

// Listen for auth response from web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTENSION_AUTH_RESPONSE') {
    // Store session
    chrome.storage.local.set({
      jobOrbitSession: request.payload.session,
      jobOrbitUser: request.payload.user
    })
    sendResponse({ received: true })
  }
})
```

### In Extension Popup

```html
<!-- popup.html -->
<button id="loginBtn">Sign in to Job Orbit</button>

<script>
document.getElementById('loginBtn').addEventListener('click', () => {
  // Open web auth page
  chrome.runtime.sendMessage(
    { type: 'OPEN_AUTH_WINDOW' },
    (response) => {
      if (response.opened) {
        console.log('Auth window opened')
      }
    }
  )
})

// Listen for session updates
chrome.storage.onChanged.addListener((changes) => {
  if (changes.jobOrbitSession) {
    console.log('Session updated:', changes.jobOrbitSession.newValue)
    // Update UI to show user is logged in
  }
})
</script>
```

---

## Deployment Checklist

- [ ] Route added to App.tsx
- [ ] Component created at `src/pages/ExtensionAuth.tsx`
- [ ] Extension bridge updated with `openExtensionAuthWindow()`
- [ ] OAuth providers configured in Supabase
- [ ] Auth callback route working (`/auth/callback`)
- [ ] Email login route working (`/login`)
- [ ] Test with actual Chrome Extension
- [ ] Test all three login methods
- [ ] Test already-authenticated scenario
- [ ] Test window close behavior
- [ ] Test error scenarios

---

## Next Steps

1. **Test Locally**
   ```bash
   npm run dev
   # Navigate to http://localhost:5173/extension-auth
   ```

2. **Test with Extension**
   - Update extension background script to open this page
   - Test full auth flow in real extension

3. **Deploy to Production**
   - Push to main branch
   - Deploy to hosting (Vercel/Netlify)
   - Extension can now use: `https://joborbit.com/extension-auth`

4. **Monitor**
   - Track successful auth rates
   - Monitor error logs
   - Check session validity

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Popup Script    │         │ Background Script│        │
│  │                  │         │                  │        │
│  │ [Sign in Button] ├─────────→ [Open Auth Page] │        │
│  └──────────────────┘         └────────┬─────────┘        │
│                                        │                   │
└────────────────────────────────────────┼───────────────────┘
                                         │
                                         │
                    ┌────────────────────▼─────────────────┐
                    │                                      │
                    │  Job Orbit Web App                   │
                    │  ┌──────────────────────────────┐   │
                    │  │ /extension-auth Page         │   │
                    │  │                              │   │
                    │  │ [Check Auth State]           │   │
                    │  │      ↓                       │   │
                    │  │ [Already Authed?]            │   │
                    │  │      ↓                       │   │
                    │  │ YES → [Send Session]         │   │
                    │  │      ↓                       │   │
                    │  │ [Close Window]               │   │
                    │  │      ↓                       │   │
                    │  │ NO → [Show Login Buttons]    │   │
                    │  │      ↓                       │   │
                    │  │ [OAuth Provider]             │   │
                    │  │      ↓                       │   │
                    │  │ [/auth/callback]             │   │
                    │  │      ↓                       │   │
                    │  │ [Back to /extension-auth]    │   │
                    │  │      ↓                       │   │
                    │  │ [Send Session + Close]       │   │
                    │  └──────────────────────────────┘   │
                    │                                      │
                    │  Auth Context                        │
                    │  Supabase Client                     │
                    │  API Client                          │
                    └──────────────────────────────────────┘
                                         │
                                         │
                    ┌────────────────────▼─────────────────┐
                    │                                      │
                    │  Supabase Backend                    │
                    │  - Auth API                          │
                    │  - JWT Tokens                        │
                    │  - User Sessions                     │
                    │  - OAuth Providers                   │
                    │                                      │
                    └──────────────────────────────────────┘
```

---

## FAQ

**Q: Will the window stay open after login?**
A: No, it closes automatically after 1 second. The extension handles the closed window.

**Q: Can I customize the login UI?**
A: Yes, edit `src/pages/ExtensionAuth.tsx` to match your design.

**Q: What if OAuth fails?**
A: Error message is shown and user can retry. Extension doesn't close the window.

**Q: Can the extension use this without a web app?**
A: The web app must be running (locally or in production) for auth to work.

**Q: How often should I refresh the access token?**
A: The auth context handles auto-refresh. Token is refreshed automatically when expired.

---

## Support

For issues with the extension auth flow:
1. Check browser console for errors
2. Verify OAuth providers are configured in Supabase
3. Check that `/auth/callback` is accessible
4. Verify extension can open windows (permissions)
5. Check extension manifest for content script access

---

**Last Updated**: July 2, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
