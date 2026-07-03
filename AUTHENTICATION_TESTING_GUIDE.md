# Authentication Testing Guide - Complete Manual Testing Procedures

**Last Updated**: July 3, 2026  
**Status**: Ready for Testing  
**Build Status**: ✅ All files compile with no errors

---

## PART 1: WEB AUTHENTICATION TESTING

### Test 1.1: Google OAuth Sign In

**Objective**: Verify Google OAuth flow works correctly

**Steps**:
1. Go to http://localhost:5173/login
2. Click "Sign in with Google"
3. You'll be redirected to Google consent screen
4. Select account or sign in with Google account
5. Grant permissions
6. Should redirect to `/auth/callback`
7. Session should be established
8. Should redirect to `/dashboard`

**Expected Results**:
- ✅ Redirected to `/dashboard`
- ✅ User info displayed (email, name)
- ✅ Session stored in Supabase Auth
- ✅ API calls include Bearer token
- ✅ Browser console shows: "Session shared with extension"

**Verification**:
- Check DevTools → Application → Cookies (look for `sb-*` cookies)
- Check Network tab for `/auth/callback` with code parameter
- Check console logs for "Session established" message

---

### Test 1.2: GitHub OAuth Sign In

**Objective**: Verify GitHub OAuth flow works correctly

**Steps**:
1. Go to http://localhost:5173/login
2. Click "Sign in with GitHub"
3. You'll be redirected to GitHub authorization screen
4. Click "Authorize"
5. Should redirect to `/auth/callback`
6. Session should be established
7. Should redirect to `/dashboard`

**Expected Results**:
- ✅ Redirected to `/dashboard`
- ✅ GitHub username displayed as user identifier
- ✅ Session stored in Supabase Auth

---

### Test 1.3: Session Persistence After Refresh

**Objective**: Verify session survives browser refresh

**Steps**:
1. Sign in with Google/GitHub (use Test 1.1 or 1.2)
2. Go to any protected page (e.g., `/dashboard`)
3. Refresh page (Cmd+R or F5)
4. Wait for auth context to initialize

**Expected Results**:
- ✅ Page shows loading spinner briefly
- ✅ No redirect to login
- ✅ Page loads normally
- ✅ User info still displayed
- ✅ Console shows: "✅ Session established" or similar

**Verification**:
- Session should load within 5 seconds (timeout is 5s)
- No error messages in console

---

### Test 1.4: Session Recovery After Tab Close/Reopen

**Objective**: Verify session persists across browser sessions

**Steps**:
1. Sign in with Google/GitHub
2. Note the session info displayed
3. Close the browser completely (or just the tab)
4. Reopen the URL: http://localhost:5173/dashboard
5. Wait for page to load

**Expected Results**:
- ✅ Automatically logged in (if within session expiry time)
- ✅ Same user displayed
- ✅ No login required
- ✅ Page loads normally

---

### Test 1.5: Multi-Tab Synchronization

**Objective**: Verify login/logout syncs across tabs

**Steps**:

**Part A - Login Sync**:
1. Open http://localhost:5173 in Tab 1
2. Open http://localhost:5173/login in Tab 2
3. In Tab 2: Sign in with Google
4. Check Tab 1

**Part B - Logout Sync**:
1. Both tabs should show logged in
2. In Tab 1: Click Logout/Settings → Sign Out
3. Check Tab 2

**Expected Results**:
- ✅ Both tabs update within 1 second
- ✅ Auth state changes reflected everywhere
- ✅ Tab 2 shows logged in user within 1 second
- ✅ Both tabs redirect to login after logout

---

### Test 1.6: Logout - Single Device

**Objective**: Verify single device logout works

**Steps**:
1. Sign in with Google/GitHub
2. Go to Profile page
3. Click "Sign Out" button
4. Observe redirect

**Expected Results**:
- ✅ Redirected to `/login` or `/` (landing page)
- ✅ Session cleared from Supabase Auth
- ✅ Cookies removed
- ✅ Cannot access protected pages without re-login

**Verification**:
- Try to access `/dashboard` - should redirect to login
- Check DevTools → Application → Cookies (no Supabase session cookies)

---

### Test 1.7: Logout - All Devices

