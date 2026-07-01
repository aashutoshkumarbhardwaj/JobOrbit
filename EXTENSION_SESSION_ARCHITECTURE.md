# Chrome Extension Session Architecture

## Overview

This document describes the secure session management system for the Chrome Extension in Job Orbit. The architecture implements database-backed session tracking with JWT tokens for production-grade security.

## Architecture Principles

### 1. Never Direct Supabase Access from Extension
- ✅ Extension calls Job Orbit APIs
- ✅ Job Orbit verifies token and accesses Supabase
- ❌ Extension does NOT call Supabase directly

### 2. Minimal JWT Tokens
- Tokens contain only: `sessionId`, `userId`, `aud`, `iat`, `exp`
- No sensitive data (no email, profile, etc.)
- Revocable at database level

### 3. Database-Backed Sessions
- All sessions tracked in `extension_sessions` table
- Sessions can be revoked immediately
- Support for multi-device management
- Audit trail of all sessions

---

## Flow Diagrams

### Step 1: Login Flow

```
┌─────────────────┐
│     Chrome      │
│   Extension     │
└────────┬────────┘
         │
         │ User clicks "Sign in with Job Orbit"
         │
         ▼
┌─────────────────────────────────────┐
│ Open https://joborbit.com/          │
│ extension-auth (Popup)              │
└────────┬────────────────────────────┘
         │
         │ OAuth Flow (Google/GitHub)
         │
         ▼
┌─────────────────────────────────────┐
│ /extension-auth                     │
│ - Show OAuth buttons                │
│ - Authenticate with Google/GitHub   │
│ - Get Supabase JWT                  │
└────────┬────────────────────────────┘
         │
         │ Redirect back to popup
         │ with Supabase JWT
         │
         ▼
┌─────────────────────────────────────┐
│ Extract JWT from URL                │
│ Call: POST /extension-session       │
│ Header: Authorization: Bearer JWT   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ /extension-session (Edge Function)  │
│ 1. Verify Supabase JWT              │
│ 2. Create extension_sessions entry  │
│ 3. Generate minimal JWT (sessionId) │
│ 4. Return extension_token           │
└────────┬────────────────────────────┘
         │
         │ Response:
         │ {
         │   "extension_token": "jwt",
         │   "session_id": "uuid",
         │   "expires_in": 3600
         │ }
         │
         ▼
┌─────────────────────────────────────┐
│ Store in chrome.storage.local:      │
│ - extension_session_token           │
│ - extension_session_id              │
│ - extension_token_expires_at        │
└─────────────────────────────────────┘
```

### Step 2: API Calls with Extension Token

```
┌──────────────────┐
│  Chrome         │
│  Extension      │
└────────┬─────────┘
         │
         │ GET /api/profile
         │ Header: X-Extension-Token: {jwt}
         │
         ▼
┌──────────────────────────────────────┐
│ Job Orbit API (apiClient)            │
└────────┬─────────────────────────────┘
         │
         │ Verify X-Extension-Token
         │ 1. Decode JWT
         │ 2. Extract sessionId
         │ 3. Look up extension_sessions
         │ 4. Check: is_active && !is_revoked
         │ 5. Check: expires_at > now
         │ 6. Update last_used_at
         │
         ▼
┌──────────────────────────────────────┐
│ Query Supabase                       │
│ SELECT * FROM profiles               │
│ WHERE user_id = jwt.userId           │
│ (RLS enforces user_id match)         │
└────────┬─────────────────────────────┘
         │
         │ Return data
         │
         ▼
┌──────────────────┐
│  Chrome         │
│  Extension      │
│  Updates UI     │
└──────────────────┘
```

### Step 3: Token Refresh (Auto or Manual)

```
Scenario: Token expires in < 5 minutes

┌──────────────────────┐
│  Extension checks    │
│  token expiration    │
└────────┬─────────────┘
         │
         │ Token expired?
         │
         ├─ Yes ──────────────┐
         │                    │
         └─ No ───────────────┤
                              │
                    ▼─────────┘
        ┌──────────────────────────────┐
        │ Call refreshExtensionSession()│
        └────────┬─────────────────────┘
                 │
                 │ 1. Validate Supabase JWT
                 │ 2. Refresh Supabase session
                 │ 3. Call /extension-session
                 │ 4. Get new extension_token
                 │ 5. Store new token
                 │
                 ▼
        ┌──────────────────────────────┐
        │ Continue with new token      │
        └──────────────────────────────┘
```

### Step 4: Logout Flow

