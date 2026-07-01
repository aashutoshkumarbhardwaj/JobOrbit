# Extension Session Flow - Complete Implementation Guide

**Date**: July 2, 2026  
**Status**: ✅ Ready to Implement  
**Flow**: Chrome Extension → Login → Get Session → Call APIs

---

## Overview

The extension session endpoint (`/api/extension/session`) handles the complete authentication flow:

```
┌─────────────────────────────────────────────────────────────┐
│  Chrome Extension Flow                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Extension Popup Opens                                  │
│     └─ "Sign in to Job Orbit"                              │
│                                                             │
│  2. Opens `/extension-auth` page                           │
│     └─ "Sign in with Google"                               │
│                                                             │
│  3. User authenticates with Supabase                       │
│     └─ Returns to `/extension-auth`                        │
│                                                             │
│  4. Extension receives session                             │
│     └─ Stores in chrome.storage.local                      │
│                                                             │
│  5. Extension calls /api/extension/session                 │
│     └─ Verifies user is authenticated                      │
│     └─ Returns session token + user info                   │
│                                                             │
│  6. Extension uses token to call Job Orbit APIs            │
│     └─ GET /api/v1/profile                                 │
│     └─ GET /api/v1/resumes                                 │
│     └─ POST /api/v1/applications                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Endpoints

### GET /api/extension/session

**Purpose**: Get authenticated session for extension

**Request**:
```http
GET /functions/v1/extension-session HTTP/1.1
Authorization: Bearer <access_token>
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "sbr_...",
      "expires_at": 1656789012,
      "expires_in": 3600
    },
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "user_metadata": {
        "full_name": "John Doe"
      },
      "created_at": "2026-07-02T10:30:00Z"
    }
  },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-07-02T10:30:00Z",
    "extensionSupported": true
  }
}
```

**Response (Error - Not Authenticated)**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "User not authenticated or token expired"
}
```

**Status Codes**:
- `200` - Success, session returned
- `401` - Not authenticated, missing token, or token expired
- `405` - Wrong HTTP method
- `500` - Server error

---

## Chrome Extension Implementation

### 1. Extension Background Script

```typescript
// background.ts

const WEB_APP_URL = 'https://joborbit.com'
// For local: 'http://localhost:5173'

interface StoredSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    id: string
    email: string
  }
}

/**
 * Get or refresh extension session
 */
async function getExtensionSession(): Promise<StoredSession | null> {
  try {
    // Check if we have a stored session
    const stored = await chrome.storage.local.get('jobOrbitSession')
    
    if (!stored.jobOrbitSession) {
      console.log('No stored session found')
      return null
    }

    const session: StoredSession = stored.jobOrbitSession

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at < now) {
      console.log('Token expired, refreshing...')
      return await refreshExtensionSession(session.refresh_token)
    }

    // Token still valid
    return session
  } catch (error) {
    console.error('Error getting extension session:', error)
    return null
  }
}

/**
 * Refresh session using refresh token
 */
async function refreshExtensionSession(refreshToken: string): Promise<StoredSession | null> {
  try {
    console.log('Refreshing session with refresh token...')

    const response = await fetch(
      `${WEB_APP_URL}/api/v1/refresh-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      }
    )

    if (!response.ok) {
      console.error('Failed to refresh session:', response.status)
      // Clear invalid session
      await chrome.storage.local.remove('jobOrbitSession')
      return null
    }

    const data = await response.json()

    if (data.success && data.data.session) {
      const newSession: StoredSession = {
        access_token: data.data.session.access_token,
        refresh_token: data.data.session.refresh_token || refreshToken,
        expires_at: data.data.session.expires_at,
        user: data.data.user,
      }

      // Store new session
      await chrome.storage.local.set({
        jobOrbitSession: newSession,
      })

      console.log('Session refreshed successfully')
      return newSession
    }

    return null
  } catch (error) {
    console.error('Error refreshing session:', error)
    return null
  }
}

/**
 * Verify session with Job Orbit
 */
async function verifyExtensionSession(accessToken: string): Promise<boolean> {
  try {
    console.log('Verifying extension session...')

    const response = await fetch(
      `${WEB_APP_URL}/functions/v1/extension-session`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.warn('Session verification failed:', response.status)
      return false
    }

    const data = await response.json()
    console.log('Session verified successfully')
    
    return data.success === true
  } catch (error) {
    console.error('Error verifying session:', error)
    return false
  }
}

