/**
 * Chrome Extension API Client
 * Centralized HTTP client with authentication, error handling, retries, and timeouts
 * 
 * Features:
 * - Automatic extension token attachment
 * - Request/response interceptors
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Error standardization
 * - Network failure detection
 * - 401/403 handling with auth manager integration
 */

class ExtensionApiClient {
  constructor() {
    this.config = {
      // Will be set by environment detection
      baseUrl: null,
      supabaseUrl: null,
      timeout: 30000, // 30 seconds default timeout
      maxRetries: 3,
      retryDelay: 1000, // Initial retry delay (ms)
      retryBackoffMultiplier: 2
    }
    
    this.authManager = null // Will be injected
    this.isInitialized = false
  }

  /**
   * Initialize API client
   */
  async init(authManager) {
    console.log('🌐 Initializing Extension API Client...')
    
    this.authManager = authManager
    
    // Detect environment and set URLs
    await this.detectEnvironment()
    
    this.isInitialized = true
    console.log('✅ Extension API Client initialized')
  }

  /**
   * Detect environment and set base URLs
   */
  async detectEnvironment() {
    try {
      const testUrls = [
        'http://localhost:5173',
        'https://joborbit.com'
      ]
      
      for (const url of testUrls) {
        try {
          const response = await this.rawFetch(`${url}/api/health`, {
            method: 'HEAD',
            mode: 'no-cors'
          })
          
          this.config.baseUrl = url
          this.config.supabaseUrl = url === 'http://localhost:5173' 
            ? 'http://localhost:54321'
            : 'https://your-project.supabase.co'
          
          console.log('🌐 Detected environment:', url)
          return
        } catch (e) {
          // Continue to next URL
        }
      }
      
      // Default to production
      this.config.baseUrl = 'https://joborbit.com'
      this.config.supabaseUrl = 'https://your-project.supabase.co'
      console.log('🌐 Using production environment')
      
    } catch (error) {
      console.error('Failed to detect environment:', error)
      // Fallback to production
      this.config.baseUrl = 'https://joborbit.com'
      this.config.supabaseUrl = 'https://your-project.supabase.co'
    }
  }

