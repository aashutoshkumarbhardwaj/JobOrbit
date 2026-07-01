# Chrome Extension Integration Guide

## 📋 Overview

Job Orbit and the Chrome Extension now work as a unified product with:
- ✅ Single sign-on (SSO) - Login once, access both
- ✅ Synchronized authentication state
- ✅ Automatic data loading on login
- ✅ Bidirectional communication
- ✅ Real-time data sync
- ✅ Seamless user experience

## 🔄 Authentication Flow

### Login from Web App

```
User clicks Login on Web App
    ↓
User authenticates (Email/Password/OAuth)
    ↓
Supabase creates session
    ↓
Session stored in localStorage
    ↓
Web app notifies Chrome Extension
    ↓
Extension loads user data automatically
    ↓
Extension is now authenticated
```

### Login from Chrome Extension

```
User clicks Login on Chrome Extension
    ↓
Extension opens authentication UI
    ↓
User authenticates
    ↓
Extension gets JWT token
    ↓
Extension sends token to web app via messaging API
    ↓
Web app establishes session
    ↓
Web app data automatically loads
```

## 🔌 Communication Protocol

### Message Types

#### 1. GET_SESSION
**From Extension → Web App**
```javascript
chrome.runtime.sendMessage({
  type: 'GET_SESSION',
  payload: {}
}, response => {
  console.log('Current session:', response.session)
})
```

**Response:**
```json
{
  "success": true,
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890
  },
  "user": {
    "id": "user-123",
    "email": "user@example.com"
  }
}
```

#### 2. GET_PROFILE
**From Extension → Web App**
```javascript
chrome.runtime.sendMessage({
  type: 'GET_PROFILE'
}, response => {
  console.log('User profile:', response.data)
})
```

#### 3. GET_RESUMES
**From Extension → Web App**
```javascript
chrome.runtime.sendMessage({
  type: 'GET_RESUMES'
}, response => {
  console.log('User resumes:', response.data)
})
```

#### 4. GET_SETTINGS
**From Extension → Web App**
```javascript
chrome.runtime.sendMessage({
  type: 'GET_SETTINGS'
}, response => {
  console.log('User settings:', response.data)
})
```

#### 5. GET_ANSWERS
**From Extension → Web App**
```javascript
chrome.runtime.sendMessage({
  type: 'GET_ANSWERS'
}, response => {
  console.log('AI answers:', response.data)
})
```

#### 6. GET_APPLICATIONS
**From Extension → Web App**
```javascript
chrome.runtime.sendMessage({
  type: 'GET_APPLICATIONS'
}, response => {
  console.log('Job applications:', response.data)
})
```

#### 7. SESSION_UPDATE
**From Web App → Extension (automatic)**
```javascript
// Web app sends this when session changes
{
  type: 'SESSION_UPDATE',
  payload: {
    session: { /* session data */ },
    user: { /* user data */ }
  }
}
```

#### 8. WEB_APP_READY
**From Web App → Extension (automatic)**
```javascript
{
  type: 'WEB_APP_READY',
  payload: {
    url: 'https://joborbit.com/dashboard',
    timestamp: '2024-01-20T10:30:00Z'
  }
}
```

#### 9. LOGIN_SUCCESS
**From Extension → Web App**
```javascript
{
  type: 'LOGIN_SUCCESS',
  payload: {
    user: { /* user data */ }
  }
}
```

#### 10. LOGOUT
**From Extension → Web App**
```javascript
{
  type: 'LOGOUT',
  payload: {}
}
```

## 📱 Implementation in Chrome Extension

### Setup Extension Communication

```typescript
// In extension popup or background script
import { initializeExtensionBridge } from '@/lib/auth/extension-bridge'

// Initialize bridge to handle messages
initializeExtensionBridge()

// Listen for web app ready
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WEB_APP_READY') {
    console.log('Web app is ready')
    // Extension can now communicate with web app
    loadUserData()
  }
})
```

### Get User Session

```typescript
async function getSession() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'GET_SESSION'
    }, response => {
      if (response.success) {
        resolve(response.session)
      } else {
        reject(new Error(response.error))
      }
    })
  })
}
```

### Load All User Data

```typescript
async function loadUserData() {
  try {
    const [profile, resumes, settings, answers, applications] = await Promise.all([
      getExtensionData('GET_PROFILE'),
      getExtensionData('GET_RESUMES'),
      getExtensionData('GET_SETTINGS'),
      getExtensionData('GET_ANSWERS'),
      getExtensionData('GET_APPLICATIONS'),
    ])

    console.log('User data loaded:', {
      profile,
      resumes,
      settings,
      answers,
      applications,
    })
  } catch (error) {
    console.error('Failed to load user data:', error)
  }
}

async function getExtensionData(type: string) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type }, response => {
      if (response.success) {
        resolve(response.data)
      } else {
        reject(new Error(response.error))
      }
    })
  })
}
```

### Handle Login from Extension

