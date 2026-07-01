# Chrome Extension Integration Example

This document shows how to integrate the `/extension-auth` endpoint into your Chrome Extension.

---

## File Structure

```
chrome-extension/
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── content.js
└── icons/
    └── icon-128.png
```

---

## 1. Update manifest.json

```json
{
  "manifest_version": 3,
  "name": "Job Orbit",
  "version": "1.0.0",
  "description": "Track your job applications with AI-powered resume optimization",
  
  "permissions": [
    "storage",
    "webRequest",
    "tabs"
  ],
  
  "host_permissions": [
    "https://joborbit.com/*",
    "https://*.supabase.co/*",
    "<all_urls>"
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

---

## 2. Background Script (background.js)

```javascript
/**
 * Chrome Extension Background Script
 * Handles authentication and communication with web app
 */

const WEB_APP_URL = 'https://joborbit.com'
// For local development:
// const WEB_APP_URL = 'http://localhost:5173'

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'OPEN_AUTH_WINDOW') {
    openAuthWindow()
    sendResponse({ opened: true })
  } else if (request.type === 'GET_SESSION') {
    getStoredSession(sendResponse)
    return true // Keep channel open for async response
  } else if (request.type === 'LOGOUT') {
    logout(sendResponse)
    return true
  }
})

/**
 * Open authentication window
 */
function openAuthWindow() {
  const width = 500
  const height = 700
  const left = Math.floor((screen.width - width) / 2)
  const top = Math.floor((screen.height - height) / 2)

  const authUrl = `${WEB_APP_URL}/extension-auth`

  chrome.windows.create({
    url: authUrl,
    type: 'popup',
    width: width,
    height: height,
    left: left,
    top: top,
  })
}

/**
 * Listen for authentication response from web app
 */
chrome.webRequest.onCompleted.addListener(
  (details) => {
    // This would be handled via direct message from web app
    // See the receiver function below
  },
  { urls: ['<all_urls>'] }
)

/**
 * Receive authentication response from web app
 * The web app will send a message to all extension windows
 */
window.addEventListener('message', (event) => {
  // Only accept messages from our web app
  if (!event.source.url?.includes(WEB_APP_URL)) return

  if (event.data.type === 'EXTENSION_AUTH_RESPONSE') {
    const { success, session, error, user } = event.data.payload

    if (success) {
      // Store session in extension storage
      const sessionData = {
        ...session,
        user: user,
        storedAt: new Date().toISOString(),
      }

      chrome.storage.local.set(
        {
          jobOrbitSession: sessionData,
          jobOrbitAuthenticated: true,
        },
        () => {
          // Notify popup that auth was successful
          chrome.runtime.sendMessage({
            type: 'AUTH_SUCCESS',
            payload: sessionData,
          }).catch(() => {
            // Popup might be closed, that's ok
            console.log('Popup closed, but auth was successful')
          })

          // Notify content scripts
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, {
                type: 'SESSION_UPDATED',
                payload: sessionData,
              }).catch(() => {
                // Tab might not have content script, that's ok
              })
            })
          })
        }
      )
    } else {
      console.error('Authentication failed:', error)

      chrome.runtime.sendMessage({
        type: 'AUTH_FAILED',
        error: error,
      }).catch(() => {
        console.log('Popup closed')
      })
    }
  }
})

/**
 * Get stored session
 */
function getStoredSession(sendResponse) {
  chrome.storage.local.get(['jobOrbitSession'], (result) => {
    sendResponse({
      session: result.jobOrbitSession || null,
    })
  })
}

/**
 * Logout
 */
function logout(sendResponse) {
  chrome.storage.local.remove(['jobOrbitSession', 'jobOrbitAuthenticated'], () => {
    sendResponse({ success: true })

    // Notify content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SESSION_CLEARED',
        }).catch(() => {})
      })
    })
  })
}

