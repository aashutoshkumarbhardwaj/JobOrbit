/**
 * Extension API Hook
 * 
 * Handles all API calls for Chrome Extension with:
 * - Automatic token validation and refresh
 * - Error handling and retry logic
 * - Type-safe API methods
 * 
 * Usage:
 * const { getProfile, getResumes, loading, error } = useExtensionAPI()
 * const profile = await getProfile()
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { apiClient } from '@/api/v1'
import {
  getStoredExtensionToken,
  isExtensionTokenExpired,
  clearExtensionToken,
} from '@/api/v1/middleware/extension-token'
import { refreshExtensionSession } from '@/api/v1/endpoints/extension'
import type { Profile, Resume, AIAnswer, Application, UserSettings } from '@/types'

interface UseExtensionAPIOptions {
  /**
   * Auto-refresh token if expired before making requests
   * @default true
   */
  autoRefresh?: boolean

  /**
   * Max retry attempts on failure
   * @default 2
   */
  maxRetries?: number

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
}

interface ExtensionAPIError {
  code: string
  message: string
  statusCode?: number
}

/**
 * Hook for extension API operations with token management
 */
export function useExtensionAPI(options: UseExtensionAPIOptions = {}) {
  const {
    autoRefresh = true,
    maxRetries = 2,
    debug = false,
  } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ExtensionAPIError | null>(null)
  const retryCountRef = useRef<Record<string, number>>({})

  /**
   * Log debug message
   */
  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log('🔌 [Extension API]', ...args)
      }
    },
    [debug]
  )

  /**
   * Check if token needs refresh and refresh if needed
   */
  const ensureValidToken = useCallback(async () => {
    try {
      const token = getStoredExtensionToken()
      if (!token) {
        log('No extension token found')
        return false
      }

      if (!autoRefresh) {
        return true
      }

      const needsRefresh = await isExtensionTokenExpired()
      if (needsRefresh) {
        log('Token expired, refreshing...')
        const response = await refreshExtensionSession()

        if (!response.success) {
          log('Failed to refresh token:', response.error)
          clearExtensionToken()
          throw new Error('Token refresh failed: ' + response.error)
        }

        log('Token refreshed successfully')
        return true
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token validation failed'
      setError({
        code: 'TOKEN_ERROR',
        message,
      })
      log('Token validation error:', message)
      return false
    }
  }, [autoRefresh, log])

  /**
   * Make API request with token management
   */
  const makeRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
      body?: unknown,
      operation: string = endpoint
    ): Promise<T | null> => {
      const retryKey = operation
      const currentRetries = retryCountRef.current[retryKey] || 0

      try {
        setLoading(true)
        setError(null)

        // Ensure token is valid
        const tokenValid = await ensureValidToken()
        if (!tokenValid) {
          throw new Error('Invalid or missing extension token')
        }

        // Make request with extension token header
        const token = getStoredExtensionToken()
        if (!token) {
          throw new Error('No extension token available')
        }

        log(`${method} ${endpoint}`)

        let response: T

        if (method === 'GET') {
          response = await apiClient.get<T>(endpoint, {
            headers: { 'X-Extension-Token': token },
          })
        } else if (method === 'POST') {
          response = await apiClient.post<T>(endpoint, body, {
            headers: { 'X-Extension-Token': token },
          })
        } else if (method === 'PATCH') {
          response = await apiClient.patch<T>(endpoint, body, {
            headers: { 'X-Extension-Token': token },
          })
        } else if (method === 'DELETE') {
          response = await apiClient.delete<T>(endpoint, {
            headers: { 'X-Extension-Token': token },
          })
        } else {
          throw new Error(`Unsupported method: ${method}`)
        }

        // Reset retry count on success
        retryCountRef.current[retryKey] = 0
        log(`✅ ${operation} success`)

        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'

        // Retry logic
        if (currentRetries < maxRetries) {
          retryCountRef.current[retryKey] = currentRetries + 1
          log(`Retry ${currentRetries + 1}/${maxRetries} for ${operation}`)

          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (currentRetries + 1)))
          return makeRequest<T>(endpoint, method, body, operation)
        }

        // Max retries exceeded
        const error: ExtensionAPIError = {
          code: 'API_ERROR',
          message: errorMessage,
          statusCode: err instanceof Error && 'statusCode' in err
            ? (err as any).statusCode
            : undefined,
        }

        setError(error)
        log(`❌ ${operation} failed:`, error.message)

        // If token error, clear it
        if (errorMessage.includes('token') || errorMessage.includes('401')) {
          clearExtensionToken()
        }

        throw error
      } finally {
        setLoading(false)
      }
    },
    [ensureValidToken, maxRetries, log]
  )

  /**
   * Get user profile
   */
  const getProfile = useCallback(async () => {
    try {
      const data = await makeRequest<Profile>('/profile-get', 'GET', undefined, 'getProfile')
      return data
    } catch (err) {
      log('Failed to get profile:', err)
      return null
    }
  }, [makeRequest, log])

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      try {
        const data = await makeRequest<Profile>(
          '/profile-patch',
          'PATCH',
          updates,
          'updateProfile'
        )
        return data
      } catch (err) {
        log('Failed to update profile:', err)
        return null
      }
    },
    [makeRequest, log]
  )

  /**
   * Get user resumes
   */
  const getResumes = useCallback(async () => {
    try {
      const data = await makeRequest<Resume[]>(
        '/resumes-get',
        'GET',
        undefined,
        'getResumes'
      )
      return data || []
    } catch (err) {
      log('Failed to get resumes:', err)
      return []
    }
  }, [makeRequest, log])

  /**
   * Create new resume
   */
  const createResume = useCallback(
    async (resume: Omit<Resume, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const data = await makeRequest<Resume>(
          '/resumes-post',
          'POST',
          resume,
          'createResume'
        )
        return data
      } catch (err) {
        log('Failed to create resume:', err)
        return null
      }
    },
    [makeRequest, log]
  )

  /**
   * Get AI answers
   */
  const getAnswers = useCallback(async () => {
    try {
      const data = await makeRequest<AIAnswer[]>(
        '/answers-get',
        'GET',
        undefined,
        'getAnswers'
      )
      return data || []
    } catch (err) {
      log('Failed to get answers:', err)
      return []
    }
  }, [makeRequest, log])

  /**
   * Create AI answer
   */
  const createAnswer = useCallback(
    async (answer: Omit<AIAnswer, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const data = await makeRequest<AIAnswer>(
          '/answers-post',
          'POST',
          answer,
          'createAnswer'
        )
        return data
      } catch (err) {
        log('Failed to create answer:', err)
        return null
      }
    },
    [makeRequest, log]
  )

  /**
   * Get job applications
   */
  const getApplications = useCallback(async () => {
    try {
      const data = await makeRequest<Application[]>(
        '/applications-get',
        'GET',
        undefined,
        'getApplications'
      )
      return data || []
    } catch (err) {
      log('Failed to get applications:', err)
      return []
    }
  }, [makeRequest, log])

  /**
   * Create job application
   */
  const createApplication = useCallback(
    async (application: Omit<Application, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const data = await makeRequest<Application>(
          '/applications-post',
          'POST',
          application,
          'createApplication'
        )
        return data
      } catch (err) {
        log('Failed to create application:', err)
        return null
      }
    },
    [makeRequest, log]
  )

  /**
   * Update job application
   */
  const updateApplication = useCallback(
    async (id: string, updates: Partial<Application>) => {
      try {
        const data = await makeRequest<Application>(
          `/applications-patch/${id}`,
          'PATCH',
          updates,
          'updateApplication'
        )
        return data
      } catch (err) {
        log('Failed to update application:', err)
        return null
      }
    },
    [makeRequest, log]
  )

  /**
   * Get user settings
   */
  const getSettings = useCallback(async () => {
    try {
      const data = await makeRequest<UserSettings>(
        '/settings-get',
        'GET',
        undefined,
        'getSettings'
      )
      return data
    } catch (err) {
      log('Failed to get settings:', err)
      return null
    }
  }, [makeRequest, log])

  /**
   * Update user settings
   */
  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      try {
        const data = await makeRequest<UserSettings>(
          '/settings-patch',
          'PATCH',
          updates,
          'updateSettings'
        )
        return data
      } catch (err) {
        log('Failed to update settings:', err)
        return null
      }
    },
    [makeRequest, log]
  )

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // API Methods
    getProfile,
    updateProfile,
    getResumes,
    createResume,
    getAnswers,
    createAnswer,
    getApplications,
    createApplication,
    updateApplication,
    getSettings,
    updateSettings,

    // State
    loading,
    error,
    clearError,

    // Helpers
    ensureValidToken,
  }
}
