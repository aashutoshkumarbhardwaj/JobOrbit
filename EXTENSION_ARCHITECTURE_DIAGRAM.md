# Chrome Extension Architecture Diagram

## 📐 Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                          │
├─────────────────────────────────────────────────────────────────┤
│  Popup UI         │   Content Script    │    Auth Window        │
│  (popup.html/js)  │   (content.js)      │   (auth.html/js)      │
└──────────┬────────┴──────────┬──────────┴──────────┬────────────┘
           │                   │                      │
           └───────────────────┼──────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MESSAGE BUS                               │
│  (Centralized Event System & Chrome Runtime Messages)           │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AUTH MANAGER                              │
│  • Login/Logout                                                  │
│  • OAuth Flow                                                    │
│  • Session Management                                            │
│  • Token Validation                                              │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE MANAGER                             │
│  • chrome.storage.local Operations                               │
│  • Cache Management                                              │
│  • Data Encryption                                               │
│  • Quota Management                                              │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API CLIENT                                │
│  • HTTP Request/Response                                         │
│  • Auto Token Attachment                                         │
│  • Retry Logic                                                   │
│  • Error Handling                                                │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SYNC MANAGER                              │
│  • Bidirectional Sync                                            │
│  • Conflict Resolution                                           │
│  • Offline Queue                                                 │
│  • Background Sync                                               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      JOB ORBIT BACKEND                           │
│  • Supabase Edge Functions                                       │
│  • Database (PostgreSQL)                                         │
│  • Authentication Service                                        │
│  • Real-time Updates                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### Authentication Flow
```
User (Popup)
    │
    ├─> Click "Sign In"
    │
    ▼
AuthManager.login()
    │
    ├─> Open OAuth Window
    │
    ▼
OAuth Provider (Google/GitHub/Microsoft)
    │
    ├─> User Authorizes
    │
    ▼
AuthManager.createExtensionSession()
    │
    ├─> Call ApiClient.supabaseFunction('extension-session')
    │
    ▼
ApiClient (Attach Supabase JWT)
    │
    ├─> POST /functions/v1/extension-session
    │
    ▼
Supabase Edge Function
    │
    ├─> Verify JWT
    ├─> Create extension_sessions record
    ├─> Generate Extension Token (JWT)
    │
    ▼
ApiClient receives response
    │
    ├─> Return to AuthManager
    │
    ▼
AuthManager.storeExtensionSession()
    │
    ├─> Call StorageManager.storeAuthData()
    │
    ▼
StorageManager
    │
    ├─> Write to chrome.storage.local
    ├─> Notify via MessageBus
    │
    ▼
MessageBus.publish('auth_state_changed')
    │
    ├─> Notify All Subscribers
    │
    ▼
Popup UI Updates (Show Connected State)
```

### Data Synchronization Flow
```
SyncManager.performFullSync()
    │
    ├─> Check Online Status
    │
    ▼
For each data type (profile, applications, resumes, settings, answers):
    │
    ├─> ApiClient.get('/endpoint')
    │       │
    │       ├─> Attach X-Extension-Token header
    │       ├─> Send HTTP Request
    │       │
    │       ▼
    │   Job Orbit API
    │       │
    │       ├─> Verify Extension Token
    │       ├─> Query Database
    │       ├─> Return Data
    │       │
    │       ▼
    │   ApiClient receives response
    │
    ├─> SyncManager.detectConflicts()
    │       │
    │       ├─> Compare cached vs server timestamps
    │       │
    │       ▼
    │   SyncManager.handleConflicts()
    │       │
    │       ├─> Apply resolution strategy
    │       │   • server_wins
    │       │   • client_wins
    │       │   • merge
    │       │
    │       ▼
    │   StorageManager.storeCache()
    │
    ├─> Update Local Cache
    │
    ▼
MessageBus.publish('sync_complete')
    │
    ├─> Notify UI Components
    │
    ▼
UI Refreshes with New Data
```

