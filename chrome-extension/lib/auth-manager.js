/**
 * Chrome Extension AuthManager
 * Handles authentication flow, token storage, and session management
 * 
 * Flow:
 * 1. User clicks login -> opens OAuth window
 * 2. OAuth completes -> gets Supabase JWT
 * 3. Calls /extension-session with JWT -> gets extensionToken
 * 4. Stores extensionToken, expiresAt, userId in chrome.storage.local
 * 5. All API calls use extensionToken via X-Extension-Token header
 * 6. Token auto-refreshes when needed
 * 7. Persists across browser restarts
 */

class ExtensionAuthManager {
  constructor() {
    this.isInitialized = false
    this.authState = {
      isLoggedIn: false,
      user: null,
      extensionToken: null,
      expiresAt: null,
      sessionId: null,
      isLoading: true
    }
    this.listeners = new Set()
    
    // Dependencies (injected)
    this.storageManager = null
    this.messageBus = null
    
    // Configuration
    this.config = {
      // Will be set based on environment
      webAppUrl: null,
      apiBaseUrl: null
    }
  }

  /**
   * Initialize AuthManager
   */
  async init(dependencies) {
    console.log('🔐 Initializing Extension AuthManager...')
    
    this.storageManager = dependencies.storageManager
    this.messageBus = dependencies.messageBus
    
    if (!this.storageManager) {
      throw new Error('AuthManager requires storageManager')
    }
    
    // Initialize API client first
    if (typeof extensionApiClient !== 'undefined') {
      await extensionApiClient.init(this)
      
      // Get configuration from API client
      const apiConfig = extensionApiClient.getConfig()
      this.config.webAppUrl = apiConfig.baseUrl
      this.config.apiBaseUrl = `${apiConfig.baseUrl}/api/v1`
    }
    
    // Detect environment and set URLs (fallback)
    await this.detectEnvironment()
    
    // Load stored authentication state
    await this.loadStoredAuth()
    
    // Validate stored token
    await this.validateStoredToken()
    
    this.isInitialized = true
    this.notifyListeners()
    
    console.log('✅ Extension AuthManager initialized')
  }

  /**
   * Detect environment and set appropriate URLs
   */
  async detectEnvironment() {
    // Environment detection is now handled by the API client
    // We'll get the configuration from it after initialization
    this.config.webAppUrl = 'https://joborbit.com' // Default fallback
    this.config.apiBaseUrl = 'https://joborbit.com/api/v1' // Default fallback
  }

  /**
   * Load stored authentication state from storage
   */
  async loadStoredAuth() {
    try {
      const authData = await this.storageManager.getAuthData()

      if (authData[this.storageManager.keys.extensionToken] && 
          authData[this.storageManager.keys.expiresAt] && 
          authData[this.storageManager.keys.userId]) {
        
        this.authState = {
          isLoggedIn: authData[this.storageManager.keys.isLoggedIn] || false,
          user: authData[this.storageManager.keys.userInfo] || { 
            id: authData[this.storageManager.keys.userId] 
          },
          extensionToken: authData[this.storageManager.keys.extensionToken],
          expiresAt: authData[this.storageManager.keys.tokenExpiresAt],
          sessionId: authData[this.storageManager.keys.sessionId],
          isLoading: false
        }
        
        console.log('📱 Loaded stored auth state:', {
          userId: authData[this.storageManager.keys.userId],
          sessionId: authData[this.storageManager.keys.sessionId],
          expiresAt: new Date(authData[this.storageManager.keys.tokenExpiresAt]).toISOString()
        })
      } else {
        console.log('📱 No stored auth state found')
        this.authState.isLoading = false
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error)
      this.authState.isLoading = false
    }
  }

  /**
   * Validate stored token - check if expired or needs refresh
   */
  async validateStoredToken() {
    if (!this.authState.extensionToken || !this.authState.expiresAt) {
      console.log('⏰ No token to validate')
      return
    }

    const now = Date.now()
    const expiresAt = new Date(this.authState.expiresAt).getTime()
    
    // Check if token is expired (with 5-minute buffer)
    if (now >= expiresAt - 5 * 60 * 1000) {
      console.log('⏰ Token expired, clearing auth state')
      await this.clearAuth()
      return
    }

    // Token is valid, verify with backend
    try {
      const isValid = await this.verifyTokenWithBackend()
      if (!isValid) {
        console.log('❌ Token invalid according to backend')
        await this.clearAuth()
      } else {
        console.log('✅ Token is valid')
        this.authState.isLoggedIn = true
      }
    } catch (error) {
      console.error('Failed to verify token:', error)
      // Don't clear on network error, let user try to use it
    }
  }