**Objective**: Verify logout all devices works (if implemented)

**Steps**:
1. Sign in with Google on Device/Browser A
2. Sign in with same account on Device/Browser B
3. In Device A: Settings → Sign Out All Devices
4. Check Device B

**Expected Results**:
- ✅ Device A session cleared
- ✅ Device B shows "Session expired" or redirects to login within 30 seconds
- ✅ Cannot access protected pages on either device

**Note**: This requires backend implementation to check session revocation

---

### Test 1.8: Protected Routes Redirect

**Objective**: Verify unauthenticated users can't access protected pages

**Steps**:
1. Logout (if signed in)
2. Try to access: http://localhost:5173/dashboard
3. Try to access: http://localhost:5173/applications
4. Try to access: http://localhost:5173/profile

**Expected Results**:
- ✅ Each attempt redirects to `/login`
- ✅ No error messages
- ✅ Login page loads

---

### Test 1.9: Token Refresh on Expiration

**Objective**: Verify automatic token refresh works

**Steps**:
1. Sign in with Google/GitHub
2. Wait for access token to expire (typically 1 hour)
   - Or manually trigger by opening DevTools → Network → make API call
3. Make API request (click on a page that loads data)

**Expected Results**:
- ✅ Token automatically refreshed in background
- ✅ API call succeeds with new token
- ✅ No "Unauthorized" error
- ✅ User stays logged in

**Verification**:
- Check Network tab: look for automatic token refresh requests
- Check localStorage: `sb-*` tokens should be updated

---

### Test 1.10: Expired Session Handling

**Objective**: Verify graceful handling of permanent session expiration

**Steps**:
1. Sign in with Google/GitHub
2. Note your session
3. In Supabase dashboard: Manually revoke the session
4. Go back to Job Orbit and try to access data (click to a page that loads API data)
5. Observe behavior after 3 failed refresh attempts

**Expected Results**:
- ✅ After 3 failed token refresh attempts, redirected to login
- ✅ Clear error message shown (if implemented)
- ✅ Session state cleared
- ✅ User must sign in again

---

### Test 1.11: Session Timeout Warning (NEW)

**Objective**: Verify session timeout warning appears before expiration

**Steps**:
1. Sign in with Google/GitHub
2. Go to any protected page
3. Do NOT interact with the page
4. Wait for approximately 50 minutes (or reduce timeout for testing)
5. Or: Manually check if warning logic works by modifying session time

**Expected Results**:
- ✅ Modal appears with warning: "Session Expiring Soon"
- ✅ Shows time remaining (e.g., "9m 45s remaining")
- ✅ "Extend Session" button shown
- ✅ "Logout" button shown

**Testing Without Waiting 50 Minutes**:
- Edit `src/hooks/useSessionTimeout.ts`
- Change `warningThreshold = 600` to `warningThreshold = 6000` (10 sec)
- Sign in, watch for warning after 50 minutes → 50 seconds

---

### Test 1.12: Session Extension

**Objective**: Verify user can extend session before expiration

**Steps**:
1. Trigger session warning (see Test 1.11)
2. Modal shows: "Extend Session" button
3. Click "Extend Session"
4. Observe modal behavior

**Expected Results**:
- ✅ Button shows loading state: "Extending..."
- ✅ Session token refreshed
- ✅ Modal closes automatically
- ✅ User can continue working

---

---

## PART 2: CHROME EXTENSION AUTHENTICATION TESTING

### Test 2.1: Extension Auth Page - Already Logged In

**Objective**: Verify already logged in users can immediately connect extension

**Setup**:
- Have Job Orbit web app open and user signed in

**Steps**:
1. In extension: Click "Sign in with Job Orbit"
2. Browser opens new tab to: http://localhost:5173/extension-auth
3. Page should detect user is already logged in

**Expected Results**:
- ✅ Shows "Connected!" screen
- ✅ Displays user email
- ✅ Shows "Syncing with extension..." message
- ✅ Window closes after 1 second (or extension closes it)
- ✅ Extension is authenticated

**Verification**:
- Check browser console for: "✅ Session delivered to extension"
- Check extension background script logs (if available)

---

### Test 2.2: Extension Auth Page - Not Logged In

