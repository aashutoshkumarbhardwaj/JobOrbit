/**
 * Session Timeout Hook
 * 
 * Monitors session expiration and shows warning before timeout
 * Allows user to extend session or be redirected to login
 * 
 * Usage:
 * const { timeUntilExpiry, showWarning, extendSession } = useSessionTimeout()
 */

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import * as supabaseAuth from '@/lib/auth/supabase-auth'

export interface SessionTimeoutState {
  timeUntilExpiry: number | null // seconds until expiration
  timeUntilWarning: number | null // seconds until warning shows (50 min mark)
  showWarning: boolean // is warning currently shown
  isExpired: boolean // has session expired
  extendSession: () => Promise<void> // refresh the session
}

export function useSessionTimeout(): SessionTimeoutState {
  const { session } = useAuth()
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)
  const [timeUntilWarning, setTimeUntilWarning] = useState<number | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  const extendSession = useCallback(async () => {
    try {
      console.log('🔄 Extending session...')
      await supabaseAuth.refreshToken()
      console.log('✅ Session extended')
      setShowWarning(false)
    } catch (error) {
      console.error('Failed to extend session:', error)
      throw error
    }
  }, [])

  // Monitor session expiration
  useEffect(() => {
    if (!session?.expires_at) {
      setTimeUntilExpiry(null)
      setTimeUntilWarning(null)
      setShowWarning(false)
      return
    }

    const checkExpiration = () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at
      const secondsRemaining = expiresAt - now

      // Session is expired
      if (secondsRemaining <= 0) {
        console.warn('⚠️  Session has expired')
        setIsExpired(true)
        setShowWarning(true)
        setTimeUntilExpiry(0)
        return
      }

      setTimeUntilExpiry(secondsRemaining)

      // Show warning at 50-minute mark (600 seconds before 1-hour expiry)
      // For 1-hour sessions: warning at 50 min = 600 seconds before
      const warningThreshold = 600 // 10 minutes before expiry (conservative)
      
      if (secondsRemaining <= warningThreshold) {
        setShowWarning(true)
        setTimeUntilWarning(secondsRemaining)
      } else {
        setShowWarning(false)
        setTimeUntilWarning(null)
      }
    }

    // Check immediately
    checkExpiration()

    // Check every 30 seconds
    const interval = setInterval(checkExpiration, 30000)

    return () => clearInterval(interval)
  }, [session?.expires_at])

  return {
    timeUntilExpiry,
    timeUntilWarning,
    showWarning,
    isExpired,
    extendSession,
  }
}

/**
 * Format seconds to human readable time
 */
export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null) return ''
  if (seconds <= 0) return 'Session expired'

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${secs}s remaining`
  }
  return `${secs}s remaining`
}
