/**
 * Extension OAuth Authentication Script
 * Handles OAuth flow in dedicated auth window
 * Communicates success/failure back to background script
 */

// UI Elements
const authForm = document.getElementById('authForm')
const loading = document.getElementById('loading')
const error = document.getElementById('error')
const success = document.getElementById('success')
const errorMessage = document.getElementById('errorMessage')

const googleBtn = document.getElementById('googleBtn')
const githubBtn = document.getElementById('githubBtn')
const microsoftBtn = document.getElementById('microsoftBtn')

// Configuration
const config = {
  // Will be dynamically determined
  webAppUrl: null,
  supabaseUrl: null,
  supabaseAnonKey: null
}

/**
 * Initialize auth page
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 Auth page loaded')
  
  try {
    // Detect environment and load config
    await loadConfig()
    
    // Set up OAuth button listeners
    setupOAuthButtons()
    
    // Check if this is an OAuth callback
    await checkOAuthCallback()
    
  } catch (err) {
    console.error('Auth initialization error:', err)
    showError('Failed to initialize authentication')
  }
})

/**
 * Load configuration based on environment
 */
async function loadConfig() {
  try {
    // Use API client for environment detection if available
    if (typeof extensionApiClient !== 'undefined') {
      await extensionApiClient.init()
      const apiConfig = extensionApiClient.getConfig()
      
      config.webAppUrl = apiConfig.baseUrl
      config.supabaseUrl = apiConfig.supabaseUrl
      console.log('🌐 Using API client configuration:', config.webAppUrl)
      return
    }
    
    // Fallback: manual environment detection
    const testUrls = [
      'http://localhost:5173',
      'https://joborbit.com'
    ]
    
    for (const url of testUrls) {
      try {
        // Test if the URL is accessible
        const response = await fetch(`${url}/api/health`, {
          method: 'HEAD',
          mode: 'no-cors'
        })
        
        config.webAppUrl = url
        console.log('🌐 Detected environment:', url)
        break
      } catch (e) {
        // Continue to next URL
      }
    }
    
    // Default to production
    if (!config.webAppUrl) {
      config.webAppUrl = 'https://joborbit.com'
    }
    
    // Load Supabase config (these would be injected at build time)
    config.supabaseUrl = config.webAppUrl === 'http://localhost:5173' 
      ? 'http://localhost:54321'  // Local Supabase
      : 'https://your-project.supabase.co'  // Production Supabase
      
    config.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Would be injected
    
  } catch (error) {
    console.error('Failed to load config:', error)
    config.webAppUrl = 'https://joborbit.com'
  }
}

/**
 * Set up OAuth button event listeners
 */
function setupOAuthButtons() {
  googleBtn.addEventListener('click', (e) => {
    e.preventDefault()
    startOAuth('google')
  })
  
  githubBtn.addEventListener('click', (e) => {
    e.preventDefault()
    startOAuth('github')
  })
  
  microsoftBtn.addEventListener('click', (e) => {
    e.preventDefault()
    startOAuth('azure')
  })
}

/**
 * Start OAuth flow with specified provider
 */
async function startOAuth(provider) {
  try {
    console.log(`🔐 Starting ${provider} OAuth...`)
    
    showLoading()
    
    // Redirect to Job Orbit OAuth endpoint
    const oauthUrl = `${config.webAppUrl}/auth/oauth/${provider}?redirect=${encodeURIComponent(window.location.href)}`
    
    console.log('🔗 Redirecting to:', oauthUrl)
    window.location.href = oauthUrl
    
  } catch (error) {
    console.error('OAuth start error:', error)
    showError('Failed to start authentication')
  }
}

/**
 * Check if current URL contains OAuth callback parameters
 */
async function checkOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search)
  const fragment = new URLSearchParams(window.location.hash.substring(1))
  
  // Check for OAuth success parameters
  const accessToken = fragment.get('access_token') || urlParams.get('access_token')
  const refreshToken = fragment.get('refresh_token') || urlParams.get('refresh_token')
  const error = urlParams.get('error') || fragment.get('error')
  const errorDescription = urlParams.get('error_description') || fragment.get('error_description')
  
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    showError(`Authentication failed: ${errorDescription || error}`)
    return
  }
  
  if (accessToken) {
    console.log('✅ OAuth callback detected with access token')
    
    showLoading()
    
    try {
      // Verify the token and get user info
      const tokenData = await verifySupabaseToken(accessToken, refreshToken)
      
      if (tokenData.success) {
        console.log('✅ Token verified, user:', tokenData.user.email)
        
        // Send success message to background script
        await notifyAuthSuccess(tokenData)
        
        showSuccess()
        
        // Close window after delay
        setTimeout(() => {
          window.close()
        }, 2000)
        
      } else {
        throw new Error(tokenData.error || 'Token verification failed')
      }
      
    } catch (error) {
      console.error('Token verification error:', error)
      showError('Authentication verification failed')
    }
  }
}

/**
 * Verify Supabase token and get user info
 */
async function verifySupabaseToken(accessToken, refreshToken) {
  try {
    let response
    
    // Use API client if available
    if (typeof extensionApiClient !== 'undefined') {
      response = await extensionApiClient.supabaseAuth('user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (response.success && response.data) {
        return {
          success: true,
          token: accessToken,
          refreshToken: refreshToken,
          user: {
            id: response.data.id,
            email: response.data.email,
            user_metadata: response.data.user_metadata
          }
        }
      } else {
        throw new Error('Invalid token response')
      }
    } else {
      // Fallback to direct fetch
      const fetchResponse = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': config.supabaseAnonKey
        }
      })
      
      if (!fetchResponse.ok) {
        throw new Error(`Token verification failed: ${fetchResponse.status}`)
      }
      
      const userData = await fetchResponse.json()
      
      return {
        success: true,
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: userData.id,
          email: userData.email,
          user_metadata: userData.user_metadata
        }
      }
    }
    
  } catch (error) {
    console.error('Token verification error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Notify background script of successful authentication
 */
async function notifyAuthSuccess(tokenData) {
  try {
    // Send message to background script
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'OAUTH_COMPLETE',
        payload: {
          token: tokenData.token,
          refreshToken: tokenData.refreshToken,
          user: tokenData.user
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
    
    console.log('✅ Background script notified of OAuth success')
    
  } catch (error) {
    console.error('Failed to notify background script:', error)
    throw error
  }
}

/**
 * Show loading state
 */
function showLoading() {
  authForm.style.display = 'none'
  error.classList.remove('show')
  success.classList.remove('show')
  loading.classList.add('show')
}

/**
 * Show error state
 */
function showError(message) {
  authForm.style.display = 'none'
  loading.classList.remove('show')
  success.classList.remove('show')
  
  errorMessage.textContent = message
  error.classList.add('show')
}

/**
 * Show success state
 */
function showSuccess() {
  authForm.style.display = 'none'
  loading.classList.remove('show')
  error.classList.remove('show')
  success.classList.add('show')
}

/**
 * Show auth form (default state)
 */
function showAuthForm() {
  loading.classList.remove('show')
  error.classList.remove('show')
  success.classList.remove('show')
  authForm.style.display = 'block'
}

console.log('✅ Auth script loaded')