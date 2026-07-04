/**
 * Chrome Extension Background Script (Service Worker)
 * Handles authentication, session management, and message routing
 */

// Import all managers in order
importScripts('./lib/message-bus.js')
importScripts('./lib/storage-manager.js')
importScripts('./lib/api-client.js')
importScripts('./lib/auth-manager.js')
importScripts('./lib/sync-manager.js')

console.log('🚀 Job Orbit Extension Background Script Starting...')

// Manager instances (will be initialized)
let messageBus = null
let storageManager = null
let apiClient = null
let authManager = null
let syncManager = null

/**
 * Initialize all managers in dependency order
 */
async function initializeManagers() {
  try {
    console.log('🔧 Initializing Extension Managers...')
    
    // 1. Initialize Message Bus (no dependencies)
    messageBus = extensionMessageBus
    await messageBus.init()
    
    // 2. Initialize Storage Manager (no dependencies)
    storageManager = extensionStorageManager
    await storageManager.init()
    
    // 3. Initialize Auth Manager (depends on: StorageManager, MessageBus)
    authManager = extensionAuthManager
    await authManager.init({
      storageManager,
      messageBus
    })
    
    // 4. Initialize API Client (depends on: AuthManager)
    apiClient = extensionApiClient
    await apiClient.init(authManager)
    
    // 5. Initialize Sync Manager (depends on: StorageManager, ApiClient, MessageBus)
    syncManager = extensionSyncManager
    await syncManager.init({
      storageManager,
      apiClient,
      messageBus
    })
    
    console.log('✅ All Extension Managers Initialized')
    
    // Publish extension ready event
    messageBus.publish(messageBus.messageTypes.EXTENSION_INSTALLED, {
      version: chrome.runtime.getManifest().version
    })
    
  } catch (error) {
    console.error('❌ Failed to initialize managers:', error)
  }
}

// Initialize on script load
initializeManagers()

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason)
  
  if (details.reason === 'install') {
    // First time installation
    console.log('🎉 Welcome to Job Orbit!')
    
    // Set default settings via StorageManager
    if (storageManager) {
      storageManager.set(storageManager.keys.extensionSettings, {
        autoCapture: true,
        notifications: true,
        syncEnabled: true
      })
    }
    
    // Publish installation event
    if (messageBus) {
      messageBus.publish(messageBus.messageTypes.EXTENSION_INSTALLED, {
        version: chrome.runtime.getManifest().version
      })
    }
  } else if (details.reason === 'update') {
    // Extension updated
    if (messageBus) {
      messageBus.publish(messageBus.messageTypes.EXTENSION_UPDATED, {
        previousVersion: details.previousVersion,
        version: chrome.runtime.getManifest().version
      })
    }
  }
})

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message.type, sender.tab?.url)
  
  // Handle async operations
  handleMessage(message, sender, sendResponse)
  
  // Return true to indicate we'll respond asynchronously
  return true
})

/**
 * Route messages to appropriate handlers
 */
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      // Authentication messages
      case 'GET_AUTH_STATE':
        await handleGetAuthState(sendResponse)
        break
        
      case 'LOGIN':
        await handleLogin(sendResponse)
        break
        
      case 'LOGOUT': 
        await handleLogout(sendResponse)
        break
        
      case 'OAUTH_COMPLETE':
        await handleOAuthComplete(message, sendResponse)
        break
        
      // Data sync messages
      case 'SYNC_DATA':
        await handleSyncData(message, sendResponse)
        break
        
      case 'GET_PROFILE':
        await handleGetProfile(sendResponse)
        break
        
      case 'GET_APPLICATIONS':
        await handleGetApplications(sendResponse)
        break
        
      case 'SAVE_APPLICATION':
        await handleSaveApplication(message, sendResponse)
        break
        
      // Web app communication
      case 'SESSION_UPDATE':
        await handleSessionUpdate(message, sendResponse)
        break
        
      case 'SESSION_INVALIDATED':
        await handleSessionInvalidated(sendResponse)
        break
        
      case 'WEB_APP_READY':
        await handleWebAppReady(message, sendResponse)
        break
        
      default:
        console.warn('Unknown message type:', message.type)
        sendResponse({ success: false, error: 'Unknown message type' })
    }
  } catch (error) {
    console.error('Error handling message:', error)
    sendResponse({ 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    })
  }
}

/**
 * Get current authentication state
 */
