# Extension Implementation Checklist

**Complete step-by-step checklist to implement Chrome Extension with Job Orbit**

---

## Phase 1: Backend Setup (1 hour)

### Deploy Edge Functions
- [ ] Deploy `extension-session` function
  ```bash
  supabase functions deploy extension-session
  ```
- [ ] Deploy `extension-refresh` function
  ```bash
  supabase functions deploy extension-refresh
  ```
- [ ] Verify both functions are active
  ```bash
  supabase functions list
  ```
- [ ] Test `extension-session` endpoint
  - Get access token from browser console
  - Run curl command from EXTENSION_QUICK_REFERENCE.md
  - Verify returns session object

### Configure Supabase
- [ ] Enable JWT in Supabase Auth settings
- [ ] Verify CORS headers are set
- [ ] Check service-role key is NOT exposed
- [ ] Monitor function logs for errors

---

## Phase 2: Update Web App (30 min)

### Add Extension Utilities
- [ ] Verify `src/api/v1/endpoints/extension.ts` exists
- [ ] Verify functions are exported:
  - [ ] `getExtensionSession()`
  - [ ] `verifyExtensionSession()`
  - [ ] `refreshExtensionSession()`

### Update App Routes
- [ ] Verify `/extension-auth` route exists
- [ ] Test `/extension-auth` loads properly
- [ ] Verify session is returned to extension

### Test Web App
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Verify landing page loads
- [ ] Test login flow
- [ ] Navigate to `/extension-auth`
- [ ] Verify page loads and handles auth

---

## Phase 3: Extension Development (3-4 hours)

### Create Extension Structure
- [ ] Create `manifest.json`
  ```json
  {
    "manifest_version": 3,
    "name": "Job Orbit",
    "permissions": ["storage", "tabs"],
    "host_permissions": ["https://joborbit.com/*"],
    "background": {"service_worker": "background.js"},
    "action": {"default_popup": "popup.html"}
  }
  ```

- [ ] Create `background.js` (use code from EXTENSION_QUICK_REFERENCE.md)
  - [ ] `getExtensionSession()` function
  - [ ] `verifyExtensionSession()` function
  - [ ] `callJobOrbitAPI()` function
  - [ ] `refreshExtensionSession()` function
  - [ ] Message listener for chrome.runtime.onMessage
  - [ ] Session storage handler

- [ ] Create `popup.html` (use code from EXTENSION_QUICK_REFERENCE.md)
  - [ ] Login section with button
  - [ ] User info section (hidden by default)
  - [ ] Logout button
  - [ ] Simple styling

- [ ] Create `popup.js` (use code from EXTENSION_QUICK_REFERENCE.md)
  - [ ] Check authentication on load
  - [ ] Show/hide sections based on auth
  - [ ] Handle login button
  - [ ] Handle logout button
  - [ ] Handle API calls

### Build Extension
- [ ] Compile TypeScript if used
- [ ] Minify JavaScript
- [ ] Test all functions work
- [ ] Check for console errors

---

## Phase 4: Local Testing (1-2 hours)

### Load Extension in Chrome
- [ ] Go to `chrome://extensions/`
- [ ] Enable "Developer mode" (top right)
- [ ] Click "Load unpacked"
- [ ] Select extension folder
- [ ] Verify extension appears in list

### Test Authentication Flow
- [ ] Click extension icon
- [ ] See "Sign in to Job Orbit" message
- [ ] Click login button
- [ ] `/extension-auth` page opens
- [ ] Click "Sign in with Google"
- [ ] Sign in with test account
- [ ] Return to extension
- [ ] Extension shows user email
- [ ] Session stored in chrome.storage.local

### Test API Calls
- [ ] Open extension popup
- [ ] Call GET /api/v1/profile
- [ ] Verify profile data returns
- [ ] Call GET /api/v1/resumes
- [ ] Verify resumes list returns
- [ ] Call POST /api/v1/applications
- [ ] Verify application created

### Test Token Refresh
- [ ] Wait for token to expire (or modify expiry time)
- [ ] Make API call
- [ ] Verify auto-refresh happens
- [ ] Verify new token is stored
- [ ] Verify API call succeeds with new token

### Test Error Handling
- [ ] Sign out from Job Orbit
- [ ] Try to call API from extension
- [ ] Verify 401 error is handled
- [ ] Verify user can sign back in
- [ ] Delete session from storage
- [ ] Try to use extension
- [ ] Verify prompts user to login

### Test CORS
- [ ] Check browser console for CORS errors
- [ ] Verify all CORS headers present
- [ ] Test from different origins

---

## Phase 5: Production Preparation (1 hour)

### Update URLs
- [ ] Change `WEB_APP_URL` from localhost to production
- [ ] Update Supabase project URLs
- [ ] Verify all endpoints use production URLs

### Security Review
- [ ] Verify no service-role key in extension
- [ ] Verify tokens are stored securely
- [ ] Verify no sensitive data in logs
- [ ] Verify CORS is properly configured
- [ ] Verify token refresh works

### Create Chrome Web Store Assets
- [ ] Take screenshots of extension (1280x800)
- [ ] Write extension description
- [ ] Create extension icon (128x128)
- [ ] Write privacy policy
- [ ] Prepare terms of service

### Prepare Extension Package
- [ ] Build production version
- [ ] Remove console.log statements
- [ ] Minify all code
- [ ] Create production zip
  ```bash
  zip -r joborbit-extension.zip \
    manifest.json \
    background.js \
    popup.html \
    popup.js \
    icons/
  ```

---

## Phase 6: Publishing (30 min - 1 day)

