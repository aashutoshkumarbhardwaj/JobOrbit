/**
 * Chrome Extension Message Bus
 * Centralized event system for inter-component communication
 * 
 * Responsibilities:
 * - Pub/Sub pattern for decoupled communication
 * - Chrome runtime message handling
 * - Cross-context messaging (popup ↔ background ↔ content)
 * - Event logging and debugging
 */

class ExtensionMessageBus {
  constructor() {
    this.isInitialized = false
    this.subscribers = new Map()
    this.messageQueue = []
    this.isProcessingQueue = false
    
    // Message types registry
    this.messageTypes = {
      // Authentication events
      AUTH_STATE_CHANGED: 'auth_state_changed',
      AUTH_LOGIN: 'auth_login',
      AUTH_LOGOUT: 'auth_logout',
      AUTH_REFRESH: 'auth_refresh',
      
      // Data sync events
      SYNC_START: 'sync_start',
      SYNC_COMPLETE: 'sync_complete',
      SYNC_ERROR: 'sync_error',
      DATA_CHANGED: 'data_changed',
      DATA_SYNCED: 'data_synced',
      
      // Storage events
      STORAGE_CHANGED: 'storage_changed',
      CACHE_CLEARED: 'cache_cleared',
      
      // Network events
      ONLINE: 'online',
      OFFLINE: 'offline',
      
      // UI events
      POPUP_OPENED: 'popup_opened',
      POPUP_CLOSED: 'popup_closed',
      
      // Job capture events
      JOB_DETECTED: 'job_detected',
      JOB_SAVED: 'job_saved',
      
      // System events
      EXTENSION_INSTALLED: 'extension_installed',
      EXTENSION_UPDATED: 'extension_updated'
    }
    
    // Statistics
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0
    }
  }

  /**
   * Initialize message bus
   */
  async init() {
    console.log('📨 Initializing Message Bus...')
    
    // Set up Chrome runtime message listener
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleChromeMessage(message, sender, sendResponse)
        return true // Keep channel open for async response
      })
    }
    
    // Set up Chrome connect listener for long-lived connections
    if (chrome.runtime?.onConnect) {
      chrome.runtime.onConnect.addListener((port) => {
        this.handleChromeConnection(port)
      })
    }
    
    this.isInitialized = true
    console.log('✅ Message Bus initialized')
  }

  /**
   * Subscribe to events
   * @param {string} eventType - Event type to subscribe to
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    
    this.subscribers.get(eventType).add(callback)
    
    console.log(`📨 Subscribed to: ${eventType}`)
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(eventType)
        }
      }
    }
  }

  /**
   * Publish event to subscribers
   * @param {string} eventType - Event type
   * @param {any} data - Event data
   */
  publish(eventType, data = null) {
    console.log(`📤 Publishing: ${eventType}`, data)
    
    this.stats.messagesSent++
    
    const subscribers = this.subscribers.get(eventType)
    if (!subscribers || subscribers.size === 0) {
      console.log(`No subscribers for: ${eventType}`)
      return
    }
    
    const event = {
      type: eventType,
      data,
      timestamp: Date.now()
    }
    
    // Notify all subscribers
    subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error(`Error in subscriber for ${eventType}:`, error)
        this.stats.errors++
      }
    })
  }

  /**
   * Send message to specific context (background, popup, content)
   * @param {string} target - Target context
   * @param {object} message - Message to send
   * @returns {Promise} Response from target
   */
  async sendToContext(target, message) {
    return new Promise((resolve, reject) => {
      const fullMessage = {
        ...message,
        target,
        source: this.getContextType(),
        timestamp: Date.now()
      }
      
      console.log(`📨 Sending to ${target}:`, message.type)
      
      try {
        chrome.runtime.sendMessage(fullMessage, (response) => {
          if (chrome.runtime.lastError) {
            console.error(`Failed to send to ${target}:`, chrome.runtime.lastError)
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      } catch (error) {
        console.error(`Error sending to ${target}:`, error)
        reject(error)
      }
    })
  }

  /**
   * Send message to background script
   */
  async sendToBackground(message) {
    return this.sendToContext('background', message)
  }

  /**
   * Send message to popup
   */
  async sendToPopup(message) {
    return this.sendToContext('popup', message)
  }

  /**
   * Send message to content script
   */
  async sendToContent(tabId, message) {
    return new Promise((resolve, reject) => {
      const fullMessage = {
        ...message,
        source: 'background',
        timestamp: Date.now()
      }
      
      try {
        chrome.tabs.sendMessage(tabId, fullMessage, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Broadcast message to all contexts
   */
  async broadcast(message) {
    console.log('📢 Broadcasting:', message.type)
    
    // Publish locally
    this.publish(message.type, message.data)
    
    // Send to background if not already there
    if (this.getContextType() !== 'background') {
      try {
        await this.sendToBackground(message)
      } catch (error) {
        console.error('Failed to broadcast to background:', error)
      }
    }
    
    // Send to all tabs with content scripts
    if (this.getContextType() === 'background') {
      try {
        const tabs = await chrome.tabs.query({})
        for (const tab of tabs) {
          try {
            await this.sendToContent(tab.id, message)
          } catch (error) {
            // Content script may not be injected, ignore
          }
        }
      } catch (error) {
        console.error('Failed to broadcast to content scripts:', error)
      }
    }
  }

  /**
   * Handle incoming Chrome runtime messages
   */
  handleChromeMessage(message, sender, sendResponse) {
    console.log('📥 Received message:', message.type, 'from:', sender.tab ? 'content' : 'extension')
    
    this.stats.messagesReceived++
    
    try {
      // Check if message is for this context
      const currentContext = this.getContextType()
      if (message.target && message.target !== currentContext) {
        return // Not for us
      }
      
      // Publish to local subscribers
      this.publish(message.type, message.data)
      
      // Send acknowledgment
      sendResponse({ 
        success: true, 
        received: true,
        context: currentContext,
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('Error handling message:', error)
      this.stats.errors++
      
      sendResponse({ 
        success: false, 
        error: error.message 
      })
    }
  }

  /**
   * Handle Chrome port connections (long-lived)
   */
  handleChromeConnection(port) {
    console.log('🔗 Port connected:', port.name)
    
    port.onMessage.addListener((message) => {
      console.log('📥 Port message:', message.type)
      this.publish(message.type, message.data)
    })
    
    port.onDisconnect.addListener(() => {
      console.log('🔌 Port disconnected:', port.name)
    })
  }

  /**
   * Get current context type
   */
  getContextType() {
    if (typeof chrome.extension !== 'undefined' && chrome.extension.getBackgroundPage) {
      try {
        if (chrome.extension.getBackgroundPage() === window) {
          return 'background'
        }
      } catch (e) {
        // Not background page
      }
    }
    
    if (window.location.pathname.includes('popup.html')) {
      return 'popup'
    }
    
    if (window.location.pathname.includes('auth.html')) {
      return 'auth'
    }
    
    return 'content'
  }

  /**
   * Queue message for later delivery
   */
  queueMessage(message) {
    this.messageQueue.push({
      ...message,
      queued: Date.now()
    })
    
    console.log(`📬 Queued message: ${message.type} (queue size: ${this.messageQueue.length})`)
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processMessageQueue()
    }
  }

  /**
   * Process queued messages
   */
  async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return
    }
    
    this.isProcessingQueue = true
    console.log(`📬 Processing message queue (${this.messageQueue.length} messages)`)
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      
      try {
        await this.broadcast(message)
      } catch (error) {
        console.error('Failed to process queued message:', error)
        // Re-queue if failed
        if (Date.now() - message.queued < 60000) { // Max 1 minute in queue
          this.messageQueue.push(message)
        }
      }
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    this.isProcessingQueue = false
    console.log('✅ Message queue processed')
  }

  /**
   * Request-response pattern
   */
  async request(eventType, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID()
      const timeoutId = setTimeout(() => {
        unsubscribe()
        reject(new Error(`Request timeout: ${eventType}`))
      }, timeout)
      
      // Subscribe to response
      const unsubscribe = this.subscribe(`${eventType}_response`, (event) => {
        if (event.data?.requestId === requestId) {
          clearTimeout(timeoutId)
          unsubscribe()
          resolve(event.data.response)
        }
      })
      
      // Publish request
      this.publish(eventType, {
        ...data,
        requestId,
        expectResponse: true
      })
    })
  }

  /**
   * Respond to request
   */
  respond(eventType, requestId, response) {
    this.publish(`${eventType}_response`, {
      requestId,
      response
    })
  }

  /**
   * Get message bus statistics
   */
  getStats() {
    return {
      ...this.stats,
      subscriberCount: this.subscribers.size,
      queueSize: this.messageQueue.length,
      context: this.getContextType()
    }
  }

  /**
   * Clear all subscribers
   */
  clearAllSubscribers() {
    this.subscribers.clear()
    console.log('🗑️  All subscribers cleared')
  }

  /**
   * Cleanup
   */
  cleanup() {
    console.log('🧹 Cleaning up Message Bus...')
    
    this.clearAllSubscribers()
    this.messageQueue = []
    
    console.log('✅ Message Bus cleanup complete')
  }
}

// Create singleton instance
const extensionMessageBus = new ExtensionMessageBus()

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = extensionMessageBus
} else if (typeof window !== 'undefined') {
  window.extensionMessageBus = extensionMessageBus
}