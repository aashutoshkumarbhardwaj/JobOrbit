/**
 * Extension Auth Page
 * Handles Chrome Extension authentication flow
 * 
 * Behavior:
 * - If already logged in: Return session info immediately
 * - If not logged in: Show login options, redirect back after auth
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Chrome, Mail, Github, LogIn } from 'lucide-react'

interface ExtensionAuthResponse {
  success: boolean
  session?: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
  user?: {
    id: string
    email: string
  }
  message?: string
  error?: string
}

export default function ExtensionAuth() {
  const { user, session, isLoading, isAuthenticated, signInWithGoogle, signInWithGitHub } = useAuth()
  const navigate = useNavigate()
  const [hasReturnedSession, setHasReturnedSession] = useState(false)

  /**
   * If already authenticated, return session to extension immediately
   */
  useEffect(() => {
    if (isLoading) return

    if (isAuthenticated && session && !hasReturnedSession) {
      // Send session back to extension
      sendSessionToExtension({
        success: true,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
          expires_at: session.expires_at || 0,
        },
        user: {
          id: user?.id || '',
          email: user?.email || '',
        },
        message: 'User already authenticated',
      })

      setHasReturnedSession(true)

      // Close window after short delay (extension will handle it)
      setTimeout(() => {
        // For extension popup, window.close() works
        window.close()
      }, 1000)
    }
  }, [isAuthenticated, session, isLoading, user, hasReturnedSession])

  /**
   * Send session to extension via postMessage
   */
  const sendSessionToExtension = (response: ExtensionAuthResponse) => {
    // Send to extension background script
    if (window.chrome?.runtime?.id) {
      try {
        window.chrome.runtime.sendMessage(
          {
            type: 'EXTENSION_AUTH_RESPONSE',
            payload: response,
          },
          (extensionResponse) => {
            if (chrome.runtime.lastError) {
              console.debug('Extension not available:', chrome.runtime.lastError)
            } else if (extensionResponse?.success) {
              console.log('Session delivered to extension')
            }
          }
        )
      } catch (error) {
        console.debug('Could not send to extension:', error)
      }
    }

    // Also send to any opener window (if opened via window.open)
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: 'EXTENSION_AUTH_RESPONSE',
            payload: response,
          },
          '*'
        )
      } catch (error) {
        console.debug('Could not send to opener:', error)
      }
    }
  }

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = async () => {
    try {
      // Set flag that this is extension auth
      sessionStorage.setItem('isExtensionAuth', 'true')
      await signInWithGoogle()
      // After successful login, auth state will update and trigger redirect to /auth/callback
    } catch (error) {
      console.error('Google login failed:', error)
      sendSessionToExtension({
        success: false,
        error: 'Google login failed',
      })
    }
  }

  /**
   * Handle GitHub OAuth login
   */
  const handleGithubLogin = async () => {
    try {
      // Set flag that this is extension auth
      sessionStorage.setItem('isExtensionAuth', 'true')
      await signInWithGitHub()
      // After successful login, auth state will update and trigger redirect to /auth/callback
    } catch (error) {
      console.error('GitHub login failed:', error)
      sendSessionToExtension({
        success: false,
        error: 'GitHub login failed',
      })
    }
  }

  /**
   * Handle email login - redirect to login page
   */
  const handleEmailLogin = () => {
    sessionStorage.setItem('isExtensionAuth', 'true')
    navigate('/login?returnTo=/extension-auth&isExtension=true')
  }

  // Still loading auth state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-muted-foreground">Checking authentication status...</p>
      </div>
    )
  }

  // Already authenticated - show confirmation before closing
  if (isAuthenticated && session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">Connected!</h1>
          <p className="text-muted-foreground">
            Your account is already authenticated.
          </p>
          <p className="text-sm text-muted-foreground">
            User: <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <div className="pt-4 text-xs text-muted-foreground">
            Syncing with extension...
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated - show login options
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Chrome className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Job Orbit</h1>
          </div>
          <h2 className="text-lg font-semibold">Sign in to extension</h2>
          <p className="text-sm text-muted-foreground">
            Authenticate to sync with the Job Orbit Chrome Extension
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-3">
          {/* Google OAuth */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            size="lg"
            className="w-full h-12 gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* GitHub OAuth */}
          <Button
            onClick={handleGithubLogin}
            variant="outline"
            size="lg"
            className="w-full h-12 gap-2"
          >
            <Github className="w-5 h-5" />
            Sign in with GitHub
          </Button>

          {/* Email Login */}
          <Button
            onClick={handleEmailLogin}
            variant="outline"
            size="lg"
            className="w-full h-12 gap-2"
          >
            <Mail className="w-5 h-5" />
            Sign in with Email
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">ℹ️ How it works</p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Sign in with your preferred account</li>
            <li>• Your session automatically syncs with the extension</li>
            <li>• Both web and extension share the same account</li>
            <li>• Changes sync in real-time</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            New to Job Orbit?{' '}
            <button
              onClick={() => navigate('/signup?returnTo=/extension-auth')}
              className="text-primary hover:underline font-medium"
            >
              Create an account
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            Having trouble?{' '}
            <a
              href="https://github.com/aashutosh-kumar/JobOrbit/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
