/**
 * Chrome Extension Sync Manager
 * Handles bidirectional synchronization with Job Orbit backend
 * 
 * Responsibilities:
 * - Download data: Profile, Resume, Settings, Applications, AI Answers
 * - Upload changes automatically
 * - Handle offline mode with queue
 * - Conflict resolution
 * - Background synchronization
 * - Real-time sync via websockets/polling
 */

class ExtensionSyncManager {
  constructor() {
    this.isInitialized = false
    this.isSyncing = false
    this.syncInterval = null
    
    // Dependencies (injected)
    this.storageManager = null
    this.apiClient = null
    this.messageBus = null
    
    // Sync configuration
    this.config = {
      syncIntervalMs: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      retryDelayMs: 2000,
      conflictResolution: 'server_wins', // 'server_wins' | 'client_wins' | 'manual'
      enableRealtime: true
    }
    
    // Data types to sync
    this.syncableTypes = {
      profile: {
        endpoint: '/profile',
        cacheKey: 'profile',
        priority: 1,
        conflictStrategy: 'server_wins'
      },
      applications: {
        endpoint: '/applications',
        cacheKey: 'applications',
        priority: 2,
        conflictStrategy: 'merge'
      },
      resumes: {
        endpoint: '/resumes',
        cacheKey: 'resumes',
        priority: 3,
        conflictStrategy: 'server_wins'
      },
      settings: {
        endpoint: '/settings',
        cacheKey: 'settings',
        priority: 4,
        conflictStrategy: 'client_wins'
      },
      answers: {
        endpoint: '/answers',
        cacheKey: 'answers',
        priority: 5,
        conflictStrategy: 'merge'
      }
    }
    
    // Sync state
    this.syncState = {
      status: 'idle', // 'idle' | 'syncing' | 'error' | 'offline'
      lastSyncTime: null,
      pendingUploads: [],
      conflicts: [],
      stats: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0
      }
    }
    
