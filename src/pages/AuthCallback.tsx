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
 * 6. Stores session and redirects to appropriate page
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

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, isLoading, error: authError } = useAuth()
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Completing sign in...',
  })

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 Auth callback handler started')

        // Get return URL from search params or use default
        const returnTo = searchParams.get('returnTo') || '/dashboard'
        console.log('📍 Will redirect to:', returnTo)

        // Wait a moment for auth context to process
        if (isLoading) {
          console.log('⏳ Waiting for auth context to load...')
          return // Will retry in next effect run
        }

        // Check for auth error
        if (authError) {
          console.error('❌ Auth error:', authError)
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

        setState({
          status: 'success',
          message: `Welcome back, ${session.user?.email}!`,
          returnTo,
        })

        // Check if this is an extension auth request
        const isExtensionAuth = returnTo.includes('/extension-auth')
        console.log('🔌 Extension auth request:', isExtensionAuth)

        // Small delay for user to see success message
        setTimeout(() => {
          console.log('🚀 Redirecting to:', returnTo)
          navigate(returnTo, { replace: true })
        }, 1000)
      } catch (err) {
        console.error('❌ Callback handler error:', err)
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
