/**
 * Chrome Extension Popup Script
 * Handles UI interactions and authentication flow in the popup window
 */

// UI Elements
const loadingSection = document.getElementById('loadingSection')
const loginSection = document.getElementById('loginSection') 
const userSection = document.getElementById('userSection')
const errorSection = document.getElementById('errorSection')

const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const syncDataBtn = document.getElementById('syncDataBtn')
const openDashboardBtn = document.getElementById('openDashboardBtn')
const settingsBtn = document.getElementById('settingsBtn')
const retryBtn = document.getElementById('retryBtn')

const userEmail = document.getElementById('userEmail')
const applicationsCount = document.getElementById('applicationsCount')
const syncStatus = document.getElementById('syncStatus')
const errorMessage = document.getElementById('errorMessage')

const helpLink = document.getElementById('helpLink')
const privacyLink = document.getElementById('privacyLink')
const aboutLink = document.getElementById('aboutLink')

// State
let currentAuthState = null

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎯 Popup initialized')
  
  try {
    // Set up event listeners
    setupEventListeners()
    
    // Check authentication state
    await checkAuthState()
    
  } catch (error) {
    console.error('Popup initialization error:', error)
    showError('Failed to initialize. Please try again.')
  }
})

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Authentication buttons
  loginBtn.addEventListener('click', handleLogin)
  logoutBtn.addEventListener('click', handleLogout)
  
  // Action buttons
  syncDataBtn.addEventListener('click', handleSyncData)
  openDashboardBtn.addEventListener('click', handleOpenDashboard)
  settingsBtn.addEventListener('click', handleOpenSettings)
  
  // Error handling
  retryBtn.addEventListener('click', handleRetry)
  
  // Footer links
  helpLink.addEventListener('click', (e) => {
    e.preventDefault()
    openUrl('https://joborbit.com/help')
  })
  
  privacyLink.addEventListener('click', (e) => {
    e.preventDefault()
    openUrl('https://joborbit.com/privacy')
  })
  
  aboutLink.addEventListener('click', (e) => {
    e.preventDefault()
    openUrl('https://joborbit.com/about')
  })
}

/**
 * Check authentication state
 */
async function checkAuthState() {
  showLoading()
  
  try {
    // Request auth state from background script
    const response = await sendMessage({ type: 'GET_AUTH_STATE' })
    
    if (response.success && response.authState) {
      currentAuthState = response.authState
      
      if (currentAuthState.isLoggedIn && currentAuthState.user) {
        showUserSection()
        await loadUserData()
      } else {
        showLoginSection()
      }
    } else {
      throw new Error(response.error || 'Failed to get auth state')
    }
    
  } catch (error) {
    console.error('Auth state check failed:', error)
    showError('Unable to check authentication status. Please try again.')
  }
}

/**
 * Handle login button click
 */
async function handleLogin() {
  console.log('🔐 Starting login process...')
  
  try {
    // Disable login button
    loginBtn.disabled = true
    loginBtn.textContent = 'Signing in...'
    
    // Request login from background script
    const response = await sendMessage({ type: 'LOGIN' })
    
    if (response.success) {
      console.log('✅ Login successful')
      currentAuthState = response.authState
      showUserSection()
      await loadUserData()
    } else {
      throw new Error(response.error || 'Login failed')
    }
    
  } catch (error) {
    console.error('Login failed:', error)
    showError(`Login failed: ${error.message}`)
  } finally {
    // Re-enable login button
    loginBtn.disabled = false
    loginBtn.textContent = 'Sign in with Job Orbit'
  }
}

/**
 * Handle logout button click
 */
async function handleLogout() {
  console.log('🚪 Logging out...')
  
  try {
    // Confirm logout
    if (!confirm('Are you sure you want to sign out?')) {
      return
    }
    
    // Disable logout button
    logoutBtn.disabled = true
    
    // Request logout from background script
    const response = await sendMessage({ type: 'LOGOUT' })
    
    if (response.success) {
      console.log('✅ Logout successful')
      currentAuthState = null
      showLoginSection()
    } else {
      throw new Error(response.error || 'Logout failed')
    }
    
  } catch (error) {
    console.error('Logout failed:', error)
    showError(`Logout failed: ${error.message}`)
  } finally {
    // Re-enable logout button
    logoutBtn.disabled = false
  }
}

