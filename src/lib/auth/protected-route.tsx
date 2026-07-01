/**
 * Protected Route Component
 * Ensures route is only accessible to authenticated users
 * Redirects to login if not authenticated
 */

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
