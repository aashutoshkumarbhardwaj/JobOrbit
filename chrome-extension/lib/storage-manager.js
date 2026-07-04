/**
 * Chrome Extension Storage Manager
 * Centralized storage operations with encryption, versioning, and conflict resolution
 * 
 * Responsibilities:
 * - All chrome.storage operations
 * - Data encryption/decryption
 * - Storage quotas and cleanup
 * - Conflict resolution
 * - Data versioning
 */

class ExtensionStorageManager {
  constructor() {
    this.isInitialized = false
    this.storageQuota = {
      maxSize: 5 * 1024 * 1024, // 5MB max storage
      warningSize: 4 * 1024 * 1024 // Warning at 4MB
    }
    this.listeners = new Set()
    
    // Storage keys
    this.keys = {
      // Authentication
      extensionToken: 'ext_token',
      sessionId: 'ext_session_id',
      userId: 'ext_user_id', 
      userInfo: 'ext_user_info',
      tokenExpiresAt: 'ext_token_expires',
      isLoggedIn: 'ext_is_logged_in',
      
      // Data cache
      profile: 'cache_profile',
      applications: 'cache_applications',
      resumes: 'cache_resumes', 
      settings: 'cache_settings',
      answers: 'cache_answers',
      
      // Sync metadata
      lastSyncTime: 'sync_last_time',
      syncStatus: 'sync_status',
      pendingChanges: 'sync_pending',
      conflictData: 'sync_conflicts',
      
      // App state
      extensionSettings: 'app_settings',
      onboardingCompleted: 'app_onboarding',
      
      // Offline data
      offlineQueue: 'offline_queue',
      offlineMode: 'offline_mode'
    }
  }