```typescript
async function handleExtensionLogin(email: string, password: string) {
  try {
    // Extension authenticates with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Notify web app of successful login
    chrome.runtime.sendMessage({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: data.user,
      }
    })

    // Load all user data
    await loadUserData()

    return data.session
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}
```

### Handle Logout from Extension

```typescript
async function handleExtensionLogout() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    // Notify web app
    chrome.runtime.sendMessage({
      type: 'LOGOUT',
      payload: {}
    })

    // Clear extension UI
    clearExtensionUI()
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
```

## 🎯 Data Loading Pipeline

### Automatic Data Loading on Authentication

**When user authenticates (either web or extension):**

```
1. useAuth() hook detects authentication
   ↓
2. AuthenticatedDataProvider triggers useAuthenticatedData()
   ↓
3. All 5 data types fetched in parallel:
   - Profile (basic info, address, professional details)
   - Resumes (uploaded resume files)
   - Settings (user preferences)
   - AI Answers (pre-written interview answers)
   - Applications (job applications)
   ↓
4. Data cached in React Context
   ↓
5. Real-time subscriptions enabled
   ↓
6. Extension receives data via messaging API
```

### Usage in Components

```typescript
import { useAuthenticatedDataContext, useUserProfile } from '@/context/AuthenticatedDataContext'

export function MyComponent() {
  // Get all data
  const { profile, resumes, settings, answers, applications, isLoading } = 
    useAuthenticatedDataContext()

  // Or get specific data
  const profile = useUserProfile()
  const resumes = useUserResumes()
  const settings = useUserSettings()
  const answers = useAIAnswers()
  const applications = useApplications()

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <p>Profile: {profile?.first_name}</p>
      <p>Resumes: {resumes?.length}</p>
      <p>Applications: {applications?.length}</p>
    </div>
  )
}
```

## 🔐 Security Considerations

### Token Management

- ✅ Tokens stored securely in Supabase
- ✅ Auto-refresh on expiration
- ✅ Never exposed in extension code
- ✅ Only access_token transmitted

### Data Access

- ✅ RLS policies enforce user_id matching
- ✅ Extension cannot access other users' data
- ✅ All requests validated server-side
- ✅ Edge Functions verify JWT tokens

### Cross-Origin Communication

- ✅ Message validation on both sides
- ✅ Type checking for all messages
- ✅ Error handling for failed requests
- ✅ Timeout protection

## 🚀 Deployment Checklist

### Web App

- [ ] AuthenticatedDataProvider added to App.tsx
- [ ] useAuthenticatedData hook working
- [ ] Extension bridge initialized
- [ ] Message handlers implemented
- [ ] Real-time subscriptions enabled
- [ ] Error handling in place

### Chrome Extension

- [ ] Message listener setup
- [ ] Session retrieval working
- [ ] Data loading on login
- [ ] Session update handling
- [ ] Logout functionality
- [ ] Error handling

### Database

- [ ] Edge Functions deployed
- [ ] RLS policies enforced
- [ ] JWT validation working
- [ ] Real-time subscriptions enabled

## 🧪 Testing

### Test Web App Login

1. Open Job Orbit in browser
2. Click Login
3. Authenticate with email/OAuth
4. Check browser console:
   - `User data loaded successfully`
   - `Session shared with extension`
5. Verify dashboard loads with user data

### Test Extension Login

1. Open Chrome Extension
2. Click Login
3. Authenticate with email/OAuth
4. Check extension logs:
   - `Web app acknowledged login`
   - `User data loaded successfully`
5. Verify extension UI shows user data

### Test Data Synchronization

1. Login to web app
2. Update profile (change name)
3. Check extension receives update (via real-time subscription)
4. Update resume in extension
5. Check web app shows update

### Test Session Persistence

1. Login to web app
2. Close browser (close all tabs)
3. Open Chrome Extension
4. Extension should still be authenticated
5. Open Job Orbit in browser
6. Web app should load with user data

## ❓ FAQ

**Q: Can user login from only extension or only web app?**
A: Yes. Once authenticated on either side, both are automatically authenticated via shared session.

**Q: What if extension or web app is closed?**
A: The other remains authenticated. Session persists across browser sessions.

**Q: How often are data updates synced?**
A: Real-time via Supabase subscriptions. Updates appear instantly on both sides.

**Q: Can extension access web app data directly?**
A: No. Extension must use messaging API to request data from web app, which validates via RLS.

**Q: What if user logs out from web app?**
A: Extension receives LOGOUT message and clears its session automatically.

**Q: Can multiple devices share the same account?**
A: Yes. Each device has its own session token. Logout from one device doesn't affect others.

## 🔗 Related Documentation

- [Authentication System](./SUPABASE_AUTH_IMPLEMENTATION.md)
- [Edge Functions & Security](./EDGE_FUNCTIONS_AND_SECURITY.md)
- [Profile System](./PROFILE_SYSTEM_IMPLEMENTATION.md)
- [Chrome Extension Auth](./src/lib/auth/chrome-extension-auth.ts)
- [Extension Bridge](./src/lib/auth/extension-bridge.ts)
