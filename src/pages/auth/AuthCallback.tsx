/**
 * Auth Callback Page
 * Handles OAuth redirect from Supabase after user authenticates with provider
 * Automatically redirects to dashboard after successful auth
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import * as supabaseAuth from '@/lib/auth/supabase-auth'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if session was established
        const session = await supabaseAuth.getSession()
        
        if (session) {
          // OAuth successful, redirect to dashboard
          navigate('/dashboard', { replace: true })
        } else {
          // No session established, redirect to login
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