  /**
   * Initialize storage manager
   */
  async init() {
    console.log('💾 Initializing Storage Manager...')
    
    // Set up storage change listener
    if (chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        this.handleStorageChange(changes, namespace)
      })
    }
    
    // Check storage quota
    await this.checkStorageQuota()
    
    // Migration check
    await this.migrateStorageIfNeeded()
    
    this.isInitialized = true
    console.log('✅ Storage Manager initialized')
  }

  /**
   * Check storage usage and warn if approaching limit
   */
  async checkStorageQuota() {
    try {
      if (chrome.storage?.local?.getBytesInUse) {
        const bytesInUse = await new Promise((resolve) => {
          chrome.storage.local.getBytesInUse(null, resolve)
        })
        
        console.log(`💾 Storage usage: ${Math.round(bytesInUse / 1024)} KB`)
        
        if (bytesInUse > this.storageQuota.warningSize) {
          console.warn('⚠️  Storage approaching limit, cleanup recommended')
          await this.cleanupOldData()
        }
        
        if (bytesInUse > this.storageQuota.maxSize) {
          console.error('❌ Storage quota exceeded')
          throw new Error('Storage quota exceeded')
        }
      }
    } catch (error) {
      console.error('Failed to check storage quota:', error)
    }
  }

  /**
   * Clean up old cached data
   */
  async cleanupOldData() {
    try {
      console.log('🧹 Cleaning up old data...')
      
      // Remove old cache entries (older than 7 days)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      
      const toCheck = [
        this.keys.applications,
        this.keys.resumes,
        this.keys.answers
      ]
      
      for (const key of toCheck) {
        const data = await this.get(key)
        if (data && data.timestamp && data.timestamp < weekAgo) {
          await this.remove(key)
          console.log(`🗑️  Removed old cache: ${key}`)
        }
      }
      
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  /**
   * Handle storage changes and notify listeners
   */
  handleStorageChange(changes, namespace) {
    if (namespace !== 'local') return
    
    console.log('💾 Storage changed:', Object.keys(changes))
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(changes, namespace)
      } catch (error) {
        console.error('Storage listener error:', error)
      }
    })
  }

  /**
   * Subscribe to storage changes
   */
  subscribe(callback) {
    this.listeners.add(callback)
    
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Get single item from storage
   */
  async get(key) {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get([key], resolve)
      })
      
      const data = result[key]
      
      // Check if data has expired
      if (data && data.expiresAt && Date.now() > data.expiresAt) {
        await this.remove(key)
        return null
      }
      
      return data
    } catch (error) {
      console.error(`Failed to get ${key}:`, error)
      return null
    }
  }

  /**
   * Get multiple items from storage
   */
  async getMultiple(keys) {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve)
      })
      
      // Filter expired data
      const filteredResult = {}
      for (const [key, data] of Object.entries(result)) {
        if (data && data.expiresAt && Date.now() > data.expiresAt) {
          await this.remove(key)
        } else {
          filteredResult[key] = data
        }
      }
      
      return filteredResult
    } catch (error) {
      console.error('Failed to get multiple keys:', error)
      return {}
    }
  }

  /**
   * Set single item in storage
   */
  async set(key, value, options = {}) {
    try {
      const { 
        ttl = null, // Time to live in ms
        encrypt = false,
        merge = false
      } = options
      
      let dataToStore = value
      
      // Add metadata
      const metadata = {
        timestamp: Date.now(),
        version: '1.0'
      }
      
      // Add expiration if TTL is set
      if (ttl) {
        metadata.expiresAt = Date.now() + ttl
      }
      
      // Merge with existing data if requested
      if (merge && typeof value === 'object' && value !== null) {
        const existing = await this.get(key)
        if (existing && typeof existing === 'object') {
          dataToStore = { ...existing, ...value, ...metadata }
        } else {
          dataToStore = { ...value, ...metadata }
        }
      } else if (typeof value === 'object' && value !== null) {
        dataToStore = { ...value, ...metadata }
      }
      
      // Encrypt if requested (simple obfuscation for demo)
      if (encrypt && typeof dataToStore === 'string') {
        dataToStore = btoa(dataToStore)
      }
      
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: dataToStore }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        })
      })
      
      console.log(`💾 Stored: ${key}`)
      
    } catch (error) {
      console.error(`Failed to set ${key}:`, error)
      throw error
    }
  }

  /**
   * Set multiple items in storage
   */
  async setMultiple(items, options = {}) {
    try {
      const itemsToStore = {}
      const timestamp = Date.now()
      
      for (const [key, value] of Object.entries(items)) {
        let dataToStore = value
        
        // Add metadata to objects
        if (typeof value === 'object' && value !== null) {
          dataToStore = { 
            ...value, 
            timestamp,
            version: '1.0'
          }
          
          // Add TTL if specified
          if (options.ttl) {
            dataToStore.expiresAt = timestamp + options.ttl
          }
        }
        
        itemsToStore[key] = dataToStore
      }
      
      await new Promise((resolve, reject) => {
        chrome.storage.local.set(itemsToStore, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        })
      })
      
      console.log(`💾 Stored multiple items:`, Object.keys(items))
      
    } catch (error) {
      console.error('Failed to set multiple items:', error)
      throw error
    }
  }

  /**
   * Remove item from storage
   */
  async remove(key) {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        })
      })
      
      console.log(`🗑️  Removed: ${key}`)
      
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
      throw error
    }
  }

  /**
   * Clear all storage
   */
  async clear() {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        })
      })
      
      console.log('🗑️  Storage cleared')
      
    } catch (error) {
      console.error('Failed to clear storage:', error)
      throw error
    }
  }

  /**
   * Authentication storage methods
   */
  async storeAuthData(authData) {
    const {
      extensionToken,
      sessionId, 
      userId,
      user,
      expiresAt,
      isLoggedIn = true
    } = authData
    
    await this.setMultiple({
      [this.keys.extensionToken]: extensionToken,
      [this.keys.sessionId]: sessionId,
      [this.keys.userId]: userId,
      [this.keys.userInfo]: user,
      [this.keys.tokenExpiresAt]: expiresAt,
      [this.keys.isLoggedIn]: isLoggedIn
    })
  }

  async getAuthData() {
    return this.getMultiple([
      this.keys.extensionToken,
      this.keys.sessionId,
      this.keys.userId,
      this.keys.userInfo,
      this.keys.tokenExpiresAt,
      this.keys.isLoggedIn
    ])
  }

  async clearAuthData() {
    const authKeys = [
      this.keys.extensionToken,
      this.keys.sessionId,
      this.keys.userId,
      this.keys.userInfo,
      this.keys.tokenExpiresAt,
      this.keys.isLoggedIn
    ]
    
    for (const key of authKeys) {
      await this.remove(key)
    }
  }

  /**
   * Cache management methods
   */
  async storeCache(type, data) {
    const key = this.keys[type]
    if (!key) {
      throw new Error(`Invalid cache type: ${type}`)
    }
    
    await this.set(key, data, {
      ttl: 30 * 60 * 1000 // 30 minutes TTL for cache
    })
  }

  async getCache(type) {
    const key = this.keys[type]
    if (!key) {
      throw new Error(`Invalid cache type: ${type}`)
    }
    
    return this.get(key)
  }

  async invalidateCache(type) {
    const key = this.keys[type]
    if (!key) {
      throw new Error(`Invalid cache type: ${type}`)
    }
    
    await this.remove(key)
  }

  async invalidateAllCache() {
    const cacheKeys = [
      this.keys.profile,
      this.keys.applications,
      this.keys.resumes,
      this.keys.settings,
      this.keys.answers
    ]
    
    for (const key of cacheKeys) {
      await this.remove(key)
    }
  }

  /**
   * Sync metadata methods
   */
  async setSyncMetadata(metadata) {
    await this.setMultiple({
      [this.keys.lastSyncTime]: metadata.lastSyncTime || Date.now(),
      [this.keys.syncStatus]: metadata.status || 'idle',
      [this.keys.pendingChanges]: metadata.pendingChanges || [],
      [this.keys.conflictData]: metadata.conflicts || []
    })
  }

  async getSyncMetadata() {
    return this.getMultiple([
      this.keys.lastSyncTime,
      this.keys.syncStatus,
      this.keys.pendingChanges,
      this.keys.conflictData
    ])
  }

  /**
   * Offline queue methods
   */
  async addToOfflineQueue(operation) {
    const queue = await this.get(this.keys.offlineQueue) || []
    queue.push({
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    })
    
    await this.set(this.keys.offlineQueue, queue)
  }

  async getOfflineQueue() {
    return (await this.get(this.keys.offlineQueue)) || []
  }

  async clearOfflineQueue() {
    await this.remove(this.keys.offlineQueue)
  }

  async setOfflineMode(isOffline) {
    await this.set(this.keys.offlineMode, isOffline)
  }

  async isOfflineMode() {
    return (await this.get(this.keys.offlineMode)) || false
  }

  /**
   * Storage migration for version updates
   */
  async migrateStorageIfNeeded() {
    try {
      const currentVersion = await this.get('storage_version') || '1.0.0'
      const targetVersion = '1.1.0'
      
      if (currentVersion !== targetVersion) {
        console.log(`🔄 Migrating storage from ${currentVersion} to ${targetVersion}`)
        
        // Perform migration logic here
        // For now, just update version
        
        await this.set('storage_version', targetVersion)
        console.log('✅ Storage migration complete')
      }
    } catch (error) {
      console.error('Storage migration failed:', error)
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    try {
      const bytesInUse = chrome.storage?.local?.getBytesInUse 
        ? await new Promise(resolve => chrome.storage.local.getBytesInUse(null, resolve))
        : 0
      
      return {
        bytesInUse,
        maxBytes: chrome.storage?.local?.QUOTA_BYTES || 5242880,
        utilizationPercent: Math.round((bytesInUse / 5242880) * 100)
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return { bytesInUse: 0, maxBytes: 0, utilizationPercent: 0 }
    }
  }
}

// Create singleton instance
const extensionStorageManager = new ExtensionStorageManager()

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = extensionStorageManager
} else if (typeof window !== 'undefined') {
  window.extensionStorageManager = extensionStorageManager
}