/**
 * API Base Client
 * Handles all HTTP requests with authentication, error handling, and logging
 * 
 * Security Features:
 * - JWT token management via AuthManager (Supabase session)
 * - Extension token support
 * - Rate limit tracking
 * - Session expiration handling
 * - CSRF protection
 * - Security headers
 */

import { ApiResponse, ApiError, ApiErrorClass, ApiRequestConfig } from './types'
import { 
  generateSecureRandomString,
  RateLimiterStore 
} from '@/lib/security'
import { authManager } from '@/lib/auth/AuthManager'
import { supabase } from '@/lib/supabase'

interface ClientConfig {
  baseUrl: string
  timeout?: number
  onTokenRefresh?: () => Promise<string | null>
}

class APIClient {
  private baseUrl: string
  private timeout: number
  private onTokenRefresh: (() => Promise<string | null>) | null = null
  private requestIdCounter = 0
  private rateLimitRemaining = -1
  private rateLimitReset = 0
  private failedRefreshAttempts = 0
  private maxFailedRefreshAttempts = 3
  private onSessionExpired: (() => void) | null = null
  private csrfToken: string | null = null
  private rateLimiter: RateLimiterStore

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl
    this.timeout = config.timeout || 30000
    this.onTokenRefresh = config.onTokenRefresh || null
    this.rateLimiter = new RateLimiterStore(100, 10) // 100 tokens, refill 10/sec
    this.generateCSRFToken()
  }

  /**
   * Generate CSRF token for security
   */
  private generateCSRFToken(): void {
    this.csrfToken = generateSecureRandomString(32)
  }

  /**
   * Get CSRF token (for forms)
   */
  getCSRFToken(): string {
    if (!this.csrfToken) {
      this.generateCSRFToken()
    }
    return this.csrfToken!
  }

  /**
   * Check rate limiting for endpoint
   */
  private checkRateLimit(endpoint: string): boolean {
    const result = this.rateLimiter.isAllowed(endpoint, 1)
    
    if (!result.allowed) {
      console.warn(`Rate limit exceeded for ${endpoint}. Reset in ${result.resetTime}s`)
      return false
    }
    
    return true
  }

  /**
   * Validate Bearer token format and expiration
   */
  private validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false
    }

    // Check Bearer token format
    if (!token.startsWith('eyJ')) {
      return false
    }

    // Basic JWT structure check (3 parts separated by dots)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }

    return true
  }

  /**
   * Get current auth token from AuthManager (Supabase session)
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await authManager.getAccessToken()
    } catch (error) {
      console.error('Failed to get auth token:', error)
      return null
    }
  }

  /**
   * Build request headers with authentication and security
   */
  private async buildHeaders(
    customHeaders?: Record<string, string>
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Security headers
      'X-Requested-With': 'XMLHttpRequest',
      'X-Content-Type-Options': 'nosniff',
    }

    // Add CSRF token for state-changing requests
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken
    }

    // Get token from AuthManager (async)
    const token = await this.getAuthToken()
    if (token && this.validateToken(token)) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Add extension token if available
    const extensionToken = this.getExtensionToken()
    if (extensionToken) {
      headers['X-Extension-Token'] = extensionToken
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders)
    }

    return headers
  }

  /**
   * Get extension token from localStorage
   */
  private getExtensionToken(): string | null {
    try {
      return localStorage.getItem('extension_session_token')
    } catch {
      return null
    }
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `${Date.now()}-${++this.requestIdCounter}`
  }

  /**
   * Build complete URL with query parameters (safely sanitized)
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, unknown>
  ): string {
    const url = new URL(endpoint, this.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Sanitize parameter values to prevent injection attacks
          const sanitized = String(value).substring(0, 1000)
          url.searchParams.append(key, sanitized)
        }
      })
    }

    return url.toString()
  }

  /**
   * Handle rate limiting headers
   */
  private handleRateLimitHeaders(
    headers: Headers
  ): void {
    const remaining = headers.get('x-ratelimit-remaining')
    const reset = headers.get('x-ratelimit-reset')

    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining, 10)
    }

    if (reset) {
      this.rateLimitReset = parseInt(reset, 10)
    }
  }

  /**
   * Handle token refresh if needed
   * Uses Supabase's built-in session refresh
   */
  private async handleTokenRefresh(): Promise<void> {
    try {
      // Refresh session via Supabase
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error || !data.session) {
        throw new Error(error?.message || 'Failed to refresh session')
      }

      // Reset failed attempts on successful refresh
      this.failedRefreshAttempts = 0
      console.log('✅ Session refreshed successfully')
    } catch (error) {
      this.failedRefreshAttempts++
      
      // If we've failed too many times, session is permanently expired
      if (this.failedRefreshAttempts >= this.maxFailedRefreshAttempts) {
        console.error('❌ Session expired - max refresh attempts exceeded')
        this.failedRefreshAttempts = 0 // Reset for next session
        
        // Trigger session expired callback (will redirect to login)
        if (this.onSessionExpired) {
          this.onSessionExpired()
        }
        
        throw new ApiErrorClass(
          'SESSION_EXPIRED',
          'Session has expired. Please sign in again.',
          401,
          error
        )
      }
      
      console.error(`Token refresh failed (${this.failedRefreshAttempts}/${this.maxFailedRefreshAttempts}):`, error)
      throw new ApiErrorClass(
        'TOKEN_REFRESH_FAILED',
        'Failed to refresh authentication token',
        401,
        error
      )
    }
  }

  /**
   * Handle HTTP response
   */
  private async handleResponse<T>(
    response: Response,
    requestId: string
  ): Promise<T> {
    // Handle rate limiting
    this.handleRateLimitHeaders(response.headers)

    const contentType = response.headers.get('content-type')
    let data: unknown

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else if (contentType?.includes('text')) {
      data = await response.text()
    } else {
      data = await response.blob()
    }

    // Log response
    console.log('API Response:', {
      requestId,
      status: response.status,
      url: response.url,
      timestamp: new Date().toISOString(),
    })

    // Handle error responses
    if (!response.ok) {
      const error: ApiError =
        typeof data === 'object' && data !== null && 'error' in data
          ? (data as { error: ApiError }).error
          : {
              code: `HTTP_${response.status}`,
              message: response.statusText || 'Unknown error',
            }

      throw new ApiErrorClass(
        error.code,
        error.message,
        response.status,
        error.details || data
      )
    }

    // Parse API response format
    if (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      'data' in data
    ) {
      const apiResponse = data as ApiResponse<T>
      if (!apiResponse.success && apiResponse.error) {
        throw new ApiErrorClass(
          apiResponse.error.code,
          apiResponse.error.message,
          response.status,
          apiResponse.error.details
        )
      }
      return apiResponse.data as T
    }

    return data as T
  }

  /**
   * Internal request method
   */
  private async request<T>(
    method: string,
    endpoint: string,
    config?: ApiRequestConfig
  ): Promise<T> {
    // Check rate limiting
    if (!this.checkRateLimit(endpoint)) {
      throw new ApiErrorClass(
        'RATE_LIMITED',
        'Too many requests. Please try again later.',
        429
      )
    }

    const requestId = this.generateRequestId()
    const url = this.buildUrl(endpoint, config?.params)
    const headers = await this.buildHeaders(config?.headers)
    const timeout = config?.timeout || this.timeout

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    }

    if (config?.body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(config.body)
    }

    console.log('API Request:', {
      requestId,
      method,
      url,
      timestamp: new Date().toISOString(),
    })

    try {
      const response = await fetch(url, fetchOptions)
      return await this.handleResponse<T>(response, requestId)
    } catch (error) {
      // Handle 401 Unauthorized - try token refresh
      if (
        error instanceof ApiErrorClass &&
        error.statusCode === 401
      ) {
        console.log('Token expired, attempting refresh...')
        await this.handleTokenRefresh()
        // Retry the request with new token
        return this.request<T>(method, endpoint, config)
      }

      // Re-throw other errors
      if (error instanceof ApiErrorClass) {
        throw error
      }

      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiErrorClass(
          'NETWORK_ERROR',
          'Network request failed. Please check your connection.',
          0,
          error
        )
      }

      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiErrorClass(
          'REQUEST_TIMEOUT',
          `Request timeout after ${timeout}ms`,
          0,
          error
        )
      }

      throw new ApiErrorClass(
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'An unknown error occurred',
        0,
        error
      )
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, config)
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>('POST', endpoint, {
      ...config,
      body,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, {
      ...config,
      body,
    })
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, {
      ...config,
      body,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: ApiRequestConfig
  ): Promise<T> {
    return this.request<T>('DELETE', endpoint, config)
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { remaining: number; reset: number } {
    return {
      remaining: this.rateLimitRemaining,
      reset: this.rateLimitReset,
    }
  }

  /**
   * Set token refresh handler
   */
  setTokenRefreshHandler(handler: () => Promise<string | null>): void {
    this.onTokenRefresh = handler
  }

  /**
   * Set session expired callback (e.g., redirect to login)
   */
  setSessionExpiredHandler(handler: () => void): void {
    this.onSessionExpired = handler
  }
}

// Create default client instance
const getApiBaseUrl = (): string => {
  const env = import.meta.env.VITE_API_URL
  if (!env) {
    console.warn('⚠️ VITE_API_URL environment variable not set, using Supabase Edge Functions URL')
    // Fallback to Supabase Edge Functions URL if env var not set
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dsbkjkwefszqqzukgdtk.supabase.co'
    return `${supabaseUrl}/functions/v1`
  }
  // Log the API URL being used
  console.log('📡 API Base URL:', env)
  return env
}

export const apiClient = new APIClient({
  baseUrl: getApiBaseUrl(),
  timeout: 15000, // Reduced from 30s to 15s to prevent buffering on localhost
})

export default apiClient
