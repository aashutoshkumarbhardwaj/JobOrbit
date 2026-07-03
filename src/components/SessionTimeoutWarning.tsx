/**
 * Session Timeout Warning Component
 * 
 * Shows when session is about to expire (10 minutes remaining)
 * Allows user to extend session or logout
 * 
 * Usage:
 * <SessionTimeoutWarning />
 */

import { useEffect, useState } from 'react'
import { AlertCircle, Clock, LogOut, CheckCircle } from 'lucide-react'
import { useSessionTimeout, formatTimeRemaining } from '@/hooks/useSessionTimeout'
import { useAuth } from '@/lib/auth/auth-context'
import { useNavigate } from 'react-router-dom'

export function SessionTimeoutWarning() {
  const { showWarning, timeUntilExpiry, isExpired, extendSession } = useSessionTimeout()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [isExtending, setIsExtending] = useState(false)
  const [extendError, setExtendError] = useState<string | null>(null)

  const handleExtendSession = async () => {
    try {
      setIsExtending(true)
      setExtendError(null)
      await extendSession()
    } catch (error) {
      setExtendError(
        error instanceof Error ? error.message : 'Failed to extend session'
      )
    } finally {
      setIsExtending(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  if (!showWarning) {
    return null
  }

  if (isExpired) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold">Session Expired</h2>
          </div>

          <p className="text-muted-foreground">
            Your session has expired. Please sign in again to continue.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-semibold">Session Expiring Soon</h2>
        </div>

        {/* Time remaining */}
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-center text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            {formatTimeRemaining(timeUntilExpiry)}
          </p>
          <p className="text-center text-sm text-yellow-800 dark:text-yellow-200 mt-2">
            Your session will expire soon. Extend your session or you'll be logged out.
          </p>
        </div>

        {/* Error message if extension failed */}
        {extendError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-900 dark:text-red-100">
              ❌ {extendError}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center justify-center gap-2"
          >
            {isExtending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Extend Session
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            disabled={isExtending}
            className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Your session will be automatically extended if you stay active on this page.
        </p>
      </div>
    </div>
  )
}

export default SessionTimeoutWarning