### Offline Data Capture Flow
```
User on Job Site (Content Script)
    │
    ├─> Detect Job Posting
    ├─> Click "Save to Job Orbit"
    │
    ▼
Content Script
    │
    ├─> Extract Job Data
    ├─> sendMessage to Background
    │
    ▼
Background Script
    │
    ├─> Receive 'SAVE_APPLICATION' message
    │
    ▼
Check Online Status
    │
    ├─> If ONLINE:
    │   │
    │   ▼
    │   ApiClient.post('/applications', jobData)
    │       │
    │       ├─> Attach Extension Token
    │       ├─> Send to Server
    │       │
    │       ▼
    │   Server saves job
    │       │
    │       ▼
    │   SyncManager.updateLocalCache()
    │
    ├─> If OFFLINE:
    │   │
    │   ▼
    │   StorageManager.addToOfflineQueue()
    │       │
    │       ├─> Store in chrome.storage.local
    │       │
    │       ▼
    │   MessageBus.publish('offline', 'queued')
    │
    ▼
When Back Online:
    │
    ├─> SyncManager.processOfflineQueue()
    │       │
    │       ├─> Retrieve queued operations
    │       ├─> Upload to server
    │       ├─> Clear queue
    │       │
    │       ▼
    │   MessageBus.publish('sync_complete')
```

---

## 🏗️ Component Responsibilities

### 1. Message Bus (message-bus.js)
**Purpose**: Centralized communication hub

**Responsibilities**:
- ✅ Pub/Sub event system
- ✅ Chrome runtime message routing
- ✅ Cross-context messaging (popup ↔ background ↔ content)
- ✅ Message queuing
- ✅ Request-response patterns

**Key Methods**:
- `publish(eventType, data)` - Broadcast event
- `subscribe(eventType, callback)` - Listen to events
- `sendToBackground(message)` - Send to background script
- `sendToContent(tabId, message)` - Send to content script
- `broadcast(message)` - Send to all contexts

**Dependencies**: None (foundational layer)

---

### 2. Storage Manager (storage-manager.js)
**Purpose**: All chrome.storage operations

**Responsibilities**:
- ✅ Read/write chrome.storage.local
- ✅ Data encryption (simple obfuscation)
- ✅ Cache management with TTL
- ✅ Storage quota monitoring
- ✅ Data migration

**Key Methods**:
- `get(key)` - Get single item
- `set(key, value, options)` - Set with TTL/encryption
- `storeAuthData(authData)` - Store auth tokens
- `storeCache(type, data)` - Cache with expiration
- `addToOfflineQueue(operation)` - Queue offline changes

**Dependencies**: None (foundational layer)

**Rules**:
- ❌ NO component should call `chrome.storage` directly
- ✅ ALL storage operations go through StorageManager

---

### 3. Auth Manager (auth-manager.js)
**Purpose**: Authentication lifecycle management

**Responsibilities**:
- ✅ OAuth flow coordination
- ✅ Extension token management
- ✅ Session validation
- ✅ Login/logout operations
- ✅ Token expiration handling

**Key Methods**:
- `login()` - Start OAuth flow
- `logout()` - Clear session
- `validateStoredToken()` - Check token validity
- `getAuthHeader()` - Get token for API calls
- `isLoggedIn()` - Check auth status

**Dependencies**:
- StorageManager (read/write auth data)
- MessageBus (publish auth events)
- ApiClient (create extension session)

**Rules**:
- ❌ NO direct chrome.storage access
- ✅ Uses StorageManager.storeAuthData()
- ✅ Publishes AUTH_STATE_CHANGED events

---

### 4. API Client (api-client.js)
**Purpose**: HTTP communication layer

**Responsibilities**:
- ✅ All fetch() operations
- ✅ Automatic token attachment
- ✅ Retry logic with exponential backoff
- ✅ Timeout handling
- ✅ Error standardization
- ✅ 401/403 handling

**Key Methods**:
- `get(endpoint, options)` - GET request
- `post(endpoint, body, options)` - POST request
- `supabaseFunction(name, options)` - Call Edge Function
- `request(endpoint, options)` - Generic request

