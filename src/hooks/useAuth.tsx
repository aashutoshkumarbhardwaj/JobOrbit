import { useEffect, useState, useCallback } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { OAuthProvider } from "@/types"
import {
  generateGoogleOAuthUrl,
  generateGitHubOAuthUrl,
  generateMicrosoftOAuthUrl,
  storeAccessToken,
  storeRefreshToken,
  storeTokenExpiry,
  storeOAuthProvider,
  clearAllAuthData,
  getSessionInfo,
  validateAndRefreshSession,
} from "@/lib/auth"
import { apiClient } from "@/api/v1"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    // Auth state change handler with logging
    const handleAuthStateChange = (_event: string, session: Session | null) => {
      if (!isMounted) return

      console.log("Auth state changed:", {
        event: _event,
        hasSession: !!session,
        userId: session?.user?.id,
      })

      setSession(session)
      setUser(session?.user ?? null)
      setError(null)
      setLoading(false)

      // Store session tokens if available
      if (session?.access_token) {
        storeAccessToken(session.access_token)
        if (session.refresh_token) {
          storeRefreshToken(session.refresh_token)
        }
        if (session.expires_in) {
          storeTokenExpiry(session.expires_in)
        }
      }
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!isMounted) return

        if (error) {
          console.error("Error getting session:", error)
          setError(error as Error)
        } else {
          console.log("Initial session check:", {
            hasSession: !!session,
            userId: session?.user?.id,
          })
          setSession(session)
          setUser(session?.user ?? null)

          // Store session tokens
          if (session?.access_token) {
            storeAccessToken(session.access_token)
            if (session.refresh_token) {
              storeRefreshToken(session.refresh_token)
            }
            if (session.expires_in) {
              storeTokenExpiry(session.expires_in)
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        setError(error as Error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Set up token refresh handler in API client
    apiClient.setTokenRefreshHandler(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error || !data.session?.access_token) {
          throw error || new Error("Failed to refresh session")
        }
        storeAccessToken(data.session.access_token)
        if (data.session.refresh_token) {
          storeRefreshToken(data.session.refresh_token)
        }
        if (data.session.expires_in) {
          storeTokenExpiry(data.session.expires_in)
        }
        return data.session.access_token
      } catch (err) {
        console.error("Token refresh failed:", err)
        clearAllAuthData()
        return null
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setError(null)
      console.log("Attempting sign up:", { email })
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : "",
          data: {
            full_name: fullName,
          },
        },
      })

      console.log("Sign up result:", { hasError: !!error, hasData: !!data })
      if (error) setError(error as Error)
      return { data, error }
    } catch (err) {
      console.error("Sign up error:", err)
      const error = err as Error
      setError(error)
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      console.log("Attempting sign in:", { email })
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Sign in result:", {
        hasError: !!error,
        hasData: !!data,
        userId: data.user?.id,
      })
      if (error) setError(error as Error)
      return { data, error }
    } catch (err) {
      console.error("Sign in error:", err)
      const error = err as Error
      setError(error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      console.log("Attempting sign out")
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Sign out error:", error)
        setError(error as Error)
      } else {
        console.log("Sign out successful")
        clearAllAuthData()
      }

      return { error }
    } catch (err) {
      console.error("Sign out error:", err)
      const error = err as Error
      setError(error)
      return { error }
    }
  }

  /**
   * OAuth sign in with provider
   */
  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      try {
        setError(null)
        console.log("Attempting OAuth sign in:", { provider })
        
        // Store provider choice for later retrieval
        storeOAuthProvider(provider)

        // Redirect to OAuth provider
        const oauthUrl = getOAuthUrlForProvider(provider)
        window.location.href = oauthUrl
      } catch (err) {
        console.error("OAuth sign in error:", err)
        const error = err as Error
        setError(error)
        return { error }
      }
    },
    []
  )

  /**
   * Exchange OAuth code for session
   */
  const exchangeOAuthCode = useCallback(
    async (
      code: string,
      provider: OAuthProvider
    ): Promise<{ success: boolean; error?: Error }> => {
      try {
        setError(null)
        console.log("Exchanging OAuth code:", { provider })

        const { data, error } = await apiClient.post<{
          access_token: string
          refresh_token?: string
          expires_in: number
        }>("/auth/oauth/exchange", {
          code,
          provider,
          redirectUri: window.location.origin,
        })

        if (error) {
          setError(error as Error)
          return { success: false, error: error as Error }
        }

        // Store tokens
        storeAccessToken(data.access_token)
        if (data.refresh_token) {
          storeRefreshToken(data.refresh_token)
        }
        storeTokenExpiry(data.expires_in)

        // Refresh session
        const { data: session, error: sessionError } =
          await supabase.auth.getSession()
        if (sessionError) throw sessionError
        setSession(session)
        setUser(session?.user ?? null)

        return { success: true }
      } catch (err) {
        console.error("OAuth code exchange error:", err)
        const error = err as Error
        setError(error)
        return { success: false, error }
      }
    },
    []
  )

  /**
   * Get OAuth URL for provider
   */
  const getOAuthUrlForProvider = (provider: OAuthProvider): string => {
    switch (provider) {
      case "google":
        return generateGoogleOAuthUrl()
      case "github":
        return generateGitHubOAuthUrl()
      case "microsoft":
        return generateMicrosoftOAuthUrl()
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  /**
   * Get available OAuth providers
   */
  const getAvailableOAuthProviders = (): OAuthProvider[] => {
    const providers: OAuthProvider[] = []
    if (import.meta.env.VITE_GOOGLE_CLIENT_ID) providers.push("google")
    if (import.meta.env.VITE_GITHUB_CLIENT_ID) providers.push("github")
    if (import.meta.env.VITE_MICROSOFT_CLIENT_ID) providers.push("microsoft")
    return providers
  }

  /**
   * Check session validity
   */
  const checkSessionValidity = useCallback((): boolean => {
    return validateAndRefreshSession()
  }, [])

  /**
   * Get current session info
   */
  const getSessionData = useCallback(() => {
    return getSessionInfo()
  }, [])

  return {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
    exchangeOAuthCode,
    getAvailableOAuthProviders,
    checkSessionValidity,
    getSessionData,
  }
}
