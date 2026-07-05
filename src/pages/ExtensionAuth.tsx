/**
 * Extension Authentication Page
 * Handles OAuth flow for Chrome Extension users
 * Creates extension session tokens after successful OAuth
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authManager } from '@/lib/auth/AuthManager'
import { getExtensionSession } from '@/api/v1/endpoints/extension'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ExtensionAuth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<'loading' | 'login' | 'creating_session' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    checkAuthAndCreateSession()
  }, [])

  const checkAuthAndCreateSession = async () => {
    try {
      // Check if user is already authenticated
      const authState = authManager.getAuthState()
      
      if (authState.isAuthenticated && authState.user) {
        console.log('✅ User already authenticated, creating extension session...')
        setState('creating_session')
        await createExtensionSession()
      } else {
        console.log('❌ User not authenticated, showing login options')
        setState('login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setError('Failed to check authentication status')
      setState('error')
    }
  }

  const createExtensionSession = async () => {
    try {
      console.log('📱 Creating extension session...')
      
      const response = await getExtensionSession()
      
      if (response.success && response.extension_token) {
        console.log('✅ Extension session created successfully')
        
        // Notify extension via message (if available)
        await notifyExtension({
          token: authManager.getCurrentSession()?.access_token,
          user: authManager.getCurrentUser()
        })
        
        setState('success')
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          window.close()
        }, 3000)
        
      } else {
        throw new Error(response.error || 'Failed to create extension session')
      }
      
    } catch (error) {
      console.error('Extension session creation failed:', error)
      
      // Check if error is CORS related (Edge Functions not deployed)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create extension session'
      if (errorMessage.includes('CORS') || errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
        setError('Edge Functions not deployed. Please deploy Edge Functions to Supabase first. See deployment guide for instructions.')
      } else {
        setError(errorMessage)
      }
      setState('error')
    }
  }

  const notifyExtension = async (authData: any) => {
    try {
      // Try to send message to extension
      if (window.chrome?.runtime?.sendMessage) {
        window.chrome.runtime.sendMessage({
          type: 'OAUTH_COMPLETE',
          payload: authData
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.debug('Extension not available:', chrome.runtime.lastError)
          } else {
            console.log('✅ Extension notified of OAuth success')
          }
        })
      }
      
      // Also try postMessage for cross-window communication
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_COMPLETE',
          payload: authData
        }, '*')
      }
      
    } catch (error) {
      console.debug('Could not notify extension:', error)
      // Non-critical error, don't throw
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setState('loading')
      await authManager.signInWithGoogle()
      // OAuth redirect will handle the rest
    } catch (error) {
      console.error('Google login failed:', error)
      setError('Google login failed. Please try again.')
      setState('error')
    }
  }

  const handleGitHubLogin = async () => {
    try {
      setState('loading')
      await authManager.signInWithGitHub()
      // OAuth redirect will handle the rest
    } catch (error) {
      console.error('GitHub login failed:', error)
      setError('GitHub login failed. Please try again.')
      setState('error')
    }
  }

  const handleMicrosoftLogin = async () => {
    try {
      setState('loading')
      await authManager.signInWithMicrosoft()
      // OAuth redirect will handle the rest
    } catch (error) {
      console.error('Microsoft login failed:', error)
      setError('Microsoft login failed. Please try again.')
      setState('error')
    }
  }

  const handleRetry = () => {
    setError(null)
    checkAuthAndCreateSession()
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
              Checking authentication...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === 'creating_session') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Job Orbit</CardTitle>
            <p className="text-muted-foreground">Setting up extension access...</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
              Creating secure extension session...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              ✅ Success!
            </CardTitle>
            <p className="text-muted-foreground">Extension connected successfully</p>
          </CardHeader>
          <CardContent className="text-center p-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-muted-foreground mb-4">
                Your Job Orbit extension is now connected and ready to use.
              </p>
              <p className="text-sm text-muted-foreground">
                This window will close automatically...
              </p>
            </div>
            <Button 
              onClick={() => window.close()}
              variant="outline"
              size="sm"
            >
              Close Window
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 via-pink-500 to-purple-600">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              ❌ Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 mb-4 font-medium">
                {error}
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleRetry}
                  variant="default"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.close()}
                  variant="outline"
                  size="sm"
                >
                  Close Window
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Login state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Job Orbit
          </CardTitle>
          <p className="text-muted-foreground">Connect your extension</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Sign in to your account</h3>
            <p className="text-sm text-muted-foreground">
              Choose your preferred sign-in method to connect the Job Orbit extension to your account.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              disabled={state === 'loading'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <Button 
              onClick={handleGitHubLogin}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              disabled={state === 'loading'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </Button>

            <Button 
              onClick={handleMicrosoftLogin}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              disabled={state === 'loading'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
              </svg>
              Continue with Microsoft
            </Button>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="https://joborbit.com/terms" className="underline" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="https://joborbit.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}