**Objective**: Verify new users can sign in via extension

**Setup**:
- Logged out of Job Orbit

**Steps**:
1. In extension: Click "Sign in with Job Orbit"
2. Browser opens new tab to: http://localhost:5173/extension-auth
3. Page should show login options:
   - Sign in with Google
   - Sign in with GitHub
   - Sign in with Email
4. Click "Sign in with Google"

**Expected Results**:
- ✅ Shows three login buttons
- ✅ Clicking Google redirects to OAuth consent
- ✅ After consent, redirects to `/auth/callback`

---

### Test 2.3: OAuth Callback Creates Extension Session

**Objective**: Verify `/auth/callback` creates extension session and returns token

**Steps**:
1. Use Test 2.2 setup
2. Complete OAuth flow (Google/GitHub)
3. Monitor browser DevTools → Console for messages
4. Observe `/auth/callback` execution

**Expected Results**:
- ✅ Console logs:
  - "🔐 Auth callback handler started"
  - "🔌 Extension auth detected - returning token as JSON"
  - "🔌 Creating extension session..."
  - "✅ Extension session created"
  - "📤 Returning extension token to caller"
- ✅ Edge function `/extension-session` called
- ✅ Database entry created in `extension_sessions`

**Verification**:
- Check browser Network tab: GET `/extension-session` request
- Response should include: `extension_token`, `session_id`, `expires_in`
- Check Supabase dashboard: `extension_sessions` table should have new entry

---

### Test 2.4: Token Sent to Extension

**Objective**: Verify token delivered to extension via messaging

**Steps**:
1. Complete Test 2.3
2. Open extension background script console (if available)
3. Observe message reception

**Expected Results**:
- ✅ Browser console shows: "📤 Sending extension session to extension..."
- ✅ Stored in `window.__EXTENSION_AUTH_RESPONSE`
- ✅ Message sent via `chrome.runtime.sendMessage()`
- ✅ Extension receives message with payload:
  ```json
  {
    "type": "EXTENSION_AUTH_SUCCESS",
    "payload": {
      "extensionToken": "eyJ...",
      "sessionId": "uuid",
      "expiresAt": 1234567890,
      "user": { "id": "uuid", "email": "user@example.com" }
    }
  }
  ```

---

### Test 2.5: Token Storage in Extension

**Objective**: Verify extension stores token in chrome.storage.local

**Steps**:
1. Complete Test 2.4
2. In extension background script, check chrome.storage.local

**Expected Results**:
- ✅ Token stored under key: `extension_session_token`
- ✅ Session ID stored under: `extension_session_id`
- ✅ Expiration time stored under: `extension_session_token_expires_at`

**Verification** (if extension code accessible):
```javascript
chrome.storage.local.get(['extension_session_token', 'extension_session_id'], (result) => {
  console.log('Stored token:', result.extension_session_token.substring(0, 50) + '...')
  console.log('Session ID:', result.extension_session_id)
})
```

---

### Test 2.6: Extension Makes API Calls

**Objective**: Verify extension can make API calls with token

**Steps**:
1. Complete Test 2.5 (extension authenticated)
2. In extension: Click a button that makes API call (e.g., "Get Profile")
3. Monitor API call

**Expected Results**:
- ✅ Request includes header: `X-Extension-Token: eyJ...`
- ✅ Request succeeds (200 response)
- ✅ Extension displays returned data
- ✅ No 401 Unauthorized error

**Verification**:
- Check extension Network tab (if available)
- Check DevTools Network tab for requests with `X-Extension-Token` header

---

### Test 2.7: Token Expiration (1 Hour)

**Objective**: Verify token expires after 1 hour

**Steps**:
1. Complete Test 2.5 (extension authenticated)
2. Wait 1 hour
3. Try to make API call in extension

**Expected Results**:
- ✅ After 1 hour: API returns 401 Unauthorized
- ✅ Extension detects 401 and clears token
- ✅ Extension shows login prompt: "Session expired"

**Testing Without Waiting 1 Hour**:
- In extension development: Manually set expiresAt to 5 seconds from now
- Wait 6 seconds and try API call

---

### Test 2.8: Token Refresh