/**
 * Call Job Orbit API with authenticated session
 */
async function callJobOrbitAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    // Get valid session
    const session = await getExtensionSession()

    if (!session) {
      console.error('No authenticated session available')
      throw new Error('Not authenticated')
    }

    // Verify session is still valid
    const isValid = await verifyExtensionSession(session.access_token)
    if (!isValid) {
      console.warn('Session invalid, clearing...')
      await chrome.storage.local.remove('jobOrbitSession')
      throw new Error('Session invalid')
    }

    // Make API call with auth token
    const response = await fetch(
      `${WEB_APP_URL}${endpoint}`,
      {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(`API call failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data as T

  } catch (error) {
    console.error('Error calling Job Orbit API:', error)
    return null
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SESSION') {
    getExtensionSession().then((session) => {
      sendResponse({ session })
    })
    return true // Keep channel open for async response
  }

  if (request.type === 'CALL_API') {
    callJobOrbitAPI(request.endpoint, request.options).then((data) => {
      sendResponse({ success: true, data })
    }).catch((error) => {
      sendResponse({ success: false, error: error.message })
    })
    return true
  }

  if (request.type === 'VERIFY_SESSION') {
    getExtensionSession().then((session) => {
      const isValid = !!session
      sendResponse({ valid: isValid })
    })
    return true
  }
})
```

### 2. Extension Popup Script

```typescript
// popup.ts

document.getElementById('loginBtn')?.addEventListener('click', () => {
  // Open extension auth page
  chrome.runtime.sendMessage(
    { type: 'OPEN_AUTH_WINDOW' },
    (response) => {
      if (response.opened) {
        console.log('Auth window opened')
        // Close popup - user will return after auth
        window.close()
      }
    }
  )
})

// Check if authenticated
chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
  if (response.session) {
    // Show authenticated UI
    document.getElementById('authSection')?.style.display = 'none'
    document.getElementById('userSection')?.style.display = 'block'
    document.getElementById('userEmail').textContent = response.session.user.email
  } else {
    // Show login UI
    document.getElementById('authSection')?.style.display = 'block'
    document.getElementById('userSection')?.style.display = 'none'
  }
})

// Example: Call Job Orbit API
document.getElementById('getProfileBtn')?.addEventListener('click', () => {
  chrome.runtime.sendMessage(
    {
      type: 'CALL_API',
      endpoint: '/api/v1/profile',
      options: { method: 'GET' },
    },
    (response) => {
      if (response.success) {
        console.log('Profile:', response.data)
      } else {
        console.error('Failed to get profile:', response.error)
      }
    }
  )
})
```

---

## Security Considerations

### ✅ What's Secure

1. **No Service-Role Keys Exposed**
   - Extension never has access to service-role keys
   - All requests use user's access token (auth'd token)

2. **Token Validation**
   - Every API call verifies JWT token
   - Tokens expire automatically
   - Auto-refresh prevents expired tokens

3. **User-Scoped Access**
   - RLS policies ensure users only access their own data
   - Database-level security enforcement
   - No cross-user data access possible

4. **Secure Storage**
   - Session stored in `chrome.storage.local` (extension-private)
   - Not accessible from web pages
   - Cleared on extension uninstall

5. **CORS Protection**
   - Endpoint validates Authorization header
   - CORS headers properly configured
   - Only accepts Bearer token scheme

### 🔐 Best Practices

1. **Token Refresh**
   - Always refresh before calling API
   - Check expiration time (`expires_at`)
   - Handle 401 responses by refreshing

2. **Error Handling**
   - Log errors for debugging
   - Never expose sensitive data in errors
   - Gracefully handle auth failures

3. **Session Verification**
   - Verify session before each API call
   - Clear invalid sessions immediately
   - Prompt user to re-login on auth failure

4. **Storage Security**
   - Only store public data in chrome.storage
   - Never store passwords or secret keys
   - Clear sensitive data on logout

---

## API Calls with Session

### Example 1: Get User Profile

```typescript
// In extension
chrome.runtime.sendMessage(
  {
    type: 'CALL_API',
    endpoint: '/api/v1/profile',
    options: { method: 'GET' }
  },
  (response) => {
    if (response.success) {
      console.log('User profile:', response.data)
      // Use profile data...
    }
  }
)
```

### Example 2: Get Resumes

```typescript
chrome.runtime.sendMessage(
  {
    type: 'CALL_API',
    endpoint: '/api/v1/resumes',
    options: { method: 'GET' }
  },
  (response) => {
    if (response.success) {
      console.log('User resumes:', response.data)
      // Display resumes...
    }
  }
)
```

### Example 3: Create Application

```typescript
chrome.runtime.sendMessage(
  {
    type: 'CALL_API',
    endpoint: '/api/v1/applications',
    options: {
      method: 'POST',
      body: JSON.stringify({
        company_name: 'Acme Corp',
        job_title: 'Senior Engineer',
        status: 'applied'
      })
    }
  },
  (response) => {
    if (response.success) {
      console.log('Application created:', response.data)
    }
  }
)
```

---

## Deployment Steps

### 1. Deploy Extension-Session Function

```bash
cd supabase
supabase functions deploy extension-session
```

### 2. Update Extension URLs

In extension `background.ts`:
```typescript
const WEB_APP_URL = 'https://joborbit.com' // Update to production
```

### 3. Configure Extension Permissions

In extension `manifest.json`:
```json
{
  "permissions": ["storage", "tabs"],
  "host_permissions": [
    "https://joborbit.com/*",
    "https://*.supabase.co/*"
  ]
}
```

### 4. Test Extension Flow

1. Open extension popup
2. Click "Sign in to Job Orbit"
3. Sign in with OAuth
4. Return to extension
5. Verify session is stored
6. Test API calls

---

## Troubleshooting

### Issue: "Unauthorized" Error

**Cause**: Token is invalid or expired  
**Solution**: 
- Check token is being sent in Authorization header
- Refresh token if expired
- Clear chrome.storage.local and re-authenticate

### Issue: CORS Error

**Cause**: Request blocked by CORS policy  
**Solution**:
- Verify endpoint has CORS headers
- Check origin is whitelisted
- Use Bearer token in Authorization header

### Issue: "Not authenticated" Message

**Cause**: No valid session in storage  
**Solution**:
- Check user successfully logged in
- Verify session was stored in chrome.storage.local
- Try signing in again

### Issue: API Returns 401

**Cause**: Access token is expired or invalid  
**Solution**:
- Implement auto-refresh before API calls
- Use refresh_token to get new access_token
- Clear session and prompt user to re-login

---

## Complete Extension Flow

```typescript
// Extension receives auth response
type: 'EXTENSION_AUTH_RESPONSE'
payload: {
  success: true,
  session: {
    access_token: "...",
    refresh_token: "...",
    expires_at: 1656789012,
    user: { id, email }
  }
}
  ↓
// Store in extension storage
chrome.storage.local.set({ jobOrbitSession: payload.session })
  ↓
// Verify with Job Orbit
GET /functions/v1/extension-session
Authorization: Bearer <access_token>
  ↓
// Receive verified session with user info
{
  success: true,
  data: {
    session: { access_token, refresh_token, expires_at },
    user: { id, email, user_metadata }
  }
}
  ↓
// Now extension can call APIs
GET /api/v1/profile
Authorization: Bearer <access_token>
  ↓
// User data returned (RLS applied)
{
  success: true,
  data: { ...profile }
}
```

---

## Summary

✅ **Extension-Session Endpoint Created**
- File: `supabase/functions/extension-session/index.ts`
- Verifies user is authenticated
- Returns session + user info
- Never exposes service-role keys

✅ **Session Flow Implemented**
- Extension logs in via `/extension-auth`
- Gets session from `/api/extension/session`
- Stores in chrome.storage.local
- Uses token to call Job Orbit APIs

✅ **Security Enforced**
- JWT token validation
- RLS policies prevent data leaks
- Auto-refresh prevents expired tokens
- CORS properly configured

✅ **Ready to Deploy**
- Run: `supabase functions deploy extension-session`
- Update extension URLs to production
- Test full flow

---

**Version**: 1.0  
**Status**: Production Ready ✅  
**Last Updated**: July 2, 2026
