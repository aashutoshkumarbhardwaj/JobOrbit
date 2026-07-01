/**
 * Chrome Extension Authentication Helper
 * Enables seamless authentication sync between web app and extension
 * Uses Supabase session as source of truth
 */

import { supabase, Session, User } from '@/lib/supabase'

/**
 * Message types for cross-extension communication
 */
export interface ExtensionMessage {
  type: string
  payload?: unknown
}

/**
 * Get current session for extension
 * Extension uses this to validate and refresh its session
 */
export async function getExtensionSession(): Promise<{
  session: Session | null
  user: User | null
}> {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Failed to get extension session:', error)
      return { session: null, user: null }
    }

    return {
      session: data.session,
      user: data.session?.user || null,
    }
  } catch (error) {
    console.error('Extension session error:', error)
    return { session: null, user: null }
  }
}

/**
 * Share session with Chrome Extension via message
 * Called when user signs in on web app
 */
export async function shareSessionWithExtension() {
  try {
    const { session, user } = await getExtensionSession()
    
    if (!session) {
      console.warn('No session to share with extension')
      return
    }

    // Send message to extension if available
    if (window.chrome?.runtime?.id) {
      window.chrome.runtime.sendMessage(
        {
          type: 'SESSION_UPDATE',
          payload: {
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_in: session.expires_in,
              expires_at: session.expires_at,
            },
            user: {
              id: user?.id,
              email: user?.email,
            },
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.debug('Extension not ready:', chrome.runtime.lastError)
          } else if (response?.success) {
            console.log('Session shared with extension')
          }
        }
      )
    }
  } catch (error) {
    console.error('Failed to share session with extension:', error)
  }
}

/**
 * Invalidate extension session on logout
 * Ensures extension logs out when web app logs out
 */
export async function invalidateExtensionSession() {
  try {
    if (window.chrome?.runtime?.id) {
      window.chrome.runtime.sendMessage(
        {
          type: 'SESSION_INVALIDATE',
          payload: {},
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.debug('Extension not ready:', chrome.runtime.lastError)
          } else if (response?.success) {
            console.log('Session invalidated in extension')
          }
        }
      )
    }
  } catch (error) {
    console.error('Failed to invalidate extension session:', error)
  }
}

/**
 * Get authorization header for extension API calls
 * Extension uses this to make authenticated requests
 */
export async function getAuthorizationHeader(): Promise<{
  'Authorization': string
} | null> {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error || !data.session) {
      return null
    }

    return {
      'Authorization': `Bearer ${data.session.access_token}`,
    }
  } catch (error) {
    console.error('Failed to get authorization header:', error)
    return null
  }
}

/**
 * Validate extension access
 * Extension calls this to verify session is still valid
 */
export async function validateExtensionAccess(): Promise<boolean> {
  try {
    const { session } = await getExtensionSession()
    return !!session
  } catch {
    return false
  }
}

/**
 * Listen for extension messages
 * Responds to extension authentication requests
 */
export function setupExtensionMessaging() {
  if (!window.chrome?.runtime?.onMessage) {
    return
  }

  window.chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      try {
        switch (message.type) {
          case 'GET_SESSION':
            getExtensionSession().then(sendResponse)
            break

          case 'VALIDATE_ACCESS':
            validateExtensionAccess().then(sendResponse)
            break

          case 'GET_AUTH_HEADER':
            getAuthorizationHeader().then(sendResponse)
            break

          default:
            sendResponse({ error: 'Unknown message type' })
        }
      } catch (error) {
        sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' })
      }

      // Indicate we'll respond asynchronously
      return true
    }
  )
}
