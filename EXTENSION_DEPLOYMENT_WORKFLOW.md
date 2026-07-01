# Extension Session Deployment Workflow

## Complete Step-by-Step Deployment Guide

This document provides a detailed workflow for deploying the extension session system from development to production.

---

## Phase 0: Preparation (5 minutes)

### 0.1 Generate Secret Key
```bash
openssl rand -base64 32
# Output: kS7p+QmV5KzW2nQ8xJ9gH4rL1mY6bD3eF5tU0sV7wX=
```

### 0.2 Set Environment Variables

**In project `.env`:**
```
VITE_EXTENSION_TOKEN_SECRET=kS7p+QmV5KzW2nQ8xJ9gH4rL1mY6bD3eF5tU0sV7wX=
```

**Test it loads:**
```bash
npm run build  # Should succeed now
```

---

## Phase 1: Database Deployment (15 minutes)

### 1.1 Create Migration
✅ Already created: `supabase/migrations/20260202000000_create_extension_sessions_table.sql`

### 1.2 Deploy Migration
```bash
cd your-project
supabase migration up 20260202000000_create_extension_sessions_table.sql
```

### 1.3 Verify Table Created
```bash
# Check in Supabase Dashboard:
Database → Tables → Should see "extension_sessions"

# Verify columns:
- id (UUID)
- user_id (UUID)
- session_token_hash (TEXT)
- device_name (TEXT)
- browser (TEXT)
- os (TEXT)
- is_active (BOOLEAN)
- is_revoked (BOOLEAN)
- expires_at (TIMESTAMP)
- last_used_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

### 1.4 Test RLS Policies
```sql
-- In Supabase SQL Editor:
SELECT COUNT(*) FROM extension_sessions;  -- Should return 0 (empty)
```

✅ **Checkpoint**: Table created with RLS enabled

---

## Phase 2: Edge Functions Deployment (20 minutes)

### 2.1 Deploy extension-session Function
```bash
supabase functions deploy extension-session
```

**Verify in Supabase Dashboard:**
- Functions → extension-session
- Should show "Active"

### 2.2 Deploy extension-logout Function
```bash
supabase functions deploy extension-logout
```

**Verify:**
- Functions → extension-logout
- Should show "Active"

### 2.3 Set Environment Variables in Supabase

In Supabase Dashboard:
1. Project Settings → Edge Functions → Environment
2. Add variable:
   - Name: `EXTENSION_TOKEN_SECRET`
   - Value: `kS7p+QmV5KzW2nQ8xJ9gH4rL1mY6bD3eF5tU0sV7wX=`
3. Click "Save"
4. All functions will auto-restart with new env

### 2.4 Test extension-session Function
```bash
# Get a valid Supabase JWT first:
# 1. Sign in to https://joborbit.com
# 2. Open DevTools → Application → Local Storage
# 3. Copy token from "sb-supabase-auth-token"

curl -X GET https://your-project.supabase.co/functions/v1/extension-session \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "User-Agent: Chrome"

# Expected response:
{
  "success": true,
  "data": {
    "extension_token": "eyJ...",
    "session_id": "550e8400-..."
  }
}
```

### 2.5 Check Database Entry
```bash
# In Supabase SQL Editor:
SELECT id, user_id, device_name, is_active, expires_at 
FROM extension_sessions 
ORDER BY created_at DESC 
LIMIT 5;

# Should show your test session
```

✅ **Checkpoint**: Edge functions deployed and tested

---

## Phase 3: Update API Endpoints (2-3 hours)

### 3.1 Add Middleware Template to Each Endpoint

For each of these 10 endpoints:
```
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
```

### 3.2 Template Code

Add this to the top of each edge function:

```typescript
import { jwtVerify } from 'https://esm.sh/jose@5.0.0'

// Helper: Verify extension token
async function verifyExtensionToken(
  token: string,
  secret: string
): Promise<{ sessionId: string; userId: string }> {
  const signingKey = new TextEncoder().encode(secret)
  const verified = await jwtVerify(token, signingKey)
  const payload = verified.payload as any

  if (payload.aud !== 'extension') {
    throw new Error('Invalid token audience')
  }

  if (!payload.sessionId || !payload.userId) {
    throw new Error('Invalid token payload')
  }

  return {
    sessionId: payload.sessionId,
    userId: payload.userId,
  }
}
```

### 3.3 In Main Handler

Add this before the main logic:

```typescript
// Check for extension token
const extensionToken = req.headers.get('x-extension-token')
let userId: string