**Dependencies**:
- AuthManager (get extension token)
- MessageBus (publish network events)

**Rules**:
- ❌ NO component should call `fetch()` directly
- ✅ ALL HTTP requests go through ApiClient
- ✅ Automatically attaches X-Extension-Token

---

### 5. Sync Manager (sync-manager.js)
**Purpose**: Data synchronization orchestration

**Responsibilities**:
- ✅ Download data from server
- ✅ Upload local changes
- ✅ Conflict detection & resolution
- ✅ Offline queue processing
- ✅ Background sync scheduling

**Key Methods**:
- `performFullSync()` - Sync all data types
- `syncDataType(type)` - Sync specific type
- `processOfflineQueue()` - Upload queued changes
- `detectConflicts()` - Find data conflicts
- `handleConflicts()` - Resolve with strategy

**Dependencies**:
- StorageManager (cache read/write, offline queue)
- ApiClient (HTTP requests)
- MessageBus (publish sync events)

**Data Types**:
- Profile
- Applications
- Resumes
- Settings
- AI Answers

**Conflict Resolution Strategies**:
- `server_wins` - Server data takes precedence
- `client_wins` - Local changes uploaded
- `merge` - Intelligent merge of both

---

## 📦 File Structure

```
chrome-extension/
├── manifest.json                   # Extension configuration
├── background.js                   # Service worker (initializes managers)
├── popup.html                      # Popup UI
├── popup.js                        # Popup interactions
├── auth.html                       # OAuth page
├── auth.js                         # OAuth handling
├── content.js                      # Job site script
├── lib/
│   ├── message-bus.js             # ✅ Communication hub
│   ├── storage-manager.js         # ✅ Storage operations
│   ├── auth-manager.js            # ✅ Authentication
│   ├── api-client.js              # ✅ HTTP requests
│   └── sync-manager.js            # ✅ Data synchronization
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md
```

---

## 🔒 Security Rules

### NO Direct Access
```javascript
// ❌ WRONG - Direct chrome.storage access
await chrome.storage.local.set({ token: '...' })

// ✅ CORRECT - Through StorageManager
await storageManager.set('token', '...')
```

```javascript
// ❌ WRONG - Direct fetch
await fetch('https://api.joborbit.com/applications')

// ✅ CORRECT - Through ApiClient
await apiClient.get('/applications')
```

### Dependency Injection
```javascript
// ✅ Initialize with dependencies
await authManager.init({
  storageManager: extensionStorageManager,
  messageBus: extensionMessageBus
})

await syncManager.init({
  storageManager: extensionStorageManager,
  apiClient: extensionApiClient,
  messageBus: extensionMessageBus
})
```

---

## 🚀 Initialization Sequence

**In background.js**:
```javascript
1. Initialize Message Bus
   └─> extensionMessageBus.init()

2. Initialize Storage Manager
   └─> extensionStorageManager.init()

3. Initialize API Client
   └─> extensionApiClient.init(authManager)

4. Initialize Auth Manager
   └─> extensionAuthManager.init({
         storageManager,
         messageBus
       })

5. Initialize Sync Manager
   └─> extensionSyncManager.init({
         storageManager,
         apiClient,
         messageBus
       })

6. Ready to handle requests
```

---

## 📊 Benefits of This Architecture

### Before (Problems)
- ❌ Direct chrome.storage access everywhere
- ❌ Scattered fetch() calls
- ❌ Duplicate error handling
- ❌ No offline support
- ❌ Manual token management
- ❌ Inconsistent state management

### After (Solutions)
- ✅ Single StorageManager for all storage
- ✅ Single ApiClient for all HTTP
- ✅ Centralized error handling
- ✅ Offline queue with auto-sync
- ✅ Automatic token attachment
- ✅ Event-driven state updates via MessageBus
- ✅ Clean separation of concerns
- ✅ Easy to test and maintain

---

**🎉 ARCHITECTURE COMPLETE**

All components now follow clean architecture principles with proper separation of concerns and dependency injection.