  /**
   * Raw fetch wrapper (for internal use only)
   */
  async rawFetch(url, options = {}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeout)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeout)
      return response
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  }

  /**
   * Make authenticated request with retries and error handling
   */
  async request(endpoint, options = {}) {
    if (!this.isInitialized) {
      throw new Error('API Client not initialized. Call init() first.')
    }

    const {
      method = 'GET',
      body = null,
      headers = {},
      skipAuth = false,
      skipRetries = false,
      timeout = this.config.timeout
    } = options

    // Build URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.config.baseUrl}/api/v1${endpoint}`

    // Build headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    }

    // Add extension token if authenticated
    if (!skipAuth && this.authManager) {
      const authHeader = this.authManager.getAuthHeader()
      if (authHeader) {
        Object.assign(requestHeaders, authHeader)
      }
    }

    // Build request options
    const requestOptions = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : null
    }

    // Execute request with retries
    if (skipRetries) {
      return this.executeRequest(url, requestOptions, timeout)
    } else {
      return this.executeRequestWithRetries(url, requestOptions, timeout)
    }
  }

  /**
   * Execute single request
   */
  async executeRequest(url, options, timeout) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      console.log('🌐 API Request:', options.method, url)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Handle response
      await this.handleResponse(response, url, options.method)

      // Parse JSON if response has content
      let data = null
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json()
      }

      console.log('✅ API Response:', response.status, url)
      return {
        success: true,
        data,
        status: response.status,
        headers: response.headers
      }

    } catch (error) {
      clearTimeout(timeoutId)
      throw this.normalizeError(error, url, options.method)
    }
  }

  /**
   * Execute request with retry logic
   */
  async executeRequestWithRetries(url, options, timeout) {
    let lastError = null
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.config.retryDelay * Math.pow(this.config.retryBackoffMultiplier, attempt - 1)
          console.log(`🔄 Retrying request (${attempt}/${this.config.maxRetries}) after ${delay}ms...`)
          await this.sleep(delay)
        }

        return await this.executeRequest(url, options, timeout)

      } catch (error) {
        lastError = error
        
        // Don't retry certain errors
        if (this.shouldNotRetry(error)) {
          console.log('❌ Not retrying due to error type:', error.type)
          break
        }
        
        // Don't retry on last attempt
        if (attempt === this.config.maxRetries) {
          console.log('❌ Max retries exceeded')
          break
        }
      }
    }

    throw lastError
  }

  /**
   * Handle HTTP response
   */
  async handleResponse(response, url, method) {
    // Handle successful responses
    if (response.ok) {
      return
    }

    // Handle specific error status codes
    if (response.status === 401) {
      console.warn('🔐 Unauthorized (401) - Extension token invalid')
      
      // Clear auth state if token is invalid
      if (this.authManager) {
        await this.authManager.clearAuth()
      }
      
      throw {
        type: 'UNAUTHORIZED',
        status: 401,
        message: 'Authentication required. Please sign in again.',
        url,
        method
      }
    }

    if (response.status === 403) {
      console.warn('🚫 Forbidden (403) - Access denied')
      throw {
        type: 'FORBIDDEN', 
        status: 403,
        message: 'Access denied. You do not have permission to perform this action.',
        url,
        method
      }
    }

    if (response.status === 429) {
      console.warn('⏰ Rate limited (429)')
      throw {
        type: 'RATE_LIMITED',
        status: 429,
        message: 'Too many requests. Please wait and try again.',
        url,
        method,
        retryAfter: response.headers.get('Retry-After')
      }
    }

    if (response.status >= 500) {
      console.error('🔥 Server error:', response.status)
      throw {
        type: 'SERVER_ERROR',
        status: response.status,
        message: 'Server error. Please try again later.',
        url,
        method
      }
    }

    // Generic client error
    let errorMessage = 'Request failed'
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch (e) {
      // Could not parse error response
    }

    throw {
      type: 'CLIENT_ERROR',
      status: response.status,
      message: errorMessage,
      url,
      method
    }
  }

  /**
   * Normalize error objects
   */
  normalizeError(error, url, method) {
    // Already normalized
    if (error.type) {
      return error
    }

    // Timeout error
    if (error.name === 'AbortError') {
      return {
        type: 'TIMEOUT',
        status: 0,
        message: 'Request timed out. Please check your connection and try again.',
        url,
        method
      }
    }

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'NETWORK_ERROR',
        status: 0,
        message: 'Network error. Please check your internet connection.',
        url,
        method,
        originalError: error
      }
    }

    // Generic error
    return {
      type: 'UNKNOWN_ERROR',
      status: 0,
      message: error.message || 'An unknown error occurred',
      url,
      method,
      originalError: error
    }
  }

  /**
   * Check if error should not be retried
   */
  shouldNotRetry(error) {
    const noRetryTypes = [
      'UNAUTHORIZED',
      'FORBIDDEN', 
      'CLIENT_ERROR'
    ]
    
    return noRetryTypes.includes(error.type)
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET'
    })
  }

  /**
   * POST request
   */
  async post(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body
    })
  }

  /**
   * PATCH request
   */
  async patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    })
  }

  /**
   * Make request to Supabase Functions
   */
  async supabaseFunction(functionName, options = {}) {
    const url = `${this.config.baseUrl}/functions/v1/${functionName}`
    
    return this.request(url, {
      ...options,
      skipAuth: false, // Use extension token
      headers: {
        'X-Extension-Token': 'true',
        ...options.headers
      }
    })
  }

  /**
   * Make request to Supabase Auth API
   */
  async supabaseAuth(endpoint, options = {}) {
    const url = `${this.config.supabaseUrl}/auth/v1/${endpoint}`
    
    return this.request(url, {
      ...options,
      skipAuth: true, // Don't use extension token for Supabase auth
      headers: {
        'apikey': 'your-supabase-anon-key', // Would be injected at build time
        ...options.headers
      }
    })
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      const response = await this.get('/health', {
        skipAuth: true,
        skipRetries: true,
        timeout: 5000
      })
      
      return response.success
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    }
  }
}

// Create singleton instance
const extensionApiClient = new ExtensionApiClient()

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = extensionApiClient
} else if (typeof window !== 'undefined') {
  window.extensionApiClient = extensionApiClient
}