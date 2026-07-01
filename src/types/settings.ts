/**
 * Settings Types
 * Types for user settings and preferences
 */

import { UserEntity, ThemeType, OAuthProvider } from './common'

/**
 * User settings entity
 */
export interface Settings extends UserEntity {
  theme: ThemeType
  notifications_enabled: boolean
  auto_sync_enabled: boolean
  extension_enabled: boolean
  oauth_providers: OAuthProviderConfig | null
}

/**
 * Settings update payload
 */
export interface SettingsUpdate {
  theme?: ThemeType
  notifications_enabled?: boolean
  auto_sync_enabled?: boolean
  extension_enabled?: boolean
  oauth_providers?: OAuthProviderConfig
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  google?: OAuthProviderAuth
  github?: OAuthProviderAuth
  microsoft?: OAuthProviderAuth
}

/**
 * OAuth provider authentication details
 */
export interface OAuthProviderAuth {
  connected: boolean
  email?: string
  name?: string
  avatar?: string
  connected_at?: string
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  theme: 'system',
  notifications_enabled: true,
  auto_sync_enabled: true,
  extension_enabled: true,
  oauth_providers: null,
}

/**
 * Check if OAuth provider is connected
 */
export function isOAuthConnected(
  settings: Settings,
  provider: OAuthProvider
): boolean {
  return settings.oauth_providers?.[provider]?.connected ?? false
}

/**
 * Get connected OAuth providers
 */
export function getConnectedProviders(settings: Settings): OAuthProvider[] {
  const providers: OAuthProvider[] = []
  if (settings.oauth_providers) {
    (['google', 'github', 'microsoft'] as OAuthProvider[]).forEach((provider) => {
      if (isOAuthConnected(settings, provider)) {
        providers.push(provider)
      }
    })
  }
  return providers
}

/**
 * Add OAuth provider connection
 */
export function addOAuthConnection(
  settings: Settings,
  provider: OAuthProvider,
  auth: OAuthProviderAuth
): Settings {
  return {
    ...settings,
    oauth_providers: {
      ...settings.oauth_providers,
      [provider]: auth,
    },
  }
}

/**
 * Remove OAuth provider connection
 */
export function removeOAuthConnection(
  settings: Settings,
  provider: OAuthProvider
): Settings {
  const newProviders = { ...settings.oauth_providers }
  delete newProviders[provider]
  return {
    ...settings,
    oauth_providers: Object.keys(newProviders).length > 0 ? newProviders : null,
  }
}
