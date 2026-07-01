/**
 * Profile API Endpoints
 * Handles profile data operations
 */

import { apiClient } from '../client'

export interface ProfileResponse {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  phone: string | null
  location: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface UpdateProfilePayload {
  full_name?: string
  avatar_url?: string
  email?: string
  phone?: string
  location?: string
  bio?: string
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<ProfileResponse> {
  return apiClient.get<ProfileResponse>('/profiles/me')
}

/**
 * Get profile by user ID
 */
export async function getProfileByUserId(userId: string): Promise<ProfileResponse> {
  return apiClient.get<ProfileResponse>(`/profiles/${userId}`)
}

/**
 * Update current user profile
 */
export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<ProfileResponse> {
  return apiClient.patch<ProfileResponse>('/profiles/me', payload)
}

/**
 * Delete profile
 */
export async function deleteProfile(): Promise<void> {
  await apiClient.delete<void>('/profiles/me')
}
