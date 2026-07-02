# Complete Extension Auth Flow - Job Orbit

## The Complete Journey

### Step 1: Extension Opens Login Popup
```
Chrome Extension
    ↓
User clicks "Sign in with Job Orbit"
    ↓
Extension opens popup window:
window.open('https://joborbit.com/extension-auth', 'popup', ...)
    ↓
Popup loads /extension-auth page
```

---

### Step 2: Check if Already Logged In
```
/extension-auth page loads
    ↓
useEffect checks: isAuthenticated?
    ↓
YES ↓                                NO ↓
Already logged in             Show login buttons
    ↓                                ↓
Send session to extension    Google / GitHub / Email
Back to Step 5 (Skip Step 3)       ↓
                            User clicks button
```

---

### Step 3: OAuth Flow
```
User clicks "Sign in with Google"
    ↓
Set: sessionStorage.setItem('isExtensionAuth', 'true')
    ↓
Call: signInWithGoogle()
    ↓
Redirects to Google consent screen
    ↓
User grants permission
    ↓
Google redirects back to:
https://joborbit.com/auth/callback
(with OAuth code in URL)
```

---

### Step 4: Auth Callback Handles OAuth
```
/auth/callback page loads
    ↓
Supabase auth context processes OAuth code
    ↓
✅ Session created
✅ User authenticated
✅ Access token obtained
    ↓
AuthCallback.tsx useEffect triggers
    ↓
Check: isExtensionAuth?
YES: Create extension session (Step 5)
NO:  Redirect to dashboard
```

---

### Step 5: Create Extension Session ✨ (NEW!)
```
/auth/callback detects extension auth:
const isExtensionFromStorage = sessionStorage.getItem('isExtensionAuth')
    ↓
Calls: createExtensionSession(accessToken)
    ↓
Fetches: POST /functions/v1/extension-session
    ↓
Backend (Supabase Edge Function):
1. Verify Supabase JWT
2. Create extension_sessions DB entry
3. Generate Extension JWT token
4. Return: {
     extension_token: "eyJ...",
     session_id: "uuid-...",
     extension_token_expires_in: 3600
   }
    ↓
Frontend receives response
    ↓
Extract:
- extensionToken
- sessionId
- expiresAt = now + 3600000ms
```

---

### Step 6: Send Token to Extension ✨ (NEW!)
```
Token successfully created
    ↓
Call: sendExtensionSessionToExtension(response)
    ↓
Two methods (in parallel):

METHOD 1: Chrome Runtime Message
window.chrome.runtime.sendMessage({
  type: 'EXTENSION_SESSION_CREATED',
  payload: {
    extensionToken: "eyJ...",
    sessionId: "uuid-...",
    expiresAt: 1707094800000
  }
})
    ↓
Extension background script receives:
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'EXTENSION_SESSION_CREATED') {
    // Store token
    chrome.storage.local.set({
      extensionToken: msg.payload.extensionToken,
      sessionId: msg.payload.sessionId,
      expiresAt: msg.payload.expiresAt
    })
  }
})

METHOD 2: PostMessage (Fallback)
window.opener.postMessage({
  type: 'EXTENSION_SESSION_CREATED',
  payload: { ... }
})
    ↓
Extension popup listens:
window.addEventListener('message', (event) => {
  if (event.data.type === 'EXTENSION_SESSION_CREATED') {
    // Store token same way
  }
})
```

---

### Step 7: Close Extension Auth Window
```
Token sent to extension
    ↓
setTimeout(() => {
  window.close()  // Closes /auth/callback popup
}, 500)
    ↓
Popup closes
Extension popup now has token
```

---

### Step 8: Extension Uses Token for API Calls
```
Extension popup closes
    ↓
Extension reads stored token:
const { extensionToken } = 
  await chrome.storage.local.get('extensionToken')
    ↓
Makes API call:
fetch('https://joborbit.com/api/profile', {
  headers: {
    'X-Extension-Token': extensionToken
  }
})
    ↓
Backend verifies token:
1. Decode JWT
2. Extract sessionId
3. Look up in extension_sessions table
4. Check: is_active && !is_revoked && !expired
5. Update: last_used_at
6. Query Supabase
    ↓
Returns profile data to extension
```

