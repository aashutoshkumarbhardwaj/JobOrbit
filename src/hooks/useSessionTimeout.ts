/**
 * Session Timeout Hook
 * 
 * Monitors session expiration and provides warnings
 * Integrates with AuthManager for session management
 */

import { useState, useEffect, useCallback } from 'react'
import { authManager } from '@/lib/auth/AuthManager'

// Warning threshold: show warning when 10 minutes or less remain
const WARNING_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes

interface UseSessionTimeoutResult {
  showWarning: boolean
  timeUntilExpiry: number // milliseconds
  isExpired: boolean
  extendSession: () => Promise<void>
}

/**
 * Hook to monitor session timeout and show warnings
 */
export function useSessionTimeout(): UseSessionTimeoutResult {
  const [showWarning, setShowWarning] = useState(false)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(Infinity)
  const [isExpired, setIsExpired] = useState(false)

  // Calculate time until session expiry
  const calculateTimeRemaining = useCallback(() => {
    const authState = authManager.getAuthState()
    
    if (!authState.session) {
      return Infinity
    }

    // Supabase sessions have expires_at timestamp
    const expiresAt = authState.session.expires_at
    if (!expiresAt) {
      return Infinity
    }

    const now = Math.floor(Date.now() / 1000) // current time in seconds
    const remainingSeconds = expiresAt - now
    const remainingMs = remainingSeconds * 1000

    return Math.max(0, remainingMs)
  }, [])

  // Extend session by refreshing the token
  const extendSession = useCallback(async () => {
    try {
      // Get fresh token from AuthManager
      const token = await authManager.getAccessToken()
      
      if (!token) {
        throw new Error('Failed to refresh session')
      }

      // Reset warning state
      setShowWarning(false)
      setIsExpired(false)
      
      console.log('✅ Session extended successfully')
    } catch (error) {
      console.error('❌ Failed to extend session:', error)
      throw error
    }
  }, [])

  // Monitor session expiration
  useEffect(() => {
    const checkSessionStatus = () => {
      const remaining = calculateTimeRemaining()
      
      setTimeUntilExpiry(remaining)

      if (remaining === 0) {
        setIsExpired(true)
        setShowWarning(true)
      } else if (remaining <= WARNING_THRESHOLD_MS) {
        setShowWarning(true)
        setIsExpired(false)
      } else {
        setShowWarning(false)
        setIsExpired(false)
      }
    }

    // Check immediately
    checkSessionStatus()

    // Check every 30 seconds
    const interval = setInterval(checkSessionStatus, 30 * 1000)

    return () => clearInterval(interval)
  }, [calculateTimeRemaining])

  return {
    showWarning,
    timeUntilExpiry,
    isExpired,
    extendSession,
  }
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(ms: number): string {
  if (ms === Infinity) {
    return 'Active'
  }

  if (ms <= 0) {
    return 'Expired'
  }

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${seconds}s`
}