/**
 * Handle sync data button click
 */
async function handleSyncData() {
  console.log('🔄 Syncing data...')
  
  try {
    // Update button state
    const originalText = syncDataBtn.textContent
    syncDataBtn.disabled = true
    syncDataBtn.textContent = '🔄 Syncing...'
    
    // Request sync from background script
    const response = await sendMessage({ type: 'SYNC_DATA' })
    
    if (response.success) {
      console.log('✅ Sync successful:', response.syncResult)
      
      // Update sync status
      syncStatus.textContent = '✓'
      
      // Show success message briefly
      syncDataBtn.textContent = '✅ Synced!'
      setTimeout(() => {
        syncDataBtn.textContent = originalText
      }, 2000)
      
      // Refresh user data
      await loadUserData()
      
    } else {
      throw new Error(response.error || 'Sync failed')
    }
    
  } catch (error) {
    console.error('Sync failed:', error)
    syncStatus.textContent = '⚠️'
    showError(`Sync failed: ${error.message}`)
  } finally {
    syncDataBtn.disabled = false
  }
}

/**
 * Handle open dashboard button click
 */
async function handleOpenDashboard() {
  try {
    await openUrl('https://joborbit.com/dashboard')
  } catch (error) {
    console.error('Failed to open dashboard:', error)
  }
}

/**
 * Handle settings button click  
 */
async function handleOpenSettings() {
  try {
    await openUrl('https://joborbit.com/settings')
  } catch (error) {
    console.error('Failed to open settings:', error)
  }
}

/**
 * Handle retry button click
 */
async function handleRetry() {
  console.log('🔄 Retrying...')
  await checkAuthState()
}

/**
 * Load user data and stats
 */
async function loadUserData() {
  try {
    if (!currentAuthState?.user) {
      return
    }
    
    // Update user email
    userEmail.textContent = currentAuthState.user.email || 'Unknown user'
    
    // Load applications count using message to background script
    try {
      const response = await sendMessage({ type: 'GET_APPLICATIONS' })
      
      if (response.success && response.applications) {
        applicationsCount.textContent = response.applications.length || 0
      }
    } catch (error) {
      console.error('Failed to load applications:', error)
      applicationsCount.textContent = '?'
    }
    
    // Update sync status
    syncStatus.textContent = '✓'
    
  } catch (error) {
    console.error('Failed to load user data:', error)
  }
}

/**
 * Show loading state
 */
function showLoading() {
  hideAllSections()
  loadingSection.style.display = 'block'
}

/**
 * Show login section
 */
function showLoginSection() {
  hideAllSections()
  loginSection.style.display = 'block'
}

/**
 * Show user section
 */
function showUserSection() {
  hideAllSections()
  userSection.classList.add('show')
}

/**
 * Show error section
 */
function showError(message) {
  hideAllSections()
  errorMessage.textContent = message
  errorSection.classList.add('show')
}

/**
 * Hide all sections
 */
function hideAllSections() {
  loadingSection.style.display = 'none'
  loginSection.style.display = 'none'
  userSection.classList.remove('show')
  errorSection.classList.remove('show')
}

/**
 * Send message to background script
 */
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message
        })
      } else {
        resolve(response || { success: false, error: 'No response' })
      }
    })
  })
}

/**
 * Open URL in new tab
 */
async function openUrl(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url: url }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to open URL:', chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

/**
 * Handle extension messages (from background script)
 */
chrome.runtime.onMessage?.addListener((message, sender, sendResponse) => {
  console.log('📨 Popup received message:', message.type)
  
  switch (message.type) {
    case 'AUTH_STATE_CHANGED':
      currentAuthState = message.authState
      
      if (currentAuthState.isLoggedIn) {
        showUserSection()
        loadUserData()
      } else {
        showLoginSection()
      }
      
      sendResponse({ success: true })
      break
      
    case 'SYNC_COMPLETE':
      // Refresh data after sync
      loadUserData()
      sendResponse({ success: true })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
})

console.log('✅ Popup script loaded')