---

## Complete Code Flow

### ExtensionAuth.tsx
```typescript
// When user clicks Google
const handleGoogleLogin = async () => {
  sessionStorage.setItem('isExtensionAuth', 'true')  // ← Mark as extension auth
  await signInWithGoogle()  // Supabase handles OAuth
  // This triggers Supabase auth flow, which redirects to /auth/callback
}
```

### AuthCallback.tsx
```typescript
// After OAuth completes, Supabase redirects here
useEffect(() => {
  // Step 1: Check if extension auth
  const isExtensionAuth = sessionStorage.getItem('isExtensionAuth') === 'true'
  
  if (isExtensionAuth) {
    // Step 2: Create extension session
    const extensionSession = await createExtensionSession(session.access_token)
    
    // Step 3: Send to extension
    sendExtensionSessionToExtension(extensionSession)
    
    // Step 4: Close window
    window.close()
  } else {
    // Regular web login - redirect to dashboard
    navigate('/dashboard')
  }
}, [session, isLoading])
```

### createExtensionSession()
```typescript
// Calls Supabase Edge Function
const createExtensionSession = async (accessToken) => {
  const response = await fetch('/functions/v1/extension-session', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  
  return response.json()  // Returns extension_token + session_id
}
```

### sendExtensionSessionToExtension()
```typescript
// Sends token to extension via Chrome runtime message
const sendExtensionSessionToExtension = (session) => {
  window.chrome.runtime.sendMessage({
    type: 'EXTENSION_SESSION_CREATED',
    payload: {
      extensionToken: session.extension_token,
      sessionId: session.session_id,
      expiresAt: Date.now() + session.extension_token_expires_in * 1000
    }
  })
  
  // Also fallback to postMessage for window.open case
  if (window.opener) {
    window.opener.postMessage({ ... })
  }
}
```

---

## Extension Side (What Extension Code Needs to Do)

### Listen for Token
```javascript
// In extension background.js or popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTENSION_SESSION_CREATED') {
    // Store token
    chrome.storage.local.set({
      extensionToken: request.payload.extensionToken,
      sessionId: request.payload.sessionId,
      expiresAt: request.payload.expiresAt
    })
    
    sendResponse({ success: true })
  }
})
```

### Use Token for API Calls
```javascript
// When extension needs to call an API
const { extensionToken } = await chrome.storage.local.get('extensionToken')

const response = await fetch('https://joborbit.com/api/profile', {
  method: 'GET',
  headers: {
    'X-Extension-Token': extensionToken,
    'Content-Type': 'application/json'
  }
})

const data = await response.json()
```

### Handle Token Refresh
```javascript
// Check if token needs refresh (when within 5 min of expiry)
const { expiresAt } = await chrome.storage.local.get('expiresAt')
const now = Date.now()
const timeUntilExpiry = expiresAt - now

if (timeUntilExpiry < 5 * 60 * 1000) {  // 5 minutes
  // Request new token from Job Orbit
  const response = await fetch('https://joborbit.com/api/extension/refresh', {
    method: 'POST',
    headers: {
      'X-Extension-Token': extensionToken
    }
  })
  
  const { extension_token: newToken, expires_in } = await response.json()
  
  // Store new token
  chrome.storage.local.set({
    extensionToken: newToken,
    expiresAt: Date.now() + expires_in * 1000
  })
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Chrome Extension Popup                                      │
│                                                             │
│ 1. User clicks "Sign in with Job Orbit"                    │
│ 2. Opens: /extension-auth page                             │
│ 3. Sets: sessionStorage.isExtensionAuth = true             │
│ 4. Triggers: signInWithGoogle()                            │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ OAuth Redirect
                       ↓
        ┌──────────────────────────┐
        │ Supabase OAuth Consent   │
        │ User grants permission   │
        └──────────────┬───────────┘
                       │
                       │ Redirect back
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Job Orbit /auth/callback                                    │
│                                                             │
│ 1. Receive OAuth code                                      │
│ 2. Create Supabase session                                 │
│ 3. Check: isExtensionAuth? YES                             │
│ 4. Call: POST /extension-session                           │
│ 5. Receive: extension_token + session_id                   │
│ 6. Send: chrome.runtime.sendMessage({...})                 │
│ 7. Close: window.close()                                   │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Runtime Message
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Chrome Extension Background Script                          │
│                                                             │
│ 1. Receive: EXTENSION_SESSION_CREATED message              │
│ 2. Store: extensionToken to chrome.storage.local           │
│ 3. Store: sessionId to chrome.storage.local                │
│ 4. Store: expiresAt to chrome.storage.local                │
│                                                             │
│ Extension is now authenticated!                            │
│ Ready to make API calls                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                       │
                       │ Every API Call
                       ↓
        ┌──────────────────────────┐
        │ Extension makes request: │
        │ GET /api/profile         │
        │ X-Extension-Token: jwt   │
        │                          │
        │ Backend verifies token   │
        │ ✓ Valid JWT              │
        │ ✓ DB session active      │
        │ ✓ Not revoked            │
        │ ✓ Not expired            │
        │                          │
        │ Returns: profile data    │
        └──────────────────────────┘
```