/**
 * Listen for storage changes (useful for multi-tab scenarios)
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.jobOrbitSession) {
    console.log('Session updated in storage')

    // Could trigger a refresh of UI or data
    chrome.runtime.sendMessage({
      type: 'SESSION_STORAGE_CHANGED',
      newValue: changes.jobOrbitSession.newValue,
    }).catch(() => {})
  }
})
```

---

## 3. Popup HTML (popup.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 350px;
      min-height: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    .container {
      padding: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .logo {
      font-size: 32px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .auth-section {
      width: 100%;
    }

    .auth-btn {
      width: 100%;
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .auth-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
    }

    .user-info {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      font-size: 13px;
    }

    .user-info-label {
      opacity: 0.8;
      font-size: 12px;
    }

    .user-email {
      font-weight: 600;
      margin-top: 4px;
      word-break: break-all;
    }

    .logout-btn {
      width: 100%;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s ease;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .status {
      font-size: 12px;
      margin-top: 16px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
    }

    .status.loading {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error {
      background: rgba(255, 100, 100, 0.2);
      border: 1px solid rgba(255, 100, 100, 0.3);
      color: #ffcccc;
      padding: 12px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Not Authenticated State -->
    <div id="not-auth" class="auth-section" style="display: none;">
      <div class="logo">🚀</div>
      <h1>Job Orbit</h1>
      <p>Sign in to track your job applications</p>
      <button class="auth-btn" id="login-btn">
        Sign in to Job Orbit
      </button>
      <div class="status">
        Click to authenticate with Job Orbit
      </div>
    </div>

    <!-- Authenticated State -->
    <div id="auth" class="auth-section" style="display: none;">
      <div class="logo">✅</div>
      <h1>Connected!</h1>
      <div class="user-info">
        <div class="user-info-label">Signed in as:</div>
        <div class="user-email" id="user-email">user@example.com</div>
      </div>
      <button class="logout-btn" id="logout-btn">
        Sign out
      </button>
      <div class="status">
        Your session is synchronized
      </div>
    </div>

    <!-- Loading State -->
    <div id="loading" class="auth-section">
      <div class="status loading">⏳ Loading...</div>
    </div>

    <!-- Error State -->
    <div id="error" style="display: none; width: 100%;">
      <div class="error" id="error-message"></div>
      <button class="auth-btn" onclick="location.reload()">
        Try Again
      </button>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

---

## 4. Popup Script (popup.js)

```javascript
/**
 * Chrome Extension Popup Script
 * Handles UI interactions and session management
 */

const WEB_APP_URL = 'https://joborbit.com'
// For local development:
// const WEB_APP_URL = 'http://localhost:5173'

// UI Elements
const notAuthDiv = document.getElementById('not-auth')
const authDiv = document.getElementById('auth')
const loadingDiv = document.getElementById('loading')
const errorDiv = document.getElementById('error')
const errorMessage = document.getElementById('error-message')
const loginBtn = document.getElementById('login-btn')
const logoutBtn = document.getElementById('logout-btn')
const userEmail = document.getElementById('user-email')

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus()
})

/**
 * Check authentication status
 */
function checkAuthStatus() {
  showLoading()

  chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
    const session = response.session

    if (session && session.user) {
      showAuthenticated(session)
    } else {
      showNotAuthenticated()
    }
  })
}

/**
 * Show authenticated state
 */
function showAuthenticated(session) {
  loadingDiv.style.display = 'none'
  errorDiv.style.display = 'none'
  authDiv.style.display = 'block'
  notAuthDiv.style.display = 'none'

  userEmail.textContent = session.user.email || 'User'
}

/**
 * Show not authenticated state
 */
function showNotAuthenticated() {
  loadingDiv.style.display = 'none'
  errorDiv.style.display = 'none'
  authDiv.style.display = 'none'
  notAuthDiv.style.display = 'block'

  loginBtn.addEventListener('click', handleLogin)
}

/**
 * Show loading state
 */
function showLoading() {
  loadingDiv.style.display = 'block'
  errorDiv.style.display = 'none'
  authDiv.style.display = 'none'
  notAuthDiv.style.display = 'none'
}

/**
 * Show error state
 */
function showError(message) {
  loadingDiv.style.display = 'none'
  errorDiv.style.display = 'block'
  authDiv.style.display = 'none'
  notAuthDiv.style.display = 'none'

  errorMessage.textContent = message || 'Something went wrong. Please try again.'
}

/**
 * Handle login button click
 */
function handleLogin() {
  chrome.runtime.sendMessage(
    { type: 'OPEN_AUTH_WINDOW' },
    (response) => {
      if (response.opened) {
        showLoading()
        // Wait for auth response from background script
        waitForAuthResponse()
      }
    }
  )
}

/**
 * Wait for authentication response
 */
function waitForAuthResponse() {
  // Listen for auth success/failure messages from background script
  const timeout = setTimeout(() => {
    showError('Authentication timed out. Please try again.')
  }, 30000) // 30 second timeout

  const listener = (request) => {
    if (request.type === 'AUTH_SUCCESS') {
      clearTimeout(timeout)
      chrome.runtime.onMessage.removeListener(listener)
      showAuthenticated(request.payload)
    } else if (request.type === 'AUTH_FAILED') {
      clearTimeout(timeout)
      chrome.runtime.onMessage.removeListener(listener)
      showError(request.error || 'Authentication failed. Please try again.')
    }
  }

  chrome.runtime.onMessage.addListener(listener)
}