async function handleGetAuthState(sendResponse) {
  try {
    if (!authManager) {
      throw new Error('AuthManager not initialized')
    }
    
    const authState = authManager.getAuthState()
    sendResponse({ 
      success: true, 
      authState: authState 
    })
  } catch (error) {
    console.error('Failed to get auth state:', error)
    sendResponse({ 
      success: false, 
      error: error.message 
    })
  }
}

/**
 * Handle login request
 */
async function handleLogin(sendResponse) {
  try {
    console.log('🔐 Starting login process...')
    
    if (!authManager) {
      throw new Error('AuthManager not initialized')
    }
    
    await authManager.login()
    
    const authState = authManager.getAuthState()
    
    sendResponse({ 
      success: true, 
      authState: authState 
    })
    
  } catch (error) {
    console.error('Login failed:', error)
    sendResponse({ 
      success: false, 
      error: error.message || 'Login failed' 
    })
  }
}

/**
 * Handle logout request
 */
async function handleLogout(sendResponse) {
  try {
    console.log('🚪 Logging out...')
    
    if (!authManager) {
      throw new Error('AuthManager not initialized')
    }
    
    await authManager.logout()
    
    sendResponse({ 
      success: true, 
      message: 'Logged out successfully' 
    })
    
  } catch (error) {
    console.error('Logout failed:', error)
    sendResponse({ 
      success: false, 
      error: error.message || 'Logout failed' 
    })
  }
}

/**
 * Handle OAuth completion from auth window
 */
async function handleOAuthComplete(message, sendResponse) {
  try {
    console.log('✅ OAuth completed, creating extension session...')
    
    // The auth manager will handle session creation
    // This message is just for coordination between auth window and background
    
    sendResponse({ 
      success: true, 
      message: 'OAuth completion acknowledged' 
    })
    
  } catch (error) {
    console.error('OAuth completion error:', error)
    sendResponse({ 
      success: false, 
      error: error.message 
    })
  }
}

/**
 * Handle data synchronization
 */
async function handleSyncData(message, sendResponse) {
  try {
    if (!syncManager) {
      throw new Error('SyncManager not initialized')
    }
    
    if (!authManager || !authManager.isLoggedIn()) {
      sendResponse({ 
        success: false, 
        error: 'Not authenticated' 
      })
      return
    }

    // Trigger full sync
    await syncManager.performFullSync()
    
    const syncStats = syncManager.getSyncStats()
    
    sendResponse({ 
      success: true, 
      syncResult: syncStats
    })
    
  } catch (error) {
    console.error('Sync failed:', error)
    sendResponse({ 
      success: false, 
      error: error.message 
    })
  }
}

/**
 * Get user profile
 */
async function handleGetProfile(sendResponse) {
  try {
    if (!syncManager) {
      throw new Error('SyncManager not initialized')
    }
    
    if (!authManager || !authManager.isLoggedIn()) {
      sendResponse({ 
        success: false, 
        error: 'Not authenticated' 
      })
      return
    }

    // Get cached profile or sync from server
    const profile = await syncManager.getCachedData('profile')
    
    if (!profile) {
      // Sync from server if not cached
      await syncManager.forceSyncDataType('profile')
      const freshProfile = await syncManager.getCachedData('profile')
      
      sendResponse({ 
        success: true, 
        profile: freshProfile 
      })
    } else {
      sendResponse({ 
        success: true, 
        profile: profile 
      })
    }
    
  } catch (error) {
    console.error('Failed to get profile:', error)
    sendResponse({ 
      success: false, 
      error: error.message || error.type || 'Failed to get profile'
    })
  }
}

/**
 * Get job applications
 */
async function handleGetApplications(sendResponse) {
  try {
    if (!syncManager) {
      throw new Error('SyncManager not initialized')
    }
    
    if (!authManager || !authManager.isLoggedIn()) {
      sendResponse({ 
        success: false, 
        error: 'Not authenticated' 
      })
      return
    }

    // Get cached applications or sync from server
    const applications = await syncManager.getCachedData('applications')
    
    if (!applications) {
      // Sync from server if not cached
      await syncManager.forceSyncDataType('applications')
      const freshApplications = await syncManager.getCachedData('applications')
      
      sendResponse({ 
        success: true, 
        applications: freshApplications || []
      })
    } else {
      sendResponse({ 
        success: true, 
        applications: applications 
      })
    }
    
  } catch (error) {
    console.error('Failed to get applications:', error)
    sendResponse({ 
      success: false, 
      error: error.message || error.type || 'Failed to get applications'
    })
  }
}