**Objective**: Verify token automatically refreshes before expiration

**Steps**:
1. Authenticate extension (Test 2.5)
2. Make API call before token expires
3. Make another API call after token expires (but before 1-hour total)

**Expected Results**:
- ✅ First call succeeds with original token
- ✅ Second call automatically refreshes token
- ✅ Second call succeeds with new token
- ✅ No user interaction needed

---

### Test 2.9: Session Revocation - Single Device

**Objective**: Verify session revocation works for single device

**Steps**:
1. Authenticate extension on Device A (Test 2.5)
2. Go to web app Settings → "Active Sessions"
3. Find the device (e.g., "Chrome on MacOS")
4. Click "Logout"
5. Go back to extension

**Expected Results**:
- ✅ Session marked as revoked in database
- ✅ Next API call from extension returns 401
- ✅ Extension detects 401 and shows login prompt
- ✅ Other devices remain authenticated

**Verification**:
- Check Supabase `extension_sessions` table: session marked `is_revoked=true`

---

### Test 2.10: Session Revocation - All Devices

**Objective**: Verify logout all devices revokes all extension sessions

**Steps**:
1. Authenticate extension on Device A
2. Authenticate extension on Device B (different browser)
3. Go to web app Settings
4. Click "Logout from All Devices"
5. Check both Device A and B

**Expected Results**:
- ✅ All sessions marked as revoked
- ✅ Both extensions show login prompt
- ✅ Both need to sign in again

---

### Test 2.11: Extension Session Survives Browser Restart

**Objective**: Verify extension session persists across browser restarts

**Steps**:
1. Authenticate extension (Test 2.5)
2. Close browser completely (kill process)
3. Reopen browser
4. Open extension
5. Try to make API call

**Expected Results**:
- ✅ Token still in `chrome.storage.local`
- ✅ Token still valid (within 1-hour window)
- ✅ API call succeeds without re-authenticating
- ✅ Extension shows as logged in

---

### Test 2.12: Extension Gets User Profile

**Objective**: Verify extension can fetch authenticated user profile

**Steps**:
1. Authenticate extension (Test 2.5)
2. In extension: Click "Get Profile" or similar button
3. Observe API call and response