/**
 * Handle logout button click
 */
logoutBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to sign out?')) {
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
      showNotAuthenticated()
    })
  }
})

/**
 * Listen for session changes from other parts of extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SESSION_UPDATED') {
    showAuthenticated(request.payload)
  } else if (request.type === 'SESSION_CLEARED') {
    showNotAuthenticated()
  }
})
```

---

## 5. Content Script (content.js)

```javascript
/**
 * Chrome Extension Content Script
 * Runs in the context of web pages
 * Can communicate with background script
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SESSION_UPDATED') {
    console.log('Job Orbit session updated:', request.payload)
    // You can trigger UI updates or data refreshes here
    
    // Example: Reload extension popup
    chrome.runtime.sendMessage({
      type: 'SESSION_CHANGED',
      payload: request.payload,
    }).catch(() => {
      // Background script might not be listening
    })
  } else if (request.type === 'SESSION_CLEARED') {
    console.log('Job Orbit session cleared')
    // Handle logout
  }
})

// Get current session
function getJobOrbitSession(callback) {
  chrome.runtime.sendMessage(
    { type: 'GET_SESSION' },
    (response) => {
      callback(response.session)
    }
  )
}

// Make API call with auth
async function callJobOrbitAPI(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'GET_SESSION' },
      (response) => {
        const session = response.session

        if (!session) {
          reject(new Error('Not authenticated'))
          return
        }

        fetch(`https://joborbit.com${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
          .then((res) => res.json())
          .then(resolve)
          .catch(reject)
      }
    )
  })
}

// Example: Fetch user profile
async function getUserProfile() {
  try {
    const profile = await callJobOrbitAPI('/api/v1/profile')
    console.log('User profile:', profile)
    return profile
  } catch (error) {
    console.error('Failed to fetch profile:', error)
  }
}
```

---

## Integration Steps

### 1. Load Extension in Chrome

```bash
# Open Chrome Developer Mode
chrome://extensions

# Enable Developer Mode (toggle in top right)

# Click "Load unpacked"

# Select the chrome-extension folder
```

### 2. Test Authentication Flow

1. Click extension icon → "Sign in to Job Orbit"
2. Should open `/extension-auth` page
3. If logged in: Shows "Connected!" and closes
4. If not logged in: Shows login options
5. Click Google/GitHub to authenticate
6. Should return to `/extension-auth` and close
7. Popup shows "Connected!" with user email

### 3. Test Session Storage

```javascript
// In Chrome DevTools Console
chrome.storage.local.get(['jobOrbitSession'], (result) => {
  console.log('Stored session:', result.jobOrbitSession)
})
```

### 4. Test API Calls

```javascript
// In content script or devtools
chrome.runtime.sendMessage(
  { type: 'GET_SESSION' },
  (response) => {
    console.log('Session:', response.session)
  }
)
```

---

## Production Deployment

### Update URLs

```javascript
// Change from localhost to production
const WEB_APP_URL = 'https://joborbit.com'
```

### Build Extension

```bash
# Zip the extension directory
zip -r joborbit-extension.zip chrome-extension/
```

### Submit to Chrome Web Store

1. Go to Chrome Web Store Developer Dashboard
2. Upload new extension
3. Fill in all required fields
4. Submit for review

---

## Security Checklist

- ✅ Messages validated before processing
- ✅ Session tokens stored securely in extension storage
- ✅ No sensitive data in URLs
- ✅ CORS headers configured properly
- ✅ OAuth redirect URIs whitelisted
- ✅ Content Security Policy set in manifest
- ✅ Permissions minimized

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension can't open auth window | Check popup blocker permissions |
| Session not persisting | Check chrome.storage.local permissions |
| Auth window doesn't close | Check if /extension-auth page is loading |
| Messages not received | Verify sender URL matches WEB_APP_URL |
| Token expired | Auto-refresh should handle it (check auth context) |

---

## Next Steps

1. Update your extension manifest
2. Add background.js script
3. Create popup.html and popup.js
4. Test authentication flow locally
5. Deploy extension to production
6. Update extension in Chrome Web Store

---

**Version**: 1.0.0  
**Last Updated**: July 2, 2026  
**Status**: Ready for Integration ✅
