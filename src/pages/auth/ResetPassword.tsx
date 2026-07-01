/**
 * Reset Password Page
 * Allows users to reset their password via token from email
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as supabaseAuth from '@/lib/auth/supabase-auth'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Extract token from URL
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      setToken(hash)
    } else {
      setError('Invalid reset link')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!token) {
      setError('Invalid reset link')
      return
    }

    setIsLoading(true)
    try {
      // Extract token from hash
      const tokenMatch = token.match(/access_token=([^&]+)/)
      if (!tokenMatch) {
        setError('Invalid reset link')
        return
      }

      await supabaseAuth.confirmPasswordReset(tokenMatch[1], password)
      setIsSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

        {isSuccess ? (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Password reset successful! Redirecting to login...
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={isLoading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