**Expected Results**:
- ✅ API endpoint: `GET /api/profiles/me` called
- ✅ Includes header: `X-Extension-Token: ...`
- ✅ Response includes user profile:
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```

---

---

## PART 3: CROSS-PLATFORM SYNC TESTING

### Test 3.1: Login on Web Syncs to Extension

**Objective**: Verify logging in on web automatically syncs to extension

**Setup**:
- Extension installed and ready
- Web app in another tab

**Steps**:
1. In web app tab: Sign in with Google
2. Complete auth flow
3. Check extension immediately

**Expected Results**:
- ✅ Extension automatically shows as logged in (within 1 second)
- ✅ No need to sign in again in extension
- ✅ Extension can immediately make API calls

---

### Test 3.2: Logout on Web Invalidates Extension

**Objective**: Verify logging out on web invalidates extension session

**Setup**:
- Both web and extension logged in

**Steps**:
1. In web app: Click Logout
2. Observe extension
3. In extension: Try to make API call

**Expected Results**:
- ✅ Web app shows login page
- ✅ Extension session invalidated (within 1 second)
- ✅ Extension API calls return 401
- ✅ Extension shows login prompt

---

### Test 3.3: Multi-Tab Session Sync

**Objective**: Verify session syncs across multiple browser tabs

**Setup**:
- Multiple tabs of Job Orbit open

**Steps**:
1. Tab A: Sign in with Google
2. Tab B: Refresh page
3. Tab C: Try to access `/dashboard`

**Expected Results**:
- ✅ Tab B shows logged in (within 1 second)
- ✅ Tab C shows logged in user
- ✅ All tabs share same session

---

---

## PART 4: ERROR HANDLING & EDGE CASES

### Test 4.1: Network Error During OAuth

**Objective**: Verify graceful handling of network errors

**Steps**:
1. Disconnect network (or use DevTools offline mode)
2. Click "Sign in with Google"
3. Observe error handling

**Expected Results**:
- ✅ Error message shown: "Network error" or similar
- ✅ Can try again
- ✅ No blank page or infinite loading

---

### Test 4.2: OAuth Timeout

**Objective**: Verify timeout handling during OAuth

**Steps**:
1. Click "Sign in with Google"
2. During OAuth process, block response (DevTools → Network → throttle)
3. Wait beyond timeout threshold

**Expected Results**:
- ✅ Timeout error shown
- ✅ Can retry
- ✅ Page doesn't hang indefinitely

---

### Test 4.3: Session Expired During Page Interaction

**Objective**: Verify handling of session expiration while user is active

**Steps**:
1. Sign in with Google
2. Let session expire (manually in Supabase)
3. Try to load data (click a button)

**Expected Results**:
- ✅ API returns 401
- ✅ Token refresh attempted
- ✅ After 3 failed attempts: redirected to login
- ✅ Clear error message

---

### Test 4.4: Invalid Extension Token

**Objective**: Verify invalid token handling

**Steps**:
1. Extension authenticated
2. Manually set invalid token in chrome.storage.local: `extension_session_token = "invalid"`
3. Try to make API call

**Expected Results**:
- ✅ API returns 401 Unauthorized
- ✅ Extension detects 401
- ✅ Clears invalid token
- ✅ Shows login prompt

---

### Test 4.5: Tampered Extension Token

**Objective**: Verify tampered token detection

**Steps**:
1. Extension authenticated and has token
2. Manually modify token in chrome.storage.local (change 1 character)
3. Try to make API call

**Expected Results**:
- ✅ JWT signature verification fails
- ✅ API returns 401 Unauthorized
- ✅ Token cleared
- ✅ Extension shows login prompt

---

---

## PART 5: PERFORMANCE TESTING

### Test 5.1: Initial Auth Load Time

**Objective**: Verify auth initialization doesn't slow down app

**Steps**:
1. Open Job Orbit in new tab
2. Monitor Network tab timing
3. Check Time to Interactive (TTI)

**Expected Results**:
- ✅ Auth check completes within 5 seconds (our timeout)
- ✅ App renders even if auth check slower
- ✅ No loading spinner for more than 2 seconds

---

### Test 5.2: Token Refresh Performance

**Objective**: Verify token refresh doesn't block user

**Steps**:
1. Sign in
2. Trigger token refresh (make API call when token about to expire)
3. Try to interact with page during refresh

**Expected Results**:
- ✅ Token refresh happens in background
- ✅ User can interact with page (no freezing)
- ✅ Request retried automatically after refresh
- ✅ User sees no lag

---

### Test 5.3: Multiple Concurrent Requests

**Objective**: Verify multiple API requests work correctly

**Steps**:
1. Sign in
2. Quickly navigate between pages (Dashboard → Applications → Calendar)
3. Observe multiple API requests

**Expected Results**:
- ✅ All requests include proper auth headers
- ✅ All requests succeed (200 status)
- ✅ No race conditions
- ✅ No duplicate token refresh attempts

---

---

## AUTOMATION TESTING (Optional)

For automated testing, create test scripts:

```typescript
// Example: E2E test for Google OAuth
test('Google OAuth flow', async () => {
  await page.goto('http://localhost:5173/login')
  await page.click('button:has-text("Sign in with Google")')
  
  // Handle OAuth redirect (would need to mock or use real credentials)
  // ... OAuth flow ...
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('http://localhost:5173/dashboard')
  
  // Verify user info displayed
  await expect(page.locator('[data-test="user-email"]')).toBeVisible()
})
```

---

## TEST RESULTS TEMPLATE

Use this template to document your testing:

```markdown
# Test Results - July 3, 2026

## Web Authentication
- [ ] Test 1.1: Google OAuth - **PASSED/FAILED**
- [ ] Test 1.2: GitHub OAuth - **PASSED/FAILED**
- [ ] Test 1.3: Session Persistence - **PASSED/FAILED**
- [ ] Test 1.4: Session Recovery - **PASSED/FAILED**
- [ ] Test 1.5: Multi-Tab Sync - **PASSED/FAILED**
- [ ] Test 1.6: Logout Single - **PASSED/FAILED**
- [ ] Test 1.7: Logout All - **PASSED/FAILED**
- [ ] Test 1.8: Protected Routes - **PASSED/FAILED**
- [ ] Test 1.9: Token Refresh - **PASSED/FAILED**
- [ ] Test 1.10: Expired Session - **PASSED/FAILED**
- [ ] Test 1.11: Timeout Warning - **PASSED/FAILED**
- [ ] Test 1.12: Session Extension - **PASSED/FAILED**

