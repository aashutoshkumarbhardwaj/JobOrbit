/**
 * Auth Callback Page
 * Handles OAuth redirect from Supabase
 * 
 * Flow:
 * 1. User clicks "Sign in with Google/GitHub"
 * 2. Redirected to Supabase OAuth consent screen
 * 3. User grants permission
 * 4. Supabase redirects back to /auth/callback
 * 5. This page handles the redirect
 * 6. Stores session and creates extension session (if needed)
 * 7. Returns extension token to extension or redirects to app
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-context'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AlertCircle } from 'lucide-react'

interface CallbackState {
  status: 'loading' | 'success' | 'error'
  message?: string
  returnTo?: string
}

interface ExtensionSessionResponse {
  success: boolean
  extension_token?: string
  extension_token_expires_in?: number
  session_id?: string
  error?: string
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, isLoading, error: authError } = useAuth()
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Completing sign in...',
  })

  /**
   * Create extension session via edge function
   */
  const createExtensionSession = async (accessToken: string): Promise<ExtensionSessionResponse> => {
    try {
      console.log('🔌 Creating extension session...')

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/extension-session`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        console.error('❌ Extension session creation failed:', response.status)
        return {
          success: false,
          error: `HTTP ${response.status}`,
        }
      }

      const data = await response.json()
      console.log('✅ Extension session created:', {
        session_id: data.data?.session_id,
        expires_in: data.data?.extension_token_expires_in,
      })

      return {
        success: data.success,
        extension_token: data.data?.extension_token,
        extension_token_expires_in: data.data?.extension_token_expires_in,
        session_id: data.data?.session_id,
      }
    } catch (error) {
      console.error('❌ Error creating extension session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Return extension auth success as JSON response
   * This is called instead of navigating/redirecting
   */
  const returnExtensionAuthSuccess = (data: {
    extension_token: string
    session_id?: string
    expires_in?: number
    user?: {
      id?: string
      email?: string
    }
  }) => {
    console.log('✅ Extension auth success - returning JSON response')

    // Calculate expires_at timestamp
    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600)

    // Build response
    const response = {
      success: true,
      extensionToken: data.extension_token,
      sessionId: data.session_id,
      expiresAt: expiresAt,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    }

    console.log('📤 Sending extension session to extension...')

    // Send to extension background script via chrome.runtime.sendMessage
    if (window.chrome?.runtime?.id) {
      try {
        window.chrome.runtime.sendMessage(
          {
            type: 'EXTENSION_AUTH_SUCCESS',
            payload: response,
          },
          (extensionResponse) => {
            if (chrome.runtime.lastError) {
              console.debug('Extension not available:', chrome.runtime.lastError.message)
            } else if (extensionResponse?.success) {
              console.log('✅ Extension received session token')
            }
          }
        )
      } catch (error) {
        console.debug('Could not send to extension runtime:', error)
      }
    }

    // Fallback: Send to opener window (if opened via window.open)
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: 'EXTENSION_AUTH_SUCCESS',
            payload: response,
          },
          '*'
        )
        console.log('✅ Sent session to opener window')
      } catch (error) {
        console.debug('Could not send to opener:', error)
      }
    }

    // Store in window object for direct access
    (window as any).__EXTENSION_AUTH_RESPONSE = response
    console.log('💾 Stored response in window.__EXTENSION_AUTH_RESPONSE')

    // Show success page (optional - extension will close this window)
    setState({
      status: 'success',
      message: 'Connected to extension!',
    })
  }

  /**
   * Return extension auth error as JSON response
   * This is called instead of navigating/redirecting
   */
  const returnExtensionAuthError = (errorMessage: string) => {
    console.error('❌ Extension auth error - returning error response:', errorMessage)

    const response = {
      success: false,
      error: errorMessage,
      extensionToken: null,
    }

    console.log('📤 Sending error to extension...')

    // Send to extension background script via chrome.runtime.sendMessage
    if (window.chrome?.runtime?.id) {
      try {
        window.chrome.runtime.sendMessage(
          {
            type: 'EXTENSION_AUTH_ERROR',
            payload: response,
          },
          (extensionResponse) => {
            if (chrome.runtime.lastError) {
              console.debug('Extension not available:', chrome.runtime.lastError.message)
            }
          }
        )
      } catch (error) {
        console.debug('Could not send to extension runtime:', error)
      }
    }

    // Fallback: Send to opener window
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: 'EXTENSION_AUTH_ERROR',
            payload: response,
          },
          '*'
        )
        console.log('✅ Sent error to opener window')
      } catch (error) {
        console.debug('Could not send to opener:', error)
      }
    }

    // Store in window object for direct access
    (window as any).__EXTENSION_AUTH_RESPONSE = response
    console.log('💾 Stored error in window.__EXTENSION_AUTH_RESPONSE')

    // Show error page
    setState({
      status: 'error',
      message: errorMessage,
    })
  }

  /**
   * Send extension session to extension via postMessage
   */
  const sendExtensionSessionToExtension = (extensionSession: ExtensionSessionResponse) => {
    console.log('📤 Sending extension session to extension...')

    // Send to extension background script
    if (window.chrome?.runtime?.id) {
      try {
        window.chrome.runtime.sendMessage(
          {
            type: 'EXTENSION_SESSION_CREATED',
            payload: {
              extensionToken: extensionSession.extension_token,
              sessionId: extensionSession.session_id,
              expiresAt: Date.now() + (extensionSession.extension_token_expires_in || 3600) * 1000,
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.debug('Extension not available for session:', chrome.runtime.lastError)
            } else if (response?.success) {
              console.log('✅ Extension received session')
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
            type: 'EXTENSION_SESSION_CREATED',
            payload: {
              extensionToken: extensionSession.extension_token,
              sessionId: extensionSession.session_id,
              expiresAt: Date.now() + (extensionSession.extension_token_expires_in || 3600) * 1000,
            },
          },
          '*'
        )
        console.log('✅ Extension opener received session')
      } catch (error) {
        console.debug('Could not send to opener:', error)
      }
    }
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 Auth callback handler started')

        // Get return URL from search params or use default
        const returnTo = searchParams.get('returnTo') || '/dashboard'
        const isExtensionFromParam = searchParams.get('isExtension') === 'true'
        const isExtensionFromStorage = sessionStorage.getItem('isExtensionAuth') === 'true'
        const isExtensionAuth = isExtensionFromParam || isExtensionFromStorage
        
        console.log('📍 Will redirect to:', returnTo)
        console.log('🔌 Extension auth request:', isExtensionAuth)

        // Wait a moment for auth context to process
        if (isLoading) {
          console.log('⏳ Waiting for auth context to load...')
          return // Will retry in next effect run
        }

        // Check for auth error
        if (authError) {
          console.error('❌ Auth error:', authError)
          if (isExtensionAuth) {
            returnExtensionAuthError(authError)
            return
          }
          setState({
            status: 'error',
            message: authError,
            returnTo,
          })
          return
        }

        // Check if we have a session
        if (!session) {
          console.warn('⚠️  No session after callback')
          if (isExtensionAuth) {
            returnExtensionAuthError('Failed to establish session')
            return
          }
          setState({
            status: 'error',
            message: 'Failed to establish session. Please try again.',
            returnTo,
          })
          return
        }

        // Success! Session is established
        console.log('✅ Session established')
        console.log('👤 User:', session.user?.email)
        console.log('⏱️  Expires at:', new Date(session.expires_at * 1000).toISOString())

        // If this is an extension auth request, return token immediately
        if (isExtensionAuth) {
          console.log('🔌 Extension auth detected - returning token as JSON')
          
          try {
            const extensionSession = await createExtensionSession(session.access_token)

            if (extensionSession.success && extensionSession.extension_token) {
              console.log('✅ Extension session created')
              console.log('📤 Returning extension token to caller')
              
              // Return as JSON response instead of redirecting
              returnExtensionAuthSuccess({
                extension_token: extensionSession.extension_token,
                session_id: extensionSession.session_id,
                expires_in: extensionSession.extension_token_expires_in,
                user: {
                  id: session.user?.id,
                  email: session.user?.email,
                },
              })
              return
            } else {
              console.error('❌ Failed to create extension session:', extensionSession.error)
              returnExtensionAuthError(extensionSession.error || 'Failed to create extension session')
              return
            }
          } catch (err) {
            console.error('❌ Error creating extension session:', err)
            returnExtensionAuthError(err instanceof Error ? err.message : 'Unknown error')
            return
          }
        }

        // Regular web app login - show success and redirect to dashboard
        setState({
          status: 'success',
          message: `Welcome back, ${session.user?.email}!`,
          returnTo,
        })

        setTimeout(() => {
          console.log('🚀 Redirecting to:', returnTo)
          navigate(returnTo, { replace: true })
        }, 1000)
      } catch (err) {
        console.error('❌ Callback handler error:', err)
        if (searchParams.get('isExtension') === 'true') {
          returnExtensionAuthError(err instanceof Error ? err.message : 'Unknown error')
          return
        }
        setState({
          status: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred during sign in',
          returnTo: searchParams.get('returnTo') || '/dashboard',
        })
      }
    }

    handleCallback()
  }, [session, isLoading, authError, searchParams, navigate])

  // Still loading
  if (state.status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="w-16 h-16 animate-spin rounded-full border-4 border-muted border-t-primary mb-4" />
        <p className="text-lg font-semibold">{state.message}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Do not close this window
        </p>
      </div>
    )
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">Sign In Failed</h1>
            <p className="text-muted-foreground">{state.message}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition"
            >
              Try Again
            </button>

            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full px-4 py-2 border border-input rounded-md hover:bg-muted font-medium transition"
            >
              Back to Home
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Try signing in with a different provider, or{' '}
              <a
                href="https://github.com/aashutosh-kumar/JobOrbit/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline font-medium"
              >
                contact support
              </a>
              {' '}if the problem persists.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
        <div className="w-8 h-8 bg-green-500 rounded-full" />
      </div>
      <p className="text-lg font-semibold">{state.message}</p>
      <p className="text-sm text-muted-foreground mt-2">
        Redirecting you now...
      </p>
    </div>
  )
}
