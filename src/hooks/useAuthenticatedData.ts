/**
 * useAuthenticatedData Hook
 * Automatically loads all user data when authenticated
 * Works for both web app and Chrome Extension
 */

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase'

export interface AuthenticatedData {
  profile: any | null
  resumes: any[] | null
  settings: any | null
  answers: any[] | null
  applications: any[] | null
}

export interface useAuthenticatedDataState extends AuthenticatedData {
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAuthenticatedData(): useAuthenticatedDataState {
  const { isAuthenticated, user } = useAuth()
  const [data, setData] = useState<AuthenticatedData>({
    profile: null,
    resumes: null,
    settings: null,
    answers: null,
    applications: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all user data in parallel
   */
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch all data in parallel using Edge Functions
      // Add timeout to prevent infinite waiting
      const fetchWithTimeout = (promise: Promise<any>, ms: number) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), ms)
          ),
        ])
      }

      const [profileRes, resumesRes, settingsRes, answersRes, applicationsRes] = await Promise.allSettled([
        fetchWithTimeout(supabase.functions.invoke('profile-get'), 10000),
        fetchWithTimeout(supabase.functions.invoke('resumes-get'), 10000),
        fetchWithTimeout(supabase.functions.invoke('settings-get'), 10000),
        fetchWithTimeout(supabase.functions.invoke('answers-get'), 10000),
        fetchWithTimeout(supabase.functions.invoke('applications-get'), 10000),
      ])

      // Process results - handle both fulfilled and rejected promises
      const results = [profileRes, resumesRes, settingsRes, answersRes, applicationsRes].map(
        (result) =>
          result.status === 'fulfilled'
            ? result.value
            : { error: result.reason?.message || 'Request failed' }
      )

      // Log errors but continue
      results.forEach((res, idx) => {
        if (res?.error) {
          const keys = ['profile', 'resumes', 'settings', 'answers', 'applications']
          console.warn(`Failed to fetch ${keys[idx]}:`, res.error)
        }
      })

      // Update state with fetched data - use empty defaults if fetch fails
      setData({
        profile: results[0]?.data?.data || null,
        resumes: results[1]?.data?.data || [],
        settings: results[2]?.data?.data || null,
        answers: results[3]?.data?.data || [],
        applications: results[4]?.data?.data || [],
      })
    } catch (err) {
      console.error('Error fetching authenticated data:', err)
      // Don't set error state - just use empty defaults
      // This prevents UI from showing errors for partial failures
      setData({
        profile: null,
        resumes: [],
        settings: null,
        answers: [],
        applications: [],
      })
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  /**
   * Fetch data when authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData()
    } else {
      setData({
        profile: null,
        resumes: null,
        settings: null,
        answers: null,
        applications: null,
      })
      setIsLoading(false)
    }
  }, [isAuthenticated, fetchAllData])

  /**
   * Set up real-time subscriptions for data updates
   * Using modern Supabase v2 syntax
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return

    try {
      // Subscribe to profile changes
      const profileSubscription = supabase
        .channel(`profiles:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new) {
              setData((prev) => ({ ...prev, profile: payload.new }))
            }
          }
        )
        .subscribe()

      // Subscribe to resumes changes
      const resumesSubscription = supabase
        .channel(`resumes:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'resumes',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setData((prev) => ({
                ...prev,
                resumes: (prev.resumes || []).filter((r) => r.id !== payload.old?.id),
              }))
            } else if (payload.new) {
              setData((prev) => ({
                ...prev,
                resumes: [
                  ...(prev.resumes || []).filter((r) => r.id !== payload.new.id),
                  payload.new,
                ],
              }))
            }
          }
        )
        .subscribe()

      // Subscribe to applications changes
      const applicationsSubscription = supabase
        .channel(`jobs:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jobs',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setData((prev) => ({
                ...prev,
                applications: (prev.applications || []).filter((a) => a.id !== payload.old?.id),
              }))
            } else if (payload.new) {
              setData((prev) => ({
                ...prev,
                applications: [
                  ...(prev.applications || []).filter((a) => a.id !== payload.new.id),
                  payload.new,
                ],
              }))
            }
          }
        )
        .subscribe()

      // Subscribe to answers changes
      const answersSubscription = supabase
        .channel(`ai_answers:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_answers',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setData((prev) => ({
                ...prev,
                answers: (prev.answers || []).filter((a) => a.id !== payload.old?.id),
              }))
            } else if (payload.new) {
              setData((prev) => ({
                ...prev,
                answers: [
                  ...(prev.answers || []).filter((a) => a.id !== payload.new.id),
                  payload.new,
                ],
              }))
            }
          }
        )
        .subscribe()

      // Cleanup subscriptions
      return () => {
        profileSubscription?.unsubscribe()
        resumesSubscription?.unsubscribe()
        applicationsSubscription?.unsubscribe()
        answersSubscription?.unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up subscriptions:', error)
      // Don't throw - let app continue without real-time updates
    }
  }, [isAuthenticated, user])

  return {
    ...data,
    isLoading,
    error,
    refetch: fetchAllData,
  }
}