```
User logs out from website OR extension:

┌─────────────────────────┐
│ User clicks "Logout"    │
└────────┬────────────────┘
         │
         ├─ From Website ────────────────┐
         │                               │
         │ Call logoutExtensionSession() │
         │ POST /extension-logout        │
         │ X-Extension-Token: {jwt}      │
         │                               │
         ├─ From Extension ──────────────┤
         │                               │
         │ Calls Website API:            │
         │ POST /auth/logout             │
         │                               │
         └───────────┬────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Backend: /extension-logout     │
        │ 1. Verify JWT signature        │
        │ 2. Mark session as revoked     │
        │ 3. Set is_revoked = true       │
        │ 4. Set revoked_at = now()      │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │ Extension/Website:             │
        │ 1. Clear localStorage          │
        │ 2. Clear extension_session_*   │
        │ 3. Show login screen           │
        └────────────────────────────────┘
```

---

## Database Schema

### extension_sessions Table

```sql
extension_sessions {
  id UUID PRIMARY KEY,
  user_id UUID (references auth.users),
  
  -- Token & Session
  session_token_hash TEXT UNIQUE,  -- SHA256 hash of JWT
  device_name TEXT,                -- "Chrome on MacOS"
  device_id TEXT UNIQUE,           -- Unique device identifier
  browser TEXT,                    -- "Chrome", "Safari", etc.
  os TEXT,                         -- "macOS", "Windows", etc.
  
  -- Session State
  is_active BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoke_reason TEXT,              -- "user_logout", "suspicious_activity"
  
  -- Timestamps
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB
}

Indexes:
- idx_extension_sessions_user_id
- idx_extension_sessions_token_hash (for fast lookup)
- idx_extension_sessions_device_id
- idx_extension_sessions_expires_at (for cleanup)
```

---

## JWT Token Structure

### Extension Token (Minimal)

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "iss": "https://joborbit.com",
  "sub": "550e8400-e29b-41d4-a716-446655440001",
  "aud": "extension",
  "iat": 1707091200,
  "exp": 1707094800
}
```

**Why Minimal?**
- No sensitive data (email, profile, etc.)
- Easy to revoke (revoke sessionId in DB)
- Stolen token has limited value
- Database can enforce additional checks

---

## API Endpoints

### 1. Create Extension Session
```
GET /functions/v1/extension-session
Authorization: Bearer {supabase_jwt}

Response:
{
  "success": true,
  "data": {
    "extension_token": "eyJ...",
    "extension_token_expires_in": 3600,
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "user_id",
      "email": "user@example.com"
    }
  }
}
```

### 2. API Calls with Extension Token
```
GET /api/profile
X-Extension-Token: {extension_jwt}

Backend:
1. Extract X-Extension-Token header
2. Decode JWT (verify signature)
3. Look up sessionId in extension_sessions table
4. Check: is_active && !is_revoked && expires_at > now
5. Update: last_used_at = now()
6. Proceed with query

Response:
{
  "id": "...",
  "email": "...",
  "full_name": "...",
  ...
}
```

### 3. Logout Extension Session
```
POST /functions/v1/extension-logout
X-Extension-Token: {extension_jwt}
Body: {
  "all_devices": false  // true to logout all sessions
}

Response:
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "session_id": "...",
    "revoked": true
  }
}
```

---

## Implementation Checklist

### Backend (Already Done)
- [x] Create `extension_sessions` table with RLS
- [x] Create `hash_extension_token()` function
- [x] Create `/extension-session` edge function
- [x] Create `/extension-logout` edge function
- [x] Add token hashing and verification

### Frontend
- [x] Create extension token middleware
- [x] Create extension session storage functions
- [x] Update extension API endpoints
- [x] Create `useExtensionAPI` hook
- [x] Add token validation before API calls
- [x] Add auto-refresh logic
- [ ] Update extension bridge to use new flow
- [ ] Update all API endpoints to verify extension token
- [ ] Test complete login→API→logout flow

### Edge Functions to Update (All API endpoints)
- [ ] profile-get: Verify X-Extension-Token
- [ ] profile-patch: Verify X-Extension-Token
- [ ] resumes-get: Verify X-Extension-Token
- [ ] resumes-post: Verify X-Extension-Token
- [ ] answers-get: Verify X-Extension-Token
- [ ] answers-post: Verify X-Extension-Token
- [ ] applications-get: Verify X-Extension-Token
- [ ] applications-patch: Verify X-Extension-Token
- [ ] settings-get: Verify X-Extension-Token
- [ ] settings-patch: Verify X-Extension-Token

---

## Security Features

### 1. Token Revocation
- ✅ Sessions can be revoked immediately in database
- ✅ Single device logout (revoke one session)
- ✅ All devices logout (revoke all user sessions)
- ✅ Stolen tokens become useless after revocation

### 2. Session Tracking
- ✅ See all active sessions
- ✅ Device name and OS
- ✅ IP address and user agent
- ✅ Last used timestamp
- ✅ Creation and expiration times

### 3. Token Safety
- ✅ No sensitive data in token
- ✅ Token hash stored (not raw token)
- ✅ Short expiration (1 hour)
- ✅ Auto-refresh with 5-minute buffer
- ✅ Signature verification on every use

### 4. RLS Protection
- ✅ All user tables have RLS policies
- ✅ Extension can only access own user data
- ✅ Backend uses auth.uid() for row filtering
- ✅ No cross-user data access possible

### 5. Audit Trail
- ✅ Every session logged with metadata
- ✅ Browser and OS information
- ✅ Device identification
- ✅ Login/logout timestamps
- ✅ Revocation reasons

---

## Configuration

### Environment Variables

**Frontend (.env)**
```
VITE_EXTENSION_TOKEN_SECRET=your-secret-key-min-32-chars-long
```

**Supabase Edge Functions**
Add to environment variables in Supabase Dashboard:
```
EXTENSION_TOKEN_SECRET=same-value-as-frontend
```

### Deployment Steps

1. **Create Database Table**
   ```bash
   supabase migration up 20260202000000_create_extension_sessions_table.sql
   ```

2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy extension-session
   supabase functions deploy extension-logout
   supabase functions deploy extension-refresh  # update if exists
   ```

