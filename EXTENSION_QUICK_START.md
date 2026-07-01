# Extension Session Quick Start Guide

## 30-Second Overview

The Chrome Extension now uses a **database-backed session system** instead of directly accessing Supabase.

```
Extension → Login → Get Extension Token → Store Locally
            → All API Calls Use X-Extension-Token Header
            → Backend Validates Token + Verifies Session
            → Backend Queries Supabase
```

**Benefits**: Revocable sessions, multi-device logout, audit trail, and theft recovery.

---

## For Developers

### 1. Generate Secret Key
```bash
openssl rand -base64 32
# Copy output → .env VITE_EXTENSION_TOKEN_SECRET
```

### 2. Deploy to Supabase
```bash
# Create table
supabase migration up 20260202000000_create_extension_sessions_table.sql

# Deploy functions
supabase functions deploy extension-session
supabase functions deploy extension-logout

# Add to Supabase Edge Functions environment:
EXTENSION_TOKEN_SECRET=your-secret-key
```

### 3. Update API Endpoints

**Template for each endpoint** (profile-get, resumes-get, etc.):

```typescript
// At top of edge function
import { jwtVerify } from 'https://esm.sh/jose@5.0.0'

// In handler
const extensionToken = req.headers.get('x-extension-token')
if (extensionToken) {
  try {
    // Verify JWT
    const signingKey = new TextEncoder().encode(
      Deno.env.get('EXTENSION_TOKEN_SECRET') || ''
    )
    const verified = await jwtVerify(extensionToken, signingKey)
    const payload = verified.payload as any
    
    // Check session in DB
    const { data: session, error } = await supabase
      .from('extension_sessions')
      .select('*')
      .eq('id', payload.sessionId)
      .eq('user_id', payload.userId)
      .eq('is_active', true)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (error || !session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session invalid' }),
        { status: 401, headers: corsHeaders }
      )
    }
    
    // Update last_used_at
    await supabase
      .from('extension_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', payload.sessionId)
    
    // Use userId from token
    userId = payload.userId
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid token' }),
      { status: 401, headers: corsHeaders }
    )
  }
}
```

**10 Endpoints to Update**:
1. profile-get
2. profile-patch
3. resumes-get
4. resumes-post
5. answers-get
6. answers-post
7. applications-get
8. applications-patch
9. settings-get
10. settings-patch

---

## For Extension

### Login Flow
```javascript
// 1. Open login popup
const window = chrome.windows.create({
  url: 'https://joborbit.com/extension-auth?popup=true',
  type: 'popup'
})

// 2. Listen for message from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'EXTENSION_TOKEN_RECEIVED') {
    // 3. Store token
    chrome.storage.local.set({
      extensionToken: msg.token,
      sessionId: msg.sessionId,
      expiresAt: msg.expiresAt
    })
    // 4. Close popup and load data
  }
})
```

### API Calls
```javascript
// Get stored token
const { extensionToken } = await chrome.storage.local.get('extensionToken')

// Call API
fetch('https://joborbit.com/api/profile', {
  headers: {
    'X-Extension-Token': extensionToken
  }
})
```

### Token Refresh
```javascript
// When token expires
const response = await fetch('https://joborbit.com/api/extension/refresh', {
  method: 'POST',
  headers: {
    'X-Extension-Token': oldToken
  }
})

const data = await response.json()
if (data.extension_token) {
  // Store new token
  chrome.storage.local.set({
    extensionToken: data.extension_token,
    expiresAt: data.expires_at
  })
}
```

### Logout
```javascript
// Logout from extension
const { extensionToken } = await chrome.storage.local.get('extensionToken')

await fetch('https://joborbit.com/api/extension-logout', {
  method: 'POST',
  headers: {
    'X-Extension-Token': extensionToken
  },
  body: JSON.stringify({
    all_devices: false  // true to logout from all devices
  })
})

// Clear storage
chrome.storage.local.remove(['extensionToken', 'sessionId', 'expiresAt'])
```

---

## Testing

### 1. Test Login
```bash
# Open popup and login with Google
curl https://joborbit.com/extension-auth

# Should redirect back with token
```

### 2. Test Token Creation
```bash
curl -X GET https://joborbit.com/functions/v1/extension-session \
  -H "Authorization: Bearer SUPABASE_JWT"

# Response should include extension_token
```

### 3. Test API Call
```bash
curl https://joborbit.com/api/profile \
  -H "X-Extension-Token: EXTENSION_TOKEN"

# Should return profile data
```

### 4. Test Logout
```bash
curl -X POST https://joborbit.com/functions/v1/extension-logout \
  -H "X-Extension-Token: EXTENSION_TOKEN"

# Should return success
```

### 5. Test Revoked Token
```bash
# After logout, try same token
curl https://joborbit.com/api/profile \
  -H "X-Extension-Token: EXTENSION_TOKEN"

# Should return 401 Unauthorized
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Token expired or revoked. Get new token from `/extension-session` |
| EXTENSION_TOKEN_SECRET not found | Add to Supabase Edge Functions environment |
| Session not in database | Check `extension_sessions` table created successfully |
| Token doesn't validate | Verify JWT signature, check secret key matches |
| All devices still logged in | Need to add `is_active = false` when revoking |

---

## File Structure

```
supabase/
├── migrations/
│   └── 20260202000000_create_extension_sessions_table.sql
└── functions/
    ├── extension-session/index.ts (✅ Ready)
    ├── extension-logout/index.ts (✅ Ready)
    └── [10 API endpoints] (⏳ Need token verification)

src/
├── api/v1/
│   ├── middleware/
│   │   └── extension-token.ts (✅ Ready)
│   └── endpoints/
│       └── extension.ts (✅ Ready)
└── hooks/
    └── useExtensionAPI.ts (✅ Ready)

.env
└── VITE_EXTENSION_TOKEN_SECRET (⚠️ Needs value)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `EXTENSION_SESSION_ARCHITECTURE.md` | Full architecture docs |
| `EXTENSION_SESSION_IMPLEMENTATION_SUMMARY.md` | What's done, what's left |
| `src/api/v1/middleware/extension-token.ts` | Token handling |
| `src/hooks/useExtensionAPI.ts` | API calls for extension |
| `supabase/functions/extension-session/index.ts` | Create session endpoint |
| `supabase/functions/extension-logout/index.ts` | Logout endpoint |

---

## Implementation Checklist

- [ ] Generate secret key
- [ ] Set VITE_EXTENSION_TOKEN_SECRET in .env
- [ ] Deploy database migration
- [ ] Deploy extension-session function
- [ ] Deploy extension-logout function
- [ ] Set EXTENSION_TOKEN_SECRET in Supabase
- [ ] Add token verification to profile-get
- [ ] Add token verification to profile-patch
- [ ] Add token verification to resumes-get
- [ ] Add token verification to resumes-post
- [ ] Add token verification to answers-get
- [ ] Add token verification to answers-post
- [ ] Add token verification to applications-get
- [ ] Add token verification to applications-patch
- [ ] Add token verification to settings-get
- [ ] Add token verification to settings-patch
- [ ] Test login flow
- [ ] Test API calls
- [ ] Test token refresh
- [ ] Test logout

---

## One More Thing

The extension now stores tokens in `chrome.storage.local`:
```javascript
{
  "extension_session_token": "eyJ...",
  "extension_session_id": "550e8400-...",
  "extension_token_expires_at": 1707094800000
}
```

**Never store in `localStorage`** - use `chrome.storage` for extension data!

---

**Ready?** → Deploy → Test → Ship 🚀

For detailed docs, see `EXTENSION_SESSION_ARCHITECTURE.md`.
