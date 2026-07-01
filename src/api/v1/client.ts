/**
 * API Base Client
 * Handles all HTTP requests with authentication, error handling, and logging
 */

import { ApiResponse, ApiError, ApiErrorClass, ApiRequestConfig } from './types'

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

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl
    this.timeout = config.timeout || 30000
    this.onTokenRefresh = config.onTokenRefresh || null
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `${Date.now()}-${++this.requestIdCounter}`
  }

  /**
   * Get current auth token from localStorage
   */
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token')
    } catch {
      return null
    }
  }

  /**
   * Set auth token in localStorage
   */
  private setAuthToken(token: string): void {
    try {
      localStorage.setItem('auth_token', token)
    } catch (error) {
      console.error('Failed to store auth token:', error)
    }
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders)
    }

    return headers
  }

  /**
   * Build complete URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, unknown>
  ): string {
    const url = new URL(endpoint, this.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value))
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
   */
  private async handleTokenRefresh(): Promise<void> {
    if (!this.onTokenRefresh) return

    try {
      const newToken = await this.onTokenRefresh()
      if (newToken) {
        this.setAuthToken(newToken)
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
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
    const requestId = this.generateRequestId()
    const url = this.buildUrl(endpoint, config?.params)
    const headers = this.buildHeaders(config?.headers)
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
        error.statusCode === 401 &&
        this.onTokenRefresh
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
}

// Create default client instance
const getApiBaseUrl = (): string => {
  const env = import.meta.env.VITE_API_URL
  if (!env) {
    console.warn('VITE_API_URL environment variable not set')
    return 'http://localhost:3000/api/v1'
  }
  return env
}

export const apiClient = new APIClient({
  baseUrl: getApiBaseUrl(),
  timeout: 30000,
})

export default apiClient