  /**
   * Verify token with backend
   */
  async verifyTokenWithBackend() {
    try {
      if (typeof extensionApiClient !== 'undefined') {
        const response = await extensionApiClient.supabaseFunction('extension-verify', {
          method: 'GET',
          timeout: 10000
        })
        return response.success
      } else {
        // Fallback to direct fetch
        const response = await fetch(`${this.config.webAppUrl}/functions/v1/extension-verify`, {
          method: 'GET',
          headers: {
            'X-Extension-Token': this.authState.extensionToken,
            'Content-Type': 'application/json'
          }
        })
        return response.ok
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      return false
    }
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(callback) {
    this.listeners.add(callback)
    
    // Immediately call with current state
    if (this.isInitialized) {
      callback(this.authState)
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify all listeners of auth state changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.authState)
      } catch (error) {
        console.error('Error in auth state listener:', error)
      }
    })
  }

  /**
   * Get current auth state
   */
  getAuthState() {
    return { ...this.authState }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.authState.isLoggedIn && !!this.authState.extensionToken
  }

  /**
   * Get current user
   */
  getUser() {
    return this.authState.user
  }

  /**
   * Start OAuth login flow
   */
  async login() {
    try {
      console.log('🔐 Starting OAuth login...')
      
      this.authState.isLoading = true
      this.notifyListeners()

      // Open OAuth popup window
      const authUrl = `${this.config.webAppUrl}/extension-auth`
      
      const authWindow = await this.openAuthWindow(authUrl)
      
      // Wait for OAuth to complete
      const authResult = await this.waitForAuthCompletion(authWindow)
      
      if (authResult.success) {
        console.log('✅ OAuth completed and session stored successfully')
      } else {
        throw new Error(authResult.error || 'OAuth failed')
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error)
      this.authState.isLoading = false
      this.notifyListeners()
      throw error
    }
  }

  /**
   * Open OAuth window
   */
  async openAuthWindow(url) {
    return new Promise((resolve, reject) => {
      chrome.windows.create({
        url: url,
        type: 'popup',
        width: 500,
        height: 700,
        focused: true
      }, (window) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(window)
        }
      })
    })
  }

  /**
   * Wait for OAuth completion
   */
  async waitForAuthCompletion(authWindow) {
    return new Promise((resolve) => {
      const startTime = Date.now()
      
      const checkInterval = setInterval(() => {
        // Check if we became logged in via background.js storing the session
        if (this.isLoggedIn()) {
          clearInterval(checkInterval)
          chrome.windows.remove(authWindow.id).catch(() => {})
          resolve({ success: true })
          return
        }
        
        // Check if window was closed
        chrome.windows.get(authWindow.id, (window) => {
          if (chrome.runtime.lastError || !window) {
            clearInterval(checkInterval)
            if (!this.isLoggedIn()) {
              resolve({ success: false, error: 'OAuth cancelled' })
            }
          }
        })
        
        // Timeout after 5 minutes
        if (Date.now() - startTime > 5 * 60 * 1000) {
          clearInterval(checkInterval)
          chrome.windows.remove(authWindow.id).catch(() => {})
          resolve({ success: false, error: 'OAuth timeout' })
        }
      }, 1000)
    })
  }



  /**
   * Store extension session in storage
   */
  async storeExtensionSession({ extensionToken, sessionId, expiresIn, user }) {
    try {
      const expiresAt = Date.now() + expiresIn * 1000
      
      // Store using StorageManager
      await this.storageManager.storeAuthData({
        extensionToken,
        sessionId,
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        expiresAt,
        isLoggedIn: true
      })

      // Update internal state
      this.authState = {
        extensionToken,
        sessionId,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        isLoggedIn: true,
        isLoading: false
      }

      console.log('✅ Extension session stored:', {
        userId: user.id,
        sessionId,
        expiresAt: new Date(expiresAt).toISOString()
      })

      this.notifyListeners()
      
      // Publish auth state changed event
      if (this.messageBus) {
        this.messageBus.publish(this.messageBus.messageTypes.AUTH_STATE_CHANGED, this.authState)
      }
      
    } catch (error) {
      console.error('Failed to store extension session:', error)
      throw error
    }
  }

  /**
   * Logout - clear all stored auth data
   */
  async logout() {
    try {
      console.log('🚪 Logging out...')

      // Clear storage using StorageManager
      await this.storageManager.clearAuthData()

      // Reset internal state
      this.authState = {
        isLoggedIn: false,
        user: null,
        extensionToken: null,
        expiresAt: null,
        sessionId: null,
        isLoading: false
      }

      this.notifyListeners()
      
      // Publish logout event
      if (this.messageBus) {
        this.messageBus.publish(this.messageBus.messageTypes.AUTH_LOGOUT)
      }
      
      console.log('✅ Logged out successfully')
      
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  /**
   * Clear auth state (internal)
   */
  async clearAuth() {
    await this.logout()
  }

  /**
   * Get authorization header for API calls
   */
  getAuthHeader() {
    if (this.authState.extensionToken) {
      return {
        'X-Extension-Token': this.authState.extensionToken
      }
    }
    return null
  }

  /**
   * Refresh extension session if needed
   */
  async refreshSessionIfNeeded() {
    if (!this.authState.extensionToken) {
      return false
    }

    const now = Date.now()
    const expiresAt = new Date(this.authState.expiresAt).getTime()
    
    // Refresh if token expires in next 10 minutes
    if (now >= expiresAt - 10 * 60 * 1000) {
      console.log('🔄 Token needs refresh, logging out user')
      await this.clearAuth()
      return false
    }

    return true
  }
}

// Create singleton instance
const extensionAuthManager = new ExtensionAuthManager()

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = extensionAuthManager
} else if (typeof window !== 'undefined') {
  window.extensionAuthManager = extensionAuthManager
}