    // Event listeners
    this.listeners = new Set()
  }

  /**
   * Initialize sync manager
   */
  async init(dependencies) {
    console.log('🔄 Initializing Sync Manager...')
    
    this.storageManager = dependencies.storageManager
    this.apiClient = dependencies.apiClient
    this.messageBus = dependencies.messageBus
    
    if (!this.storageManager || !this.apiClient) {
      throw new Error('SyncManager requires storageManager and apiClient')
    }
    
    // Load sync state from storage
    await this.loadSyncState()
    
    // Set up periodic sync
    this.startPeriodicSync()
    
    // Listen for online/offline events
    this.setupConnectivityListeners()
    
    // Listen for data changes that need sync
    this.setupDataChangeListeners()
    
    this.isInitialized = true
    console.log('✅ Sync Manager initialized')
    
    // Perform initial sync
    setTimeout(() => this.performFullSync(), 1000)
  }

  /**
   * Load sync state from storage
   */
  async loadSyncState() {
    try {
      const metadata = await this.storageManager.getSyncMetadata()
      
      this.syncState = {
        ...this.syncState,
        lastSyncTime: metadata[this.storageManager.keys.lastSyncTime],
        status: metadata[this.storageManager.keys.syncStatus] || 'idle',
        pendingUploads: metadata[this.storageManager.keys.pendingChanges] || [],
        conflicts: metadata[this.storageManager.keys.conflictData] || []
      }
      
      console.log('📊 Sync state loaded:', this.syncState)
    } catch (error) {
      console.error('Failed to load sync state:', error)
    }
  }

  /**
   * Save sync state to storage
   */
  async saveSyncState() {
    try {
      await this.storageManager.setSyncMetadata({
        lastSyncTime: this.syncState.lastSyncTime,
        status: this.syncState.status,
        pendingChanges: this.syncState.pendingUploads,
        conflicts: this.syncState.conflicts
      })
    } catch (error) {
      console.error('Failed to save sync state:', error)
    }
  }

  /**
   * Subscribe to sync events
   */
  subscribe(callback) {
    this.listeners.add(callback)
    
    // Send current state immediately
    callback({
      type: 'sync_state',
      data: this.getSyncState()
    })
    
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify listeners of sync events
   */
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Sync listener error:', error)
      }
    })
  }

  /**
   * Get current sync state
   */
  getSyncState() {
    return {
      ...this.syncState,
      isOnline: navigator.onLine,
      nextSyncTime: this.getNextSyncTime()
    }
  }

  /**
   * Get next scheduled sync time
   */
  getNextSyncTime() {
    if (!this.syncState.lastSyncTime) return Date.now()
    return this.syncState.lastSyncTime + this.config.syncIntervalMs
  }

  /**
   * Start periodic synchronization
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        console.log('⏰ Periodic sync triggered')
        this.performFullSync()
      }
    }, this.config.syncIntervalMs)
    
    console.log(`🔄 Periodic sync started (${this.config.syncIntervalMs / 1000}s interval)`)
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('⏹️  Periodic sync stopped')
    }
  }

  /**
   * Setup connectivity listeners
   */
  setupConnectivityListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online - resuming sync')
      this.syncState.status = 'idle'
      this.notifyListeners({ type: 'online' })
      this.performFullSync()
    })
    
    window.addEventListener('offline', () => {
      console.log('📴 Offline - pausing sync')
      this.syncState.status = 'offline'
      this.notifyListeners({ type: 'offline' })
      this.saveSyncState()
    })
  }

  /**
   * Setup data change listeners
   */
  setupDataChangeListeners() {
    if (this.messageBus) {
      this.messageBus.subscribe('data_changed', (event) => {
        this.handleDataChange(event.data)
      })
    }
  }

  /**
   * Handle data change that needs to be synced
   */
  async handleDataChange(changeData) {
    try {
      const { type, action, data, id } = changeData
      
      console.log(`📝 Data changed: ${type}.${action}`, id)
      
      if (navigator.onLine) {
        // Sync immediately if online
        await this.syncDataType(type, { action, data, id })
      } else {
        // Queue for offline sync
        await this.queueOfflineChange(changeData)
      }
      
    } catch (error) {
      console.error('Failed to handle data change:', error)
    }
  }

  /**
   * Queue change for offline sync
   */
  async queueOfflineChange(changeData) {
    await this.storageManager.addToOfflineQueue({
      type: 'data_change',
      data: changeData,
      timestamp: Date.now()
    })
    
    console.log('📤 Queued for offline sync:', changeData.type)
  }

  /**
   * Perform full synchronization
   */
  async performFullSync(force = false) {
    if (this.isSyncing && !force) {
      console.log('⏳ Sync already in progress')
      return
    }
    
    if (!navigator.onLine) {
      console.log('📴 Offline - skipping sync')
      await this.storageManager.setOfflineMode(true)
      return
    }
    
    try {
      console.log('🔄 Starting full sync...')
      this.isSyncing = true
      this.syncState.status = 'syncing'
      this.notifyListeners({ type: 'sync_start' })
      
      // Process offline queue first
      await this.processOfflineQueue()
      
      // Sync each data type by priority
      const sortedTypes = Object.entries(this.syncableTypes)
        .sort(([, a], [, b]) => a.priority - b.priority)
      
      const results = {}
      
      for (const [type, config] of sortedTypes) {
        try {
          console.log(`🔄 Syncing ${type}...`)
          results[type] = await this.syncDataType(type)
          console.log(`✅ ${type} sync complete`)
        } catch (error) {
          console.error(`❌ ${type} sync failed:`, error)
          results[type] = { success: false, error: error.message }
        }
      }
      
      // Update sync state
      this.syncState.lastSyncTime = Date.now()
      this.syncState.status = 'idle'
      this.syncState.stats.totalSyncs++
      
      const successful = Object.values(results).filter(r => r.success !== false)
      if (successful.length === Object.keys(results).length) {
        this.syncState.stats.successfulSyncs++
      } else {
        this.syncState.stats.failedSyncs++
      }
      
      await this.saveSyncState()
      await this.storageManager.setOfflineMode(false)
      
      console.log('✅ Full sync complete', results)
      
      this.notifyListeners({
        type: 'sync_complete',
        data: {
          success: true,
          results,
          timestamp: this.syncState.lastSyncTime
        }
      })
      
    } catch (error) {
      console.error('❌ Full sync failed:', error)
      
      this.syncState.status = 'error'
      this.syncState.stats.failedSyncs++
      await this.saveSyncState()
      
      this.notifyListeners({
        type: 'sync_error',
        data: {
          error: error.message,
          timestamp: Date.now()
        }
      })
      
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync specific data type
   */
  async syncDataType(type, changeData = null) {
    const config = this.syncableTypes[type]
    if (!config) {
      throw new Error(`Unknown sync type: ${type}`)
    }
    
    try {
      // Handle specific change vs full sync
      if (changeData) {
        return await this.syncSpecificChange(type, config, changeData)
      } else {
        return await this.syncFullDataType(type, config)
      }
      
    } catch (error) {
      console.error(`Sync failed for ${type}:`, error)
      throw error
    }
  }

  /**
   * Sync specific change (create/update/delete)
   */
  async syncSpecificChange(type, config, changeData) {
    const { action, data, id } = changeData
    
    switch (action) {
      case 'create':
        const created = await this.apiClient.post(config.endpoint, data)
        await this.updateLocalCache(type, created, 'add')
        return { success: true, action: 'create', data: created }
        
      case 'update':
        const updated = await this.apiClient.patch(`${config.endpoint}/${id}`, data)
        await this.updateLocalCache(type, updated, 'update')
        return { success: true, action: 'update', data: updated }
        
      case 'delete':
        await this.apiClient.delete(`${config.endpoint}/${id}`)
        await this.updateLocalCache(type, { id }, 'delete')
        return { success: true, action: 'delete', id }
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  /**
   * Sync full data type (download from server)
   */
  async syncFullDataType(type, config) {
    try {
      // Get server data
      const serverResponse = await this.apiClient.get(config.endpoint)
      const serverData = serverResponse.data || serverResponse
      
      // Get cached data
      const cachedData = await this.storageManager.getCache(config.cacheKey)
      
      // Check for conflicts
      const conflicts = await this.detectConflicts(type, cachedData, serverData)
      
      if (conflicts.length > 0) {
        console.log(`⚠️  ${conflicts.length} conflicts detected for ${type}`)
        await this.handleConflicts(type, conflicts, config)
      }
      
      // Update cache with server data
      await this.storageManager.storeCache(config.cacheKey, {
        data: serverData,
        timestamp: Date.now(),
        synced: true
      })
      
      return {
        success: true,
        itemCount: Array.isArray(serverData) ? serverData.length : 1,
        conflicts: conflicts.length,
        timestamp: Date.now()
      }
      
    } catch (error) {
      // If sync fails, keep cached data available
      console.error(`Server sync failed for ${type}, using cached data:`, error)
      throw error
    }
  }

  /**
   * Update local cache after change
   */
  async updateLocalCache(type, itemData, operation) {
    try {
      const config = this.syncableTypes[type]
      const cached = await this.storageManager.getCache(config.cacheKey)
      
      let updatedData = cached?.data || []
      
      if (!Array.isArray(updatedData)) {
        updatedData = [updatedData]
      }
      
      switch (operation) {
        case 'add':
          updatedData.push(itemData)
          break
          
        case 'update':
          const updateIndex = updatedData.findIndex(item => item.id === itemData.id)
          if (updateIndex !== -1) {
            updatedData[updateIndex] = itemData
          }
          break
          
        case 'delete':
          updatedData = updatedData.filter(item => item.id !== itemData.id)
          break
      }
      
      await this.storageManager.storeCache(config.cacheKey, {
        data: updatedData,
        timestamp: Date.now(),
        synced: true
      })
      
    } catch (error) {
      console.error(`Failed to update local cache for ${type}:`, error)
    }
  }

  /**
   * Detect conflicts between cached and server data
   */
  async detectConflicts(type, cachedData, serverData) {
    // Simple conflict detection - can be enhanced
    const conflicts = []
    
    if (!cachedData || !cachedData.data) {
      return conflicts // No cached data, no conflicts
    }
    
    // For arrays, compare by ID and timestamp
    if (Array.isArray(serverData) && Array.isArray(cachedData.data)) {
      for (const serverItem of serverData) {
        const cachedItem = cachedData.data.find(item => item.id === serverItem.id)
        
        if (cachedItem && cachedItem.updated_at && serverItem.updated_at) {
          const cachedTime = new Date(cachedItem.updated_at).getTime()
          const serverTime = new Date(serverItem.updated_at).getTime()
          
          if (Math.abs(cachedTime - serverTime) > 1000) { // 1 second tolerance
            conflicts.push({
              id: serverItem.id,
              type: type,
              cached: cachedItem,
              server: serverItem,
              cachedTime,
              serverTime
            })
          }
        }
      }
    }
    
    return conflicts
  }

  /**
   * Handle conflicts based on strategy
   */
  async handleConflicts(type, conflicts, config) {
    const strategy = config.conflictStrategy
    
    for (const conflict of conflicts) {
      console.log(`🔀 Resolving conflict for ${type}:${conflict.id} using ${strategy}`)
      
      switch (strategy) {
        case 'server_wins':
          // Server data takes precedence - no action needed
          break
          
        case 'client_wins':
          // Upload local changes to server
          try {
            await this.apiClient.patch(
              `${config.endpoint}/${conflict.id}`, 
              conflict.cached
            )
          } catch (error) {
            console.error('Failed to upload conflict resolution:', error)
          }
          break
          
        case 'merge':
          // Attempt to merge data
          const merged = this.mergeConflictData(conflict.cached, conflict.server)
          try {
            await this.apiClient.patch(
              `${config.endpoint}/${conflict.id}`, 
              merged
            )
          } catch (error) {
            console.error('Failed to upload merged data:', error)
          }
          break
          
        case 'manual':
          // Store for manual resolution
          this.syncState.conflicts.push(conflict)
          break
      }
    }
  }

  /**
   * Merge conflicting data (simple merge strategy)
   */
  mergeConflictData(cached, server) {
    // Simple merge - server wins for system fields, client wins for user fields
    return {
      ...server, // Server data as base
      // Preserve user-modified fields from cache if they're newer
      ...(cached.updated_at > server.updated_at ? {
        title: cached.title,
        notes: cached.notes,
        status: cached.status
      } : {})
    }
  }

  /**
   * Process offline queue when back online
   */
  async processOfflineQueue() {
    try {
      const queue = await this.storageManager.getOfflineQueue()
      
      if (queue.length === 0) {
        return
      }
      
      console.log(`📤 Processing ${queue.length} offline operations...`)
      
      const processed = []
      const failed = []
      
      for (const operation of queue) {
        try {
          if (operation.type === 'data_change') {
            await this.handleDataChange(operation.data)
            processed.push(operation)
          }
        } catch (error) {
          console.error('Failed to process offline operation:', error)
          failed.push({ ...operation, error: error.message })
        }
      }
      
      // Update queue with failed operations only
      if (failed.length > 0) {
        await this.storageManager.set(this.storageManager.keys.offlineQueue, failed)
      } else {
        await this.storageManager.clearOfflineQueue()
      }
      
      console.log(`✅ Processed ${processed.length} offline operations, ${failed.length} failed`)
      
    } catch (error) {
      console.error('Failed to process offline queue:', error)
    }
  }

  /**
   * Force sync specific data type
   */
  async forceSyncDataType(type) {
    if (!this.syncableTypes[type]) {
      throw new Error(`Unknown data type: ${type}`)
    }
    
    console.log(`🔄 Force syncing ${type}...`)
    
    try {
      const result = await this.syncDataType(type)
      
      this.notifyListeners({
        type: 'data_synced',
        data: { type, result }
      })
      
      return result
    } catch (error) {
      this.notifyListeners({
        type: 'sync_error',
        data: { type, error: error.message }
      })
      throw error
    }
  }

  /**
   * Get cached data for specific type
   */
  async getCachedData(type) {
    const config = this.syncableTypes[type]
    if (!config) {
      throw new Error(`Unknown data type: ${type}`)
    }
    
    const cached = await this.storageManager.getCache(config.cacheKey)
    return cached?.data || null
  }

  /**
   * Clear all cached data
   */
  async clearAllCache() {
    await this.storageManager.invalidateAllCache()
    
    this.notifyListeners({
      type: 'cache_cleared',
      data: { timestamp: Date.now() }
    })
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    return {
      ...this.syncState.stats,
      lastSyncTime: this.syncState.lastSyncTime,
      status: this.syncState.status,
      pendingOperations: this.syncState.pendingUploads.length,
      conflicts: this.syncState.conflicts.length
    }
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup() {
    console.log('🧹 Cleaning up Sync Manager...')
    
    this.stopPeriodicSync()
    await this.saveSyncState()
    this.listeners.clear()
    
    console.log('✅ Sync Manager cleanup complete')
  }
}

// Create singleton instance
const extensionSyncManager = new ExtensionSyncManager()

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = extensionSyncManager
} else if (typeof window !== 'undefined') {
  window.extensionSyncManager = extensionSyncManager
}