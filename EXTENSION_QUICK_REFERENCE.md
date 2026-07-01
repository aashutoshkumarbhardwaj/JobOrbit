# Extension API - Quick Reference

**Quick guide for implementing Chrome Extension authentication**

---

## 📍 Endpoints

### Session Endpoint
```
GET /functions/v1/extension-session
Authorization: Bearer <access_token>

Returns: { success, data: { session, user }, meta }
```

### Refresh Endpoint
```
POST /functions/v1/extension-refresh
Content-Type: application/json

Body: { refresh_token: "sbr_..." }
Returns: { success, data: { session, user }, meta }
```

---

## 🔑 Extension Background Script

```typescript
// Get session from storage
async function getExtensionSession() {
  const stored = await chrome.storage.local.get('jobOrbitSession')
  return stored.jobOrbitSession || null
}

// Verify session is still valid
async function verifyExtensionSession(token) {
  const response = await fetch('/functions/v1/extension-session', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.ok
}

// Call Job Orbit API with session
async function callJobOrbitAPI(endpoint, options = {}) {
  const session = await getExtensionSession()
  if (!session) throw new Error('Not authenticated')
  
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`
    }
  })
}

// Listen for popup messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SESSION') {
    getExtensionSession().then(session => sendResponse({ session }))
    return true
  }
  if (request.type === 'CALL_API') {
    callJobOrbitAPI(request.endpoint, request.options)
      .then(r => r.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }
})

// Listen for auth response from web app
window.addEventListener('message', (event) => {
  if (event.data.type === 'EXTENSION_AUTH_RESPONSE' && event.data.payload.success) {
    // Store session
    chrome.storage.local.set({
      jobOrbitSession: event.data.payload.session
    })
  }
})
```

---

## 🎨 Extension Popup

```html
<!-- popup.html -->
<button id="loginBtn">Sign in to Job Orbit</button>
<div id="userSection" style="display: none;">
  <p>Logged in as: <span id="userEmail"></span></p>
  <button id="logoutBtn">Sign out</button>
</div>

<script>
// Check if authenticated
chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
  if (response.session) {
    // Show user info
    document.getElementById('userSection').style.display = 'block'
    document.getElementById('userEmail').textContent = response.session.user.email
  }
})

// Sign in
document.getElementById('loginBtn').addEventListener('click', () => {
  window.open('https://joborbit.com/extension-auth', 'auth', 'width=500,height=700')
})

// Call API
document.getElementById('apiBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: 'CALL_API',
    endpoint: '/api/v1/profile',
    options: { method: 'GET' }
  }, (response) => {
    console.log('Profile:', response.data)
  })
})
</script>
```

---

## 🚀 Deploy Functions

```bash
# Deploy session endpoint
supabase functions deploy extension-session

# Deploy refresh endpoint
supabase functions deploy extension-refresh

# Verify
supabase functions list
```

---

## 🧪 Test Endpoints

```bash
# Get a token first (from browser console after logging in)
TOKEN="<your_access_token>"

# Test session endpoint
curl https://<project>.supabase.co/functions/v1/extension-session \
  -H "Authorization: Bearer $TOKEN"

# Test refresh endpoint
REFRESH_TOKEN="<your_refresh_token>"
curl -X POST https://<project>.supabase.co/functions/v1/extension-refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

---

## 📋 Auth Flow

```
1. Extension shows "Sign in" button
   ↓
2. User clicks button
   ↓
3. Opens /extension-auth window
   ↓
4. User signs in with Google/GitHub
   ↓
5. /extension-auth returns session to extension
   ↓
6. Extension stores in chrome.storage.local
   ↓
7. Extension can now call APIs with token
```

---

## ✅ Security Checklist

- ✅ Extension never has service-role key
- ✅ Extension only uses access tokens (JWT)
- ✅ Tokens expire automatically
- ✅ Auto-refresh prevents expired tokens
- ✅ RLS policies prevent data leaks
- ✅ CORS headers configured
- ✅ Sessions stored in extension only

---

## 🔄 Token Refresh Flow

```typescript
// In extension background script
async function callAPIWithRefresh(endpoint, options) {
  let session = await getExtensionSession()
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000)
  if (session.expires_at < now) {
    // Refresh token
    const response = await fetch('/functions/v1/extension-refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: session.refresh_token })
    })
    
    const data = await response.json()
    if (data.success) {
      session = data.data.session
      await chrome.storage.local.set({ jobOrbitSession: session })
    } else {
      throw new Error('Failed to refresh token')
    }
  }
  
  // Make API call with valid token
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`
    }
  })
}
```

---

## 📚 API Call Examples

### Get Profile
```typescript
chrome.runtime.sendMessage({
  type: 'CALL_API',
  endpoint: '/api/v1/profile',
  options: { method: 'GET' }
}, (response) => {
  console.log('Profile:', response.data)
})
```

### Get Resumes
```typescript
chrome.runtime.sendMessage({
  type: 'CALL_API',
  endpoint: '/api/v1/resumes',
  options: { method: 'GET' }
}, (response) => {
  console.log('Resumes:', response.data)
})
```

### Create Application
```typescript
chrome.runtime.sendMessage({
  type: 'CALL_API',
  endpoint: '/api/v1/applications',
  options: {
    method: 'POST',
    body: JSON.stringify({
      company_name: 'Acme Corp',
      job_title: 'Engineer'
    })
  }
}, (response) => {
  console.log('Created:', response.data)
})
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Error | Token expired, call /extension-refresh |
| CORS Error | Check endpoint has CORS headers |
| No Session | User not authenticated, show login |
| Token Invalid | Clear storage, prompt user to login |
| API Returns 401 | Auto-refresh token and retry |

---

## 📖 Full Documentation

For complete details, see:
- `EXTENSION_SESSION_FLOW.md` - Complete guide
- `EXTENSION_INTEGRATION_EXAMPLE.md` - Full code examples
- `EXTENSION_API_IMPLEMENTATION_SUMMARY.md` - Architecture details

---

## 🎯 Implementation Steps

1. Create extension background script (copy from guide)
2. Create extension popup (copy from guide)
3. Deploy `/extension-session` function
4. Deploy `/extension-refresh` function
5. Test locally with extension
6. Deploy to Chrome Web Store

---

**Status**: Ready to Implement ✅  
**Complexity**: Medium  
**Time to Implement**: 2-4 hours