### Chrome Web Store Submission
- [ ] Create Chrome Developer account
- [ ] Pay $5 registration fee
- [ ] Go to Chrome Web Store Developer Console
- [ ] Click "Create new item"
- [ ] Upload extension zip
- [ ] Fill in extension details
  - [ ] Name: "Job Orbit"
  - [ ] Description: Job application tracker
  - [ ] Category: Productivity
  - [ ] Language: English
- [ ] Upload screenshots
- [ ] Set privacy policy URL
- [ ] Submit for review

### Review Process
- [ ] Wait for review (typically 1-3 days)
- [ ] Fix any issues Chrome identifies
- [ ] Resubmit if needed
- [ ] Check email for approval/rejection

### Post-Publication
- [ ] Share Chrome Web Store link
- [ ] Monitor for user reviews
- [ ] Fix bugs quickly
- [ ] Respond to user feedback

---

## Phase 7: Monitoring & Maintenance

### Monitor Performance
- [ ] Check Supabase function logs
- [ ] Monitor error rates
- [ ] Track token refresh rates
- [ ] Monitor API usage

### Handle Support
- [ ] Respond to user reviews
- [ ] Fix reported bugs
- [ ] Provide support

### Update Extension
- [ ] Release bug fixes
- [ ] Add new features
- [ ] Update dependencies
- [ ] Bump version number

---

## Code Snippets

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "Job Orbit",
  "version": "1.0.0",
  "description": "Track your job applications with AI-powered resume optimization",
  "permissions": ["storage", "tabs"],
  "host_permissions": [
    "https://joborbit.com/*",
    "https://*.supabase.co/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Job Orbit"
  },
  "icons": {
    "128": "icons/icon-128.png"
  }
}
```

### Key Functions (background.js)
```typescript
// MUST implement these:
- async getExtensionSession()
- async callJobOrbitAPI(endpoint, options)
- async refreshExtensionSession(refreshToken)
- chrome.runtime.onMessage.addListener()
- window.addEventListener('message') for auth response
```

### Key UI (popup.html)
```html
<!-- MUST include these: -->
<button id="loginBtn">Sign in to Job Orbit</button>
<div id="userSection" style="display: none;">
  <p>User: <span id="userEmail"></span></p>
  <button id="logoutBtn">Sign out</button>
</div>
```

---

## Testing Checklist

### Functional Tests
- [ ] User can login via extension
- [ ] Session is stored in chrome.storage.local
- [ ] Extension can call /api/v1/profile
- [ ] Extension can call /api/v1/resumes
- [ ] Extension can create applications
- [ ] Token auto-refreshes when expired
- [ ] User can logout
- [ ] Extension detects not authenticated

### Error Tests
- [ ] 401 error handled gracefully
- [ ] Network errors handled
- [ ] CORS errors handled
- [ ] Token refresh failures handled
- [ ] Missing session handled

### Security Tests
- [ ] No service-role key in storage
- [ ] No tokens in URLs
- [ ] No sensitive data in logs
- [ ] CORS headers present
- [ ] RLS policies enforced

### Performance Tests
- [ ] Extension loads quickly
- [ ] API calls < 1 second
- [ ] Token refresh < 500ms
- [ ] Memory usage reasonable
- [ ] No memory leaks

---

## Troubleshooting

### Extension Won't Load
- [ ] Check manifest.json syntax
- [ ] Verify all files in extension folder
- [ ] Check browser console for errors
- [ ] Try reloading extension

### API Calls Fail with 401
- [ ] Verify token is valid
- [ ] Check Authorization header
- [ ] Try refreshing token
- [ ] Verify user is authenticated

### CORS Errors
- [ ] Check endpoint returns CORS headers
- [ ] Verify origin is whitelisted
- [ ] Check Authorization header format

### Token Not Refreshing
- [ ] Check refresh_token exists
- [ ] Verify refresh endpoint working
- [ ] Check token expiration time
- [ ] Monitor function logs

---

## Success Criteria

✅ Extension installed in Chrome  
✅ User can login with Google/GitHub  
✅ Session stored and persists  
✅ API calls work with valid token  
✅ Tokens auto-refresh when expired  
✅ Errors handled gracefully  
✅ No service keys exposed  
✅ 401 errors prompt user to login  
✅ Published to Chrome Web Store  
✅ Users can install from store  

---

## Timeline Estimate

| Phase | Time | Status |
|-------|------|--------|
| Phase 1: Backend | 1 hour | Ready |
| Phase 2: Web App | 30 min | Ready |
| Phase 3: Extension | 3-4 hours | Ready |
| Phase 4: Testing | 1-2 hours | Ready |
| Phase 5: Production | 1 hour | Ready |
| Phase 6: Publishing | 30 min - 1 day | Ready |
| Phase 7: Monitoring | Ongoing | Ready |
| **Total** | **~8-10 hours** | **Ready** |

---

## Documentation to Reference

- EXTENSION_QUICK_REFERENCE.md - Copy & paste code
- EXTENSION_SESSION_FLOW.md - Complete guide
- EXTENSION_INTEGRATION_EXAMPLE.md - Full examples
- EXTENSION_API_IMPLEMENTATION_SUMMARY.md - Architecture

---

## Quick Commands

```bash
# Deploy functions
supabase functions deploy extension-session
supabase functions deploy extension-refresh

# Start local dev
npm run dev

# Load extension in Chrome
# Go to chrome://extensions/ → Load unpacked

# Test endpoint
curl https://<project>.supabase.co/functions/v1/extension-session \
  -H "Authorization: Bearer <token>"
```

---

**Status**: Ready to Implement ✅  
**Completion Time**: 8-10 hours  
**Difficulty**: Medium  
**Last Updated**: July 2, 2026