## Extension Authentication
- [ ] Test 2.1: Already Logged In - **PASSED/FAILED**
- [ ] Test 2.2: Not Logged In - **PASSED/FAILED**
- [ ] Test 2.3: Session Creation - **PASSED/FAILED**
- [ ] Test 2.4: Token Delivery - **PASSED/FAILED**
- [ ] Test 2.5: Token Storage - **PASSED/FAILED**
- [ ] Test 2.6: API Calls - **PASSED/FAILED**
- [ ] Test 2.7: Token Expiration - **PASSED/FAILED**
- [ ] Test 2.8: Token Refresh - **PASSED/FAILED**
- [ ] Test 2.9: Single Revocation - **PASSED/FAILED**
- [ ] Test 2.10: All Devices Revocation - **PASSED/FAILED**
- [ ] Test 2.11: Persist After Restart - **PASSED/FAILED**
- [ ] Test 2.12: Get Profile - **PASSED/FAILED**

## Cross-Platform Sync
- [ ] Test 3.1: Login Sync - **PASSED/FAILED**
- [ ] Test 3.2: Logout Sync - **PASSED/FAILED**
- [ ] Test 3.3: Multi-Tab Sync - **PASSED/FAILED**

## Error Handling
- [ ] Test 4.1: Network Error - **PASSED/FAILED**
- [ ] Test 4.2: OAuth Timeout - **PASSED/FAILED**
- [ ] Test 4.3: Session Expired - **PASSED/FAILED**
- [ ] Test 4.4: Invalid Token - **PASSED/FAILED**
- [ ] Test 4.5: Tampered Token - **PASSED/FAILED**

## Performance
- [ ] Test 5.1: Initial Load - **PASSED/FAILED**
- [ ] Test 5.2: Token Refresh - **PASSED/FAILED**
- [ ] Test 5.3: Concurrent Requests - **PASSED/FAILED**

## Notes
...any issues or observations...
```

---

## TROUBLESHOOTING

### Extension Not Receiving Token

**Symptoms**: Extension shows "Not Authenticated" after OAuth

**Diagnosis**:
1. Check browser console for errors
2. Check if `/auth/callback` is being called
3. Check Network tab for `/extension-session` request

**Solution**:
- Ensure `VITE_EXTENSION_TOKEN_SECRET` is set in Supabase
- Ensure edge function is deployed
- Check browser console for specific error message

### Session Expires Too Quickly

**Symptoms**: User logged out after few minutes

**Diagnosis**:
1. Check token expiration time in JWT
2. Check `extension_sessions` table: `expires_at` column

**Solution**:
- Verify `expiresInSeconds = 3600` in edge function
- Check if system time is correct (clock skew)

### API Calls Return 401

**Symptoms**: Extension API calls get 401 Unauthorized

**Diagnosis**:
1. Check if `X-Extension-Token` header present in request
2. Check if token is valid (not expired, not revoked)
3. Check if token matches database entry

**Solution**:
- Ensure `addExtensionTokenToHeaders()` is called
- Check token expiration: `hasValidExtensionToken()`
- Check database: `extension_sessions` table for valid session

### Token Not Syncing to Extension

**Symptoms**: Browser shows token created but extension doesn't have it

**Diagnosis**:
1. Check if `chrome.runtime.sendMessage()` is working
2. Check if extension listening for message
3. Check `window.__EXTENSION_AUTH_RESPONSE` in DevTools console

**Solution**:
- Verify extension background script has message listener
- Check extension `manifest.json` permissions
- Use fallback: check `window.__EXTENSION_AUTH_RESPONSE`

---

**Report Generated**: July 3, 2026  
**Testing Framework**: Manual + E2E (recommended: Playwright/Cypress)  
**Status**: Ready for comprehensive testing