3. **Set Environment Variables in Supabase**
   - Go to Supabase Dashboard
   - Navigate to Edge Functions → Settings
   - Add `EXTENSION_TOKEN_SECRET`

4. **Update All API Edge Functions**
   - Add extension token verification to each endpoint
   - Template provided below

---

## Middleware Template for API Endpoints

All API endpoints should be updated to verify extension tokens:

```typescript
// At the top of edge function
import { jwtVerify } from 'https://esm.sh/jose@5.0.0'

// In handler function
async function verifyExtensionToken(token: string, secret: string) {
  try {
    const signingKey = new TextEncoder().encode(secret)
    const verified = await jwtVerify(token, signingKey)
    return verified.payload
  } catch {
    throw new Error('Invalid token')
  }
}

// In endpoint handler
const extensionToken = req.headers.get('x-extension-token')
if (extensionToken) {
  // Extension request - verify token
  const tokenPayload = await verifyExtensionToken(
    extensionToken,
    Deno.env.get('EXTENSION_TOKEN_SECRET') || ''
  )
  const sessionId = tokenPayload.sessionId
  const userId = tokenPayload.userId
  
  // Look up session in database
  const { data: session, error: sessionError } = await supabase
    .from('extension_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_revoked', false)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (sessionError || !session) {
    return new Response(
      JSON.stringify({ success: false, error: 'Session invalid' }),
      { status: 401, headers: corsHeaders }
    )
  }
  
  // Update last_used_at
  await supabase
    .from('extension_sessions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', sessionId)
  
  // Proceed with request (userId is already verified)
}
```

---

## Testing Checklist

- [ ] Login with Google OAuth
- [ ] Receive extension_token and session_id
- [ ] Token stored in chrome.storage.local
- [ ] API call with X-Extension-Token succeeds
- [ ] Invalid token returns 401
- [ ] Expired token triggers refresh
- [ ] Refresh gets new token
- [ ] Logout revokes session
- [ ] Revoked token returns 401
- [ ] Multi-device logout works
- [ ] Session table shows all devices
- [ ] last_used_at updates on each call

---

## Troubleshooting

### Token not stored
- Check localStorage permissions
- Verify `storeExtensionToken()` is called
- Check browser DevTools → Application → Local Storage

### API returns 401
- Token expired? Check timestamp
- Session revoked? Check extension_sessions table
- Token signature invalid? Check EXTENSION_TOKEN_SECRET
- Wrong header? Should be `X-Extension-Token`

### Extension not receiving token
- Check popup window opens
- Check OAuth redirect URL
- Check edge function logs
- Verify Authorization header is set

---

## Future Improvements

1. **OAuth Consent Filtering**
   - Store which scopes extension has access to
   - Limit API access based on scopes

2. **Rate Limiting**
   - Limit API calls per extension session
   - Prevent abuse

3. **Session Metadata**
   - Store app version
   - Store extension version
   - Store last action type

4. **Enhanced Audit**
   - Log every API call
   - Track suspicious patterns
   - Alert on unusual activity

5. **Multi-Organization Support**
   - If Job Orbit adds teams/orgs
   - Associate sessions with org_id

---

**Version**: 1.0  
**Status**: Ready for Implementation  
**Last Updated**: February 2, 2026
