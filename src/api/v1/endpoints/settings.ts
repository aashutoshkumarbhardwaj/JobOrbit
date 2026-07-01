/**
 * Settings API Endpoints
 * Handles user settings and preferences
 */

import { apiClient } from '../client'

export interface SettingsResponse {
  id: string
  user_id: string
  theme: string
  notifications_enabled: boolean
  auto_sync_enabled: boolean
  extension_enabled: boolean
  oauth_providers: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface UpdateSettingsPayload {
  theme?: string
  notifications_enabled?: boolean
  auto_sync_enabled?: boolean
  extension_enabled?: boolean
  oauth_providers?: Record<string, unknown>
}

/**
 * Get current user settings
 */
export async function getSettings(): Promise<SettingsResponse> {
  return apiClient.get<SettingsResponse>('/settings/me')
}

/**
 * Update settings
 */
export async function updateSettings(
  payload: UpdateSettingsPayload
): Promise<SettingsResponse> {
  return apiClient.patch<SettingsResponse>('/settings/me', payload)
}

/**
 * Update theme setting
 */
export async function updateTheme(theme: string): Promise<SettingsResponse> {
  return apiClient.patch<SettingsResponse>('/settings/me', { theme })
}

/**
 * Toggle notifications
 */
export async function toggleNotifications(
  enabled: boolean
): Promise<SettingsResponse> {
  return apiClient.patch<SettingsResponse>('/settings/me', {
    notifications_enabled: enabled,
  })
}

/**
 * Toggle auto sync
 */
export async function toggleAutoSync(enabled: boolean): Promise<SettingsResponse> {
  return apiClient.patch<SettingsResponse>('/settings/me', {
    auto_sync_enabled: enabled,
  })
}

/**
 * Toggle extension
 */
export async function toggleExtension(enabled: boolean): Promise<SettingsResponse> {
  return apiClient.patch<SettingsResponse>('/settings/me', {
    extension_enabled: enabled,
  })
}

/**
 * Update OAuth providers
 */
export async function updateOAuthProviders(
  providers: Record<string, unknown>
): Promise<SettingsResponse> {
  return apiClient.patch<SettingsResponse>('/settings/me', {
    oauth_providers: providers,
  })
}