if (extensionToken) {
  // Extension request - verify token
  try {
    const tokenPayload = await verifyExtensionToken(
      extensionToken,
      Deno.env.get('EXTENSION_TOKEN_SECRET') || ''
    )

    // Verify session in database
    const { data: session, error: sessionError } = await supabase
      .from('extension_sessions')
      .select('*')
      .eq('id', tokenPayload.sessionId)
      .eq('user_id', tokenPayload.userId)
      .eq('is_active', true)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      console.warn('Invalid extension session')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Session invalid or expired',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Update last_used_at
    await supabase
      .from('extension_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenPayload.sessionId)

    userId = tokenPayload.userId
  } catch (error) {
    console.error('Token verification failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid token',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
} else {
  // Regular request - get user from Supabase auth
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  userId = user.id
}

// Now use userId for queries
// All existing code continues the same...
```

### 3.4 Test Each Endpoint

After updating each endpoint:

```bash
# Test with extension token
curl -X GET https://your-project.supabase.co/functions/v1/profile-get \
  -H "X-Extension-Token: YOUR_EXTENSION_TOKEN"

# Should return 200 with profile data

# Test without token (should fail)
curl -X GET https://your-project.supabase.co/functions/v1/profile-get

# Should return 401
```

✅ **Checkpoint**: All 10 endpoints updated and tested

---

## Phase 4: Frontend Integration (30 minutes)

### 4.1 Update Extension Bridge

Already mostly done in `src/lib/auth/extension-bridge.ts`

### 4.2 Test Login Flow

1. Open extension popup
2. Click "Sign in with Job Orbit"
3. Go through OAuth
4. Should receive extension_token
5. Token should be stored in chrome.storage.local

### 4.3 Test API Calls

From extension:
```javascript
// Get token
const { extensionToken } = await chrome.storage.local.get('extensionToken')

// Call API with token
const response = await fetch('https://joborbit.com/api/profile', {
  headers: {
    'X-Extension-Token': extensionToken
  }
})

// Should return profile data
```

### 4.4 Test Token Refresh

Token should auto-refresh when within 5 minutes of expiry

### 4.5 Test Logout

Click logout → Session should be revoked in database

✅ **Checkpoint**: Extension integration complete

---

## Phase 5: Testing & Validation (1 hour)

### 5.1 Functionality Tests

- [ ] **Login**: User can sign in via extension
- [ ] **Session Creation**: Session created in DB
- [ ] **API Calls**: Extension can call all API endpoints
- [ ] **Token Validation**: Invalid tokens rejected (401)
- [ ] **Token Refresh**: Expired tokens auto-refresh
- [ ] **Logout**: Session revoked after logout
- [ ] **Single Device**: Can logout one device
- [ ] **All Devices**: Can logout all devices
- [ ] **Session Tracking**: Can see sessions in DB
- [ ] **Device Metadata**: Browser/OS captured

### 5.2 Security Tests

- [ ] **Token Hash**: Raw tokens not stored in DB
- [ ] **JWT Validation**: Signature verified
- [ ] **RLS Policies**: Can only access own sessions
- [ ] **Session Revocation**: Revoked tokens rejected
- [ ] **Expiration**: Expired tokens rejected
- [ ] **CORS**: Only allowed origins
- [ ] **Rate Limiting**: (Future enhancement)

### 5.3 Performance Tests

- [ ] **Token Creation**: < 200ms
- [ ] **API Calls**: < 500ms
- [ ] **Database Lookup**: < 100ms
- [ ] **Token Refresh**: < 500ms

### 5.4 Error Cases

- [ ] Missing token → 401
- [ ] Invalid signature → 401
- [ ] Expired token → Auto-refresh or 401
- [ ] Revoked session → 401
- [ ] Invalid database state → 401
- [ ] Network error → Graceful retry

✅ **Checkpoint**: All tests passing

---

## Phase 6: Production Deployment (30 minutes)

### 6.1 Pre-Deploy Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Secrets set in production
- [ ] Database migrated
- [ ] Edge functions deployed
- [ ] API endpoints updated
- [ ] Extension tested
- [ ] Rollback plan ready

### 6.2 Deploy to Production

```bash
# 1. Build production bundle
npm run build

# 2. Deploy (via Vercel/your platform)
vercel deploy --prod

# 3. Verify functions
supabase functions deploy --project-ref YOUR_PROD_PROJECT_ID extension-session
supabase functions deploy --project-ref YOUR_PROD_PROJECT_ID extension-logout

# 4. Set production secrets
# In Supabase Dashboard → Edge Functions → Environment
# Update EXTENSION_TOKEN_SECRET for production
```

### 6.3 Post-Deploy Verification

```bash
# Test production endpoints
curl -X GET https://yourdomain.com/functions/v1/extension-session \
  -H "Authorization: Bearer PROD_JWT"

# Check logs
# Supabase Dashboard → Logs → Functions
# Should see successful calls
```

### 6.4 Monitor & Alert

- Check Supabase error logs
- Monitor token creation rate
- Check session table growth
- Monitor API performance

✅ **Checkpoint**: Deployed to production

---

## Rollback Plan

If something goes wrong:

### Option 1: Database Rollback
```bash
supabase migration down 20260202000000_create_extension_sessions_table.sql
```

### Option 2: Disable Functions
```bash
# In Supabase Dashboard:
# Functions → extension-session → Disable
# Functions → extension-logout → Disable
```

### Option 3: Remove Middleware from APIs
- Revert edge function updates (remove middleware)
- Revert to old token validation (Supabase JWT only)

### Option 4: Full Revert
```bash
# Revert code commits
git revert <commit-hash>
npm run build
vercel deploy --prod
```

---

## Monitoring & Maintenance

### Daily Checks
- [ ] No error spikes in Supabase logs
- [ ] Extension sessions table growing normally
- [ ] Token creation rate stable

### Weekly Checks
- [ ] Review session analytics
- [ ] Check for suspicious patterns
- [ ] Verify cleanup is removing expired sessions

### Monthly Checks
- [ ] Review security logs
- [ ] Check for token abuse
- [ ] Performance metrics
- [ ] Database query optimization

---

## Success Metrics

After deployment, track:

| Metric | Target | Status |
|--------|--------|--------|
| Token Creation | < 200ms | ? |
| API Call Latency | < 500ms | ? |
| Session Creation Success | > 99% | ? |
| Token Refresh Success | > 99% | ? |
| Session Revocation | Immediate | ? |
| Device Tracking | 100% | ? |
| Error Rate | < 0.1% | ? |

---

## Support & Documentation

**For Developers:**
- `EXTENSION_SESSION_ARCHITECTURE.md` - Complete architecture
- `EXTENSION_QUICK_START.md` - Quick reference
- `src/hooks/useExtensionAPI.ts` - API hook docs

**For DevOps:**
- `EXTENSION_SESSION_IMPLEMENTATION_SUMMARY.md` - Implementation status
- `EXTENSION_QUICK_START.md` - Deployment steps

**For Users:**
- Session management page in settings
- Device management
- Logout all devices

---

## Timeline Estimate

| Phase | Duration | Total |
|-------|----------|-------|
| Preparation | 5 min | 5 min |
| Database | 15 min | 20 min |
| Functions | 20 min | 40 min |
| API Endpoints | 2-3 hr | 3-3.5 hr |
| Integration | 30 min | 4 hr |
| Testing | 1 hr | 5 hr |
| Production | 30 min | 5.5 hr |

**Total**: ~5-6 hours

---

## Key Files Reference

| File | Purpose | Phase |
|------|---------|-------|
| `.env` | Secret key | 0 |
| `20260202000000_create_extension_sessions_table.sql` | DB schema | 1 |
| `extension-session/index.ts` | Create session | 2 |
| `extension-logout/index.ts` | Logout | 2 |
| `*-get/index.ts` | Middleware | 3 |
| `*-patch/index.ts` | Middleware | 3 |
| `extension-bridge.ts` | Integration | 4 |
| `useExtensionAPI.ts` | API calls | 4 |

---

## Troubleshooting

### Issue: Token creation fails
- Check EXTENSION_TOKEN_SECRET set
- Verify Supabase JWT is valid
- Check database table created

### Issue: API returns 401
- Verify X-Extension-Token header present
- Check token signature (decode at jwt.io)
- Check session exists in DB
- Check session not revoked

### Issue: Performance slow
- Check database indexes created
- Verify no slow queries
- Check Supabase quota
- Monitor network latency

---

**Version**: 1.0  
**Last Updated**: February 2, 2026  
**Status**: Ready to Deploy

Follow this workflow for reliable deployment! 🚀
