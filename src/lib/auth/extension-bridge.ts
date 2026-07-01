/**
 * Chrome Extension Bridge
 * Handles bidirectional communication between web app and extension
 * Enables single sign-on and data synchronization
 */

import { supabase } from '@/lib/supabase'

/**
 * Initialize extension bridge
 * Call this on app initialization to listen for extension messages
 */
export function initializeExtensionBridge() {
  // Listen for messages from extension
  if (window.chrome?.runtime?.onMessage) {
    window.chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      // Handle async, but don't block
      handleExtensionMessage(message, sendResponse)
      return true // Indicate we'll respond asynchronously
    })
  }

  // Notify extension asynchronously - don't block
  setTimeout(() => notifyExtensionAppReady(), 100)
}

/**
 * Handle messages from Chrome Extension
 */
async function handleExtensionMessage(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    switch (message.type) {
      case 'GET_SESSION':
        await handleGetSession(sendResponse)
        break

      case 'GET_PROFILE':
        await handleGetProfile(sendResponse)
        break

      case 'GET_RESUMES':
        await handleGetResumes(sendResponse)
        break

      case 'GET_SETTINGS':
        await handleGetSettings(sendResponse)
        break

      case 'GET_ANSWERS':
        await handleGetAnswers(sendResponse)
        break

      case 'GET_APPLICATIONS':
        await handleGetApplications(sendResponse)
        break

      case 'LOGIN_SUCCESS':
        // Extension notifies web app of successful login
        await handleExtensionLoginSuccess(message, sendResponse)
        break

      case 'LOGOUT':
        // Extension requests logout
        await handleExtensionLogout(sendResponse)
        break

      default:
        sendResponse({ error: 'Unknown message type' })
    }
  } catch (error) {
    console.error('Error handling extension message:', error)
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

/**
 * Send session to extension
 */
async function handleGetSession(sendResponse: (response: any) => void) {
  const { data } = await supabase.auth.getSession()

  if (data.session) {
    sendResponse({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
    })
  } else {
    sendResponse({ success: false, error: 'No active session' })
  }
}

/**
 * Send profile to extension
 */
async function handleGetProfile(sendResponse: (response: any) => void) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single()

  if (error) {
    sendResponse({ success: false, error: error.message })
  } else {
    sendResponse({ success: true, data })
  }
}

/**
 * Send resumes to extension
 */
async function handleGetResumes(sendResponse: (response: any) => void) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    sendResponse({ success: false, error: error.message })
  } else {
    sendResponse({ success: true, data: data || [] })
  }
}

/**
 * Send settings to extension
 */
async function handleGetSettings(sendResponse: (response: any) => void) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    sendResponse({ success: false, error: error.message })
  } else {
    sendResponse({ success: true, data })
  }
}

/**
 * Send AI answers to extension
 */
async function handleGetAnswers(sendResponse: (response: any) => void) {
  const { data, error } = await supabase
    .from('ai_answers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    sendResponse({ success: false, error: error.message })
  } else {
    sendResponse({ success: true, data: data || [] })
  }
}

/**
 * Send job applications to extension
 */
async function handleGetApplications(sendResponse: (response: any) => void) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('applied_date', { ascending: false })

  if (error) {
    sendResponse({ success: false, error: error.message })
  } else {
    sendResponse({ success: true, data: data || [] })
  }
}

/**
 * Handle successful login from extension
 */
async function handleExtensionLoginSuccess(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    // Extension has authenticated and is sharing the session
    console.log('Extension login successful')

    // Verify session is established
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      sendResponse({ success: false, error: 'Session not established' })
      return
    }

    sendResponse({ success: true, message: 'Web app session synchronized' })

    // Trigger page reload if needed to load user data
    // window.location.reload()
  } catch (error) {
    console.error('Error syncing extension login:', error)
    sendResponse({ success: false, error: 'Failed to sync session' })
  }
}

/**
 * Handle logout request from extension
 */
async function handleExtensionLogout(sendResponse: (response: any) => void) {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      sendResponse({ success: false, error: error.message })
    } else {
      sendResponse({ success: true, message: 'Logged out' })
    }
  } catch (error) {
    console.error('Error logging out:', error)
    sendResponse({ success: false, error: 'Failed to logout' })
  }
}

/**
 * Notify extension that web app is ready
 */
export function notifyExtensionAppReady() {
  if (window.chrome?.runtime?.id) {
    try {
      window.chrome.runtime.sendMessage(
        {
          type: 'WEB_APP_READY',
          payload: {
            url: window.location.href,
            timestamp: new Date().toISOString(),
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.debug('Extension not ready:', chrome.runtime.lastError)
          } else if (response?.success) {
            console.log('Extension acknowledged web app ready')
          }
        }
      )
    } catch (error) {
      console.debug('Could not notify extension:', error)
    }
  }
}

/**
 * Open extension auth page in new window
 * Used by extension to initiate auth flow
 */
export function openExtensionAuthWindow() {
  const width = 500
  const height = 700
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2

  const authWindow = window.open(
    `${window.location.origin}/extension-auth`,
    'job-orbit-auth',
    `width=${width},height=${height},left=${left},top=${top}`
  )

  if (!authWindow) {
    console.error('Failed to open auth window. Pop-ups may be blocked.')
  }

  return authWindow
}

/**
 * Share session with extension
 */
export async function shareSessionWithExtension() {
  try {
    const { data } = await supabase.auth.getSession()

    if (!data.session || !window.chrome?.runtime?.id) {
      return
    }

    window.chrome.runtime.sendMessage(
      {
        type: 'SESSION_UPDATE',
        payload: {
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          },
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
          },
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.debug('Extension not available:', chrome.runtime.lastError)
        } else if (response?.success) {
          console.log('Session shared with extension')
        }
      }
    )
  } catch (error) {
    console.debug('Could not share session with extension:', error)
  }
}

/**
 * Request data from extension
 * Extension will relay response from web app
 */
export async function requestDataFromExtension(dataType: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!window.chrome?.runtime?.id) {
      reject(new Error('Extension not available'))
      return
    }

    try {
      window.chrome.runtime.sendMessage(
        {
          type: `GET_${dataType.toUpperCase()}`,
          payload: {},
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else if (response?.success) {
            resolve(response.data)
          } else {
            reject(new Error(response?.error || 'Failed to get data'))
          }
        }
      )
    } catch (error) {
      reject(error)
    }
  })
}