---

## Error Handling

### If OAuth Fails
```
OAuth consent screen → User denies
        ↓
Auth callback handles error
        ↓
State: error
Message: "Sign in failed"
        ↓
Show error message
        ↓
User can retry
```

### If Extension Session Creation Fails
```
POST /extension-session → 401 or error
        ↓
AuthCallback catches error
        ↓
State: error
Message: "Failed to create extension session"
        ↓
Extension receives nothing
        ↓
Window closes
        ↓
Extension shows error to user
        ↓
User can try again
```

### If Token Send Fails
```
chrome.runtime.sendMessage() → Extension not available
        ↓
Fallback to window.opener.postMessage()
        ↓
If that fails too:
        ↓
Token still created on server
        ↓
But extension doesn't know about it
        ↓
User must retry login
```

---

## Testing the Flow

### Manual Test
1. Open Chrome Developer Tools
2. Go to extension popup
3. Click "Sign in with Job Orbit"
4. Complete OAuth flow
5. Check:
   - [ ] Popup opens
   - [ ] OAuth consent screen appears
   - [ ] User grants permission
   - [ ] Redirected to /auth/callback
   - [ ] Browser console shows: "✅ Extension session created"
   - [ ] Browser console shows: "✅ Extension received session"
   - [ ] Popup closes automatically
   - [ ] Extension popup receives token
   - [ ] Token stored in chrome.storage.local

### Debug Logs
```
Extension Popup:
  🔌 Extension auth request

ExtensionAuth.tsx:
  Setting isExtensionAuth = true
  Triggering Google OAuth

/auth/callback:
  🔐 Auth callback handler started
  🔌 Extension auth request: true
  🔌 Creating extension session for extension auth...

createExtensionSession():
  🔌 Creating extension session...
  ✅ Extension session created

sendExtensionSessionToExtension():
  📤 Sending extension session to extension...
  ✅ Extension received session

Extension Background Script:
  Received: EXTENSION_SESSION_CREATED
  ✅ Token stored in chrome.storage.local

Extension Popup:
  Ready to make API calls
```

---

## Summary: What Was Added

### 1. /auth/callback creates extension session
```typescript
if (isExtensionAuth) {
  const extensionSession = await createExtensionSession(accessToken)
  sendExtensionSessionToExtension(extensionSession)
  window.close()
}
```

### 2. Extension session endpoint called
```typescript
POST /functions/v1/extension-session
Authorization: Bearer {supabase_jwt}
↓
Returns: {
  extension_token: "jwt",
  session_id: "uuid",
  expires_in: 3600
}
```

### 3. Token sent back to extension
```typescript
window.chrome.runtime.sendMessage({
  type: 'EXTENSION_SESSION_CREATED',
  payload: {
    extensionToken: "...",
    sessionId: "...",
    expiresAt: 1234567890
  }
})
```

---

## Status

✅ Job Orbit creates extension session  
✅ Extension session endpoint ready  
✅ Token returned to extension  
✅ Extension receives via runtime message  
✅ Token can be stored in chrome.storage.local  
✅ Extension can use token for API calls  

**All critical pieces implemented!** 🚀

---

**Version**: 1.0  
**Date**: February 2, 2026  
**Status**: Complete & Ready for Testing
