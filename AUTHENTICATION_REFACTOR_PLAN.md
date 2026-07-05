# Authentication Architecture Refactor

## Current Problems Identified

### 1. **Duplicate AuthCallback Components**
- `/src/pages/AuthCallback.tsx` - Complex implementation with extension logic (527 lines)
- `/src/pages/auth/AuthCallback.tsx` - Minimal implementation (37 lines)
- **Router uses:** `/src/pages/AuthCallback.tsx` (the complex one)
- **Action:** Delete the minimal one at `/src/pages/auth/AuthCallback.tsx`

### 2. **Obsolete auth.ts File**
- `/src/lib/auth.ts` - Contains old OAuth URL generators and token management
- **Not imported anywhere** in the codebase
- Contains duplicate localStorage token management logic
- **Action:** Delete completely - all auth logic is in `AuthManager.ts`

### 3. **Wrong URL Construction in AuthCallback**
- Line 53 in `/src/pages/AuthCallback.tsx`:
  ```typescript
  const fullUrl = apiUrl.endsWith('/') ? `${apiUrl}extension-session` : `${apiUrl}/extension-session`
  ```
- This bypasses the API client and constructs URLs manually
- **Problem:** Uses raw fetch() instead of apiClient which has proper auth headers
- **Action:** Use `apiClient.get('/extension-session')` instead

### 4. **Inconsistent Token Usage**
- `apiClient` correctly gets Supabase access token from AuthManager
- But `AuthCallback` makes direct fetch() calls that bypass this
- **Action:** All API calls must go through apiClient

## Refactoring Strategy

### Phase 1: Remove Duplicates
1. Delete `/src/pages/auth/AuthCallback.tsx` (unused minimal version)
2. Delete `/src/lib/auth.ts` (obsolete, not imported)

### Phase 2: Fix AuthCallback URL Construction
1. Replace manual fetch() with `apiClient.get('/extension-session')`
2. Remove URL construction logic
3. Let apiClient handle baseUrl + headers

### Phase 3: Verify Authentication Flow
**Single Source of Truth:**
- `AuthManager.ts` - Session management (Supabase)
- `auth-context.tsx` - React context wrapper
- `apiClient` - All HTTP calls with auth headers
- `AuthCallback.tsx` - OAuth callback handler

**Token Flow:**
1. User logs in → Supabase session created
2. AuthManager stores session in memory
3. apiClient gets `session.access_token` from AuthManager
4. For extension: apiClient calls `/extension-session` with access_token
5. Backend creates extension_sessions DB entry + returns extension_token
6. Extension stores extension_token in chrome.storage

### Phase 4: Cleanup chrome-extension-auth.ts
- Most functions are unused
- Only `setupExtensionMessaging()` might be needed
- Audit and remove unused code

## Expected Outcome

**One Login Flow:**
```
Login → Supabase OAuth → AuthCallback → 
  ├─ Web: Redirect to /dashboard
  └─ Extension: Call apiClient.get('/extension-session') → Return token
```

**Token Management:**
- Supabase access_token: Managed by AuthManager
- Extension token: Stored by extension endpoint handlers
- No manual localStorage manipulation except via proper abstractions

**URL Construction:**
```typescript
// BEFORE (WRONG):
const fullUrl = `${apiUrl}/extension-session`
fetch(fullUrl, { headers: { Authorization: `Bearer ${token}` } })

// AFTER (CORRECT):
await apiClient.get('/extension-session')
// apiClient handles: baseUrl + endpoint + Authorization header
```