/**
 * Save job application
 */
async function handleSaveApplication(message, sendResponse) {
  try {
    if (!authManager || !authManager.isLoggedIn()) {
      sendResponse({ 
        success: false, 
        error: 'Not authenticated' 
      })
      return
    }

    const applicationData = message.payload
    
    // Add extension-specific metadata
    const enrichedData = {
      ...applicationData,
      extension_saved: true,
      source: applicationData.source || 'extension',
      status: 'Applied', // Default status for extension-saved jobs
    }
    
    // Use SyncManager to handle the save (will queue if offline)
    if (navigator.onLine && syncManager) {
      const result = await apiClient.post('/applications', enrichedData)
      
      // Update local cache
      await syncManager.updateLocalCache('applications', result, 'add')
      
      // Publish data changed event
      if (messageBus) {
        messageBus.publish(messageBus.messageTypes.JOB_SAVED, result)
      }
      
      sendResponse({ 
        success: true, 
        application: result 
      })
    } else {
      // Queue for offline sync
      if (storageManager) {
        await storageManager.addToOfflineQueue({
          type: 'data_change',
          data: {
            type: 'applications',
            action: 'create',
            data: enrichedData
          }
        })
        
        sendResponse({ 
          success: true, 
          queued: true,
          message: 'Saved for sync when online'
        })
      } else {
        throw new Error('StorageManager not available')
      }
    }
    
  } catch (error) {
    console.error('Failed to save application:', error)
    sendResponse({ 
      success: false, 
      error: error.message || error.type || 'Failed to save application'
    })
  }
}

/**
 * Handle session update from web app
 */
async function handleSessionUpdate(message, sendResponse) {
  try {
    console.log('📱 Received session update from web app')
    
    // The web app is sharing its session with the extension
    // We should validate this and potentially update our stored session
    
    const { session, user } = message.payload
    
    if (session && user) {
      console.log('✅ Session shared by web app:', user.id)
    }
    
    sendResponse({ 
      success: true, 
      message: 'Session update received' 
    })
    
  } catch (error) {
    console.error('Session update error:', error)
    sendResponse({ 
      success: false, 
      error: error.message 
    })
  }
}

/**
 * Handle session invalidation from web app
 */
async function handleSessionInvalidated(sendResponse) {
  try {
    console.log('🚪 Web app session invalidated, logging out extension...')
    
    await extensionAuthManager.logout()
    
    sendResponse({ 
      success: true, 
      message: 'Extension session cleared' 
    })
    
  } catch (error) {
    console.error('Session invalidation error:', error)
    sendResponse({ 
      success: false, 
      error: error.message 
    })
  }
}

/**
 * Handle web app ready notification
 */
async function handleWebAppReady(message, sendResponse) {
  try {
    console.log('🌐 Web app is ready:', message.payload.url)
    
    sendResponse({ 
      success: true, 
      message: 'Extension acknowledged' 
    })
    
  } catch (error) {
    console.error('Web app ready error:', error)
    sendResponse({ 
      success: false, 
      error: error.message 
    })
  }
}

/**
 * Get API configuration
 */
async function getApiConfig() {
  // Use the API client configuration
  if (apiClient) {
    return apiClient.getConfig()
  }
  
  // Fallback
  return {
    baseUrl: 'https://joborbit.com',
    apiBaseUrl: 'https://joborbit.com/api/v1'
  }
}

/**
 * Handle tab updates (for content script communication)
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a job site
    const jobSites = [
      'linkedin.com',
      'indeed.com', 
      'glassdoor.com',
      'monster.com'
    ]
    
    const isJobSite = jobSites.some(site => tab.url.includes(site))
    
    if (isJobSite) {
      console.log('📍 User is on job site:', tab.url)
      
      // Check if user is authenticated
      if (authManager && authManager.isLoggedIn()) {
        // Publish job site visited event
        if (messageBus) {
          messageBus.publish(messageBus.messageTypes.JOB_DETECTED, {
            url: tab.url,
            tabId: tabId
          })
        }
        
        console.log('✅ User is authenticated, extension ready')
      }
    }
  }
})

/**
 * Periodic session refresh check
 */
setInterval(async () => {
  try {
    if (authManager) {
      await authManager.refreshSessionIfNeeded()
    }
  } catch (error) {
    console.error('Session refresh check failed:', error)
  }
}, 5 * 60 * 1000) // Check every 5 minutes

console.log('✅ Job Orbit Extension Background Script Ready')