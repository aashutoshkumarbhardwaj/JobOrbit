/**
 * Authenticated Data Context
 * Provides access to all user data across the app
 * Works for both web app and Chrome Extension
 */

import React, { createContext, useContext } from 'react'
import { useAuthenticatedData, AuthenticatedData } from '@/hooks/useAuthenticatedData'

interface AuthenticatedDataContextType extends AuthenticatedData {
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const AuthenticatedDataContext = createContext<AuthenticatedDataContextType | undefined>(undefined)

export function AuthenticatedDataProvider({ children }: { children: React.ReactNode }) {
  const data = useAuthenticatedData()

  return (
    <AuthenticatedDataContext.Provider value={data}>
      {children}
    </AuthenticatedDataContext.Provider>
  )
}

/**
 * Hook to use authenticated data context
 */
export function useAuthenticatedDataContext() {
  const context = useContext(AuthenticatedDataContext)
  if (context === undefined) {
    throw new Error('useAuthenticatedDataContext must be used within AuthenticatedDataProvider')
  }
  return context
}

/**
 * Hook to get user profile
 */
export function useUserProfile() {
  const { profile } = useAuthenticatedDataContext()
  return profile
}

/**
 * Hook to get user resumes
 */
export function useUserResumes() {
  const { resumes } = useAuthenticatedDataContext()
  return resumes
}

/**
 * Hook to get user settings
 */
export function useUserSettings() {
  const { settings } = useAuthenticatedDataContext()
  return settings
}

/**
 * Hook to get AI answers
 */
export function useAIAnswers() {
  const { answers } = useAuthenticatedDataContext()
  return answers
}

/**
 * Hook to get job applications
 */
export function useApplications() {
  const { applications } = useAuthenticatedDataContext()
  return applications
}
