/**
 * Use Profile Hook
 * Manages profile state and auto-save functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { profileValidator } from './profile-validator'
import type { FullProfile, ProfileValidationErrors, AutoSaveState } from '@/types/profile'

const AUTO_SAVE_DELAY = 1000 // 1 second debounce

export function useProfile() {
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSavedAt: null,
    error: null,
    hasChanges: false,
  })
  const [validationErrors, setValidationErrors] = useState<ProfileValidationErrors>({})
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const profileRef = useRef<FullProfile | null>(null)

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  /**
   * Fetch profile from database
   */
  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine for new users
        throw error
      }

      const fullProfile: FullProfile = {
        id: data?.id || '',
        userId: user.id,
        firstName: data?.first_name || null,
        lastName: data?.last_name || null,
        email: user.email || null,
        phone: data?.phone || null,
        addressLine1: data?.address_line_1 || null,
        addressLine2: data?.address_line_2 || null,
        city: data?.city || null,
        state: data?.state || null,
        country: data?.country || null,
        zipCode: data?.zip_code || null,
        currentRole: data?.current_role || null,
        yearsOfExperience: data?.years_of_experience || null,
        noticePeriodDays: data?.notice_period_days || null,
        currentSalary: data?.current_salary || null,
        expectedSalary: data?.expected_salary || null,
        linkedinUrl: data?.linkedin_url || null,
        githubUrl: data?.github_url || null,
        portfolioUrl: data?.portfolio_url || null,
        leetcodeUrl: data?.leetcode_url || null,
        hackerrankUrl: data?.hackerrank_url || null,
        websiteUrl: data?.website_url || null,
        preferredLocations: data?.preferred_locations || [],
        workModePreferences: data?.work_mode_preferences || [],
        jobCategories: data?.job_categories || [],
        seniorityLevel: data?.seniority_level || null,
        skills: data?.skills || [],
        bio: data?.bio || null,
        profileCompletionPercentage: data?.profile_completion_percentage || 0,
        createdAt: data?.created_at || new Date().toISOString(),
        updatedAt: data?.updated_at || new Date().toISOString(),
      }

      setProfile(fullProfile)
      profileRef.current = fullProfile
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setAutoSaveState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
      }))
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Calculate profile completion percentage
   */
  const calculateCompletion = (updatedProfile: FullProfile): number => {
    const fields = [
      updatedProfile.firstName,
      updatedProfile.lastName,
      updatedProfile.phone,
      updatedProfile.currentRole,
      updatedProfile.yearsOfExperience,
      updatedProfile.currentSalary,
      updatedProfile.expectedSalary,
      updatedProfile.city,
      updatedProfile.country,
    ]

    const filledFields = fields.filter((field) => field !== null && field !== undefined && field !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  /**
   * Save profile to database
   */
  const saveProfile = useCallback(async (updatedProfile: FullProfile) => {
    try {
      setAutoSaveState((prev) => ({
        ...prev,
        isSaving: true,
        error: null,
      }))

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const completion = calculateCompletion(updatedProfile)

      const profileData = {
        user_id: user.id,
        first_name: updatedProfile.firstName,
        last_name: updatedProfile.lastName,
        phone: updatedProfile.phone,
        address_line_1: updatedProfile.addressLine1,
        address_line_2: updatedProfile.addressLine2,
        city: updatedProfile.city,
        state: updatedProfile.state,
        country: updatedProfile.country,
        zip_code: updatedProfile.zipCode,
        current_role: updatedProfile.currentRole,
        years_of_experience: updatedProfile.yearsOfExperience,
        notice_period_days: updatedProfile.noticePeriodDays,
        current_salary: updatedProfile.currentSalary,
        expected_salary: updatedProfile.expectedSalary,
        linkedin_url: updatedProfile.linkedinUrl,
        github_url: updatedProfile.githubUrl,
        portfolio_url: updatedProfile.portfolioUrl,
        leetcode_url: updatedProfile.leetcodeUrl,
        hackerrank_url: updatedProfile.hackerrankUrl,
        website_url: updatedProfile.websiteUrl,
        preferred_locations: updatedProfile.preferredLocations,
        work_mode_preferences: updatedProfile.workModePreferences,
        job_categories: updatedProfile.jobCategories,
        seniority_level: updatedProfile.seniorityLevel,
        skills: updatedProfile.skills,
        bio: updatedProfile.bio,
        profile_completion_percentage: completion,
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (error) {
        throw error
      }

      setProfile({
        ...updatedProfile,
        profileCompletionPercentage: completion,
      })
      profileRef.current = { ...updatedProfile, profileCompletionPercentage: completion }

      setAutoSaveState((prev) => ({
        ...prev,
        isSaving: false,
        lastSavedAt: new Date(),
        hasChanges: false,
      }))
    } catch (error) {
      console.error('Failed to save profile:', error)
      setAutoSaveState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save profile',
      }))
    }
  }, [])

  /**
   * Update profile field with auto-save
   */
  const updateProfileField = useCallback(
    (field: keyof FullProfile, value: any) => {
      if (!profile) return

      const updatedProfile = {
        ...profile,
        [field]: value,
      }

      // Validate the field
      const fieldError = profileValidator[field as keyof typeof profileValidator]?.(value)
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        if (fieldError) {
          newErrors[field] = fieldError
        } else {
          delete newErrors[field]
        }
        return newErrors
      })

      setProfile(updatedProfile)
      setAutoSaveState((prev) => ({ ...prev, hasChanges: true }))

      // Debounce save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveProfile(updatedProfile)
      }, AUTO_SAVE_DELAY)
    },
    [profile, saveProfile]
  )

  /**
   * Update multiple fields at once
   */
  const updateProfileFields = useCallback(
    (updates: Partial<FullProfile>) => {
      if (!profile) return

      const updatedProfile = {
        ...profile,
        ...updates,
      }

      // Validate all updated fields
      const newErrors = profileValidator.validateAll(updates)
      setValidationErrors((prev) => ({ ...prev, ...newErrors }))

      setProfile(updatedProfile)
      setAutoSaveState((prev) => ({ ...prev, hasChanges: true }))

      // Debounce save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveProfile(updatedProfile)
      }, AUTO_SAVE_DELAY)
    },
    [profile, saveProfile]
  )

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  return {
    profile,
    isLoading,
    autoSaveState,
    validationErrors,
    updateProfileField,
    updateProfileFields,
    refetch: fetchProfile,
  }
}
