/**
 * Authentication Utilities
 * Handles OAuth, token management, and session persistence
 */

import { OAuthProvider } from '@/types'

/**
 * OAuth Configuration
 */
interface OAuthConfig {
  clientId: string
  redirectUri: string
  scope?: string
}

interface OAuthConfigs {
  google?: OAuthConfig
  github?: OAuthConfig
  microsoft?: OAuthConfig
}

/**
 * Get OAuth configurations from environment
 */
function getOAuthConfigs(): OAuthConfigs {
  const configs: OAuthConfigs = {}

  // Google OAuth
  if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    configs.google = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback/google`,
      scope: 'openid profile email',
    }
  }

  // GitHub OAuth
  if (import.meta.env.VITE_GITHUB_CLIENT_ID) {
    configs.github = {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback/github`,
      scope: 'user:email',
    }
  }

  // Microsoft OAuth
  if (import.meta.env.VITE_MICROSOFT_CLIENT_ID) {
    configs.microsoft = {
      clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback/microsoft`,
      scope: 'openid profile email',
    }
  }

  return configs
}

/**
 * Generate OAuth authorization URL
 */
export function generateGoogleOAuthUrl(): string {
  const configs = getOAuthConfigs()
  if (!configs.google) {
    throw new Error('Google OAuth not configured')
  }

  const params = new URLSearchParams({
    client_id: configs.google.clientId,
    redirect_uri: configs.google.redirectUri,
    response_type: 'code',
    scope: configs.google.scope || 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function generateGitHubOAuthUrl(): string {
  const configs = getOAuthConfigs()
  if (!configs.github) {
    throw new Error('GitHub OAuth not configured')
  }

  const params = new URLSearchParams({
    client_id: configs.github.clientId,
    redirect_uri: configs.github.redirectUri,
    scope: configs.github.scope || 'user:email',
    allow_signup: 'true',
  })

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

export function generateMicrosoftOAuthUrl(): string {
  const configs = getOAuthConfigs()
  if (!configs.microsoft) {
    throw new Error('Microsoft OAuth not configured')
  }

  const params = new URLSearchParams({
    client_id: configs.microsoft.clientId,
    redirect_uri: configs.microsoft.redirectUri,
    response_type: 'code',
    scope: configs.microsoft.scope || 'openid profile email',
  })

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

/**
 * Get OAuth URL for provider
 */
export function getOAuthUrl(provider: OAuthProvider): string {
  switch (provider) {
    case 'google':
      return generateGoogleOAuthUrl()
    case 'github':
      return generateGitHubOAuthUrl()
    case 'microsoft':
      return generateMicrosoftOAuthUrl()
    default:
      throw new Error(`Unknown OAuth provider: ${provider}`)
  }
}

/**
 * Extract authorization code from URL
 */
export function getAuthCodeFromUrl(url: string = window.location.href): string | null {
  const urlParams = new URLSearchParams(new URL(url).search)
  return urlParams.get('code')
}

/**
 * Extract OAuth provider from URL path
 */
export function getProviderFromUrl(url: string = window.location.pathname): OAuthProvider | null {
  if (url.includes('google')) return 'google'
  if (url.includes('github')) return 'github'
  if (url.includes('microsoft')) return 'microsoft'
  return null
}

/**
 * Token Management
 */

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const OAUTH_PROVIDER_KEY = 'oauth_provider'
const TOKEN_EXPIRY_KEY = 'token_expiry'

/**
 * Store access token
 */
export function storeAccessToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to store access token:', error)
  }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to get access token:', error)
    return null
  }
}

/**
 * Clear access token
 */
export function clearAccessToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to clear access token:', error)
  }
}

/**
 * Store refresh token
 */
export function storeRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to store refresh token:', error)
  }
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to get refresh token:', error)
    return null
  }
}

/**
 * Clear refresh token
 */
export function clearRefreshToken(): void {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to clear refresh token:', error)
  }
}

/**
 * Store token expiry time
 */
export function storeTokenExpiry(expiresIn: number): void {
  try {
    const expiryTime = Date.now() + expiresIn * 1000
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryTime))
  } catch (error) {
    console.error('Failed to store token expiry:', error)
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return true
    return Date.now() > parseInt(expiry, 10)
  } catch (error) {
    console.error('Failed to check token expiry:', error)
    return true
  }
}

/**
 * Get time until token expiry in seconds
 */
export function getTimeUntilTokenExpiry(): number {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return 0
    const remaining = parseInt(expiry, 10) - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  } catch (error) {
    console.error('Failed to get token expiry time:', error)
    return 0
  }
}

/**
 * Store OAuth provider choice
 */
export function storeOAuthProvider(provider: OAuthProvider): void {
  try {
    localStorage.setItem(OAUTH_PROVIDER_KEY, provider)
  } catch (error) {
    console.error('Failed to store OAuth provider:', error)
  }
}

/**
 * Get last used OAuth provider
 */
export function getOAuthProvider(): OAuthProvider | null {
  try {
    return localStorage.getItem(OAUTH_PROVIDER_KEY) as OAuthProvider | null
  } catch (error) {
    console.error('Failed to get OAuth provider:', error)
    return null
  }
}

/**
 * Session Management
 */

/**
 * Clear all auth data
 */
export function clearAllAuthData(): void {
  clearAccessToken()
  clearRefreshToken()
  try {
    localStorage.removeItem(OAUTH_PROVIDER_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  } catch (error) {
    console.error('Failed to clear auth data:', error)
  }
}

/**
 * Get session info
 */
export function getSessionInfo(): {
  hasValidSession: boolean
  isExpired: boolean
  timeUntilExpiry: number
  provider: OAuthProvider | null
} {
  const token = getAccessToken()
  const expired = isTokenExpired()

  return {
    hasValidSession: !!token && !expired,
    isExpired: expired,
    timeUntilExpiry: getTimeUntilTokenExpiry(),
    provider: getOAuthProvider(),
  }
}

/**
 * Validate session and trigger refresh if needed
 */
export function validateAndRefreshSession(): boolean {
  if (isTokenExpired()) {
    console.warn('Token expired, logout required')
    clearAllAuthData()
    return false
  }

  // Warn if token expiring soon (within 5 minutes)
  const timeUntilExpiry = getTimeUntilTokenExpiry()
  if (timeUntilExpiry < 300) {
    console.warn(`Token expiring soon in ${timeUntilExpiry} seconds`)
  }

  return true
}
