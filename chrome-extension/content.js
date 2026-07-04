/**
 * Chrome Extension Content Script
 * Runs on job sites to capture job listings and enable quick application saving
 */

console.log('🎯 Job Orbit content script loaded on:', window.location.hostname)

// Configuration
const JOB_SITES = {
  'linkedin.com': {
    selectors: {
      jobTitle: '.jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title',
      company: '.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name', 
      location: '.jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__bullet',
      description: '.jobs-description__content, .job-details-jobs-unified-top-card__primary-description',
      applyButton: '.jobs-apply-button, .jobs-unified-top-card__apply-button'
    }
  },
  'indeed.com': {
    selectors: {
      jobTitle: '[data-testid="jobsearch-JobInfoHeader-title"] h1, .jobsearch-JobInfoHeader-title span',
      company: '[data-testid="inlineHeader-companyName"] a, .icl-u-lg-mr--sm',
      location: '[data-testid="job-location"], .icl-u-xs-mt--xs',
      description: '#jobDescriptionText, .jobsearch-jobDescriptionText',
      applyButton: '.indeed-apply-button, [data-testid="applyButtonLinkContainer"]'
    }
  },
  'glassdoor.com': {
    selectors: {
      jobTitle: '[data-test="job-title"], .JobDetails_jobTitle__Rw_gn',
      company: '[data-test="employer-name"], .JobDetails_companyName__cKo8H',
      location: '[data-test="job-location"], .JobDetails_location__mSg5h', 
      description: '#JobDescriptionContainer, .JobDetails_jobDescription__uW_fK',
      applyButton: '[data-test="apply-btn"], .JobDetails_applyButton__Fb_xO'
    }
  },
  'monster.com': {
    selectors: {
      jobTitle: '.job-header h1, [data-testid="jobTitle"]',
      company: '.job-header .company, [data-testid="companyName"]',
      location: '.job-header .location, [data-testid="jobLocation"]',
      description: '.job-description, [data-testid="jobDescription"]',
      applyButton: '.apply-button, [data-testid="applyButton"]'
    }
  }
}

// State
let isAuthenticated = false
let captureButton = null
let currentJobData = null

/**
 * Initialize content script
 */
function init() {
  console.log('🚀 Initializing Job Orbit content script')
  
  // Check authentication status
  checkAuthStatus()
  
  // Detect if we're on a job detail page
  detectJobPage()
  
  // Set up page change detection for SPA sites
  setupPageChangeDetection()
  
  // Listen for messages from background script
  setupMessageListener()
}

/**
 * Check if user is authenticated with Job Orbit
 */
async function checkAuthStatus() {
  try {
    const response = await sendMessage({ type: 'GET_AUTH_STATE' })
    
    if (response.success && response.authState) {
      isAuthenticated = response.authState.isLoggedIn
      console.log('🔐 Auth status:', isAuthenticated ? 'Authenticated' : 'Not authenticated')
      
      if (isAuthenticated) {
        // Enable job capture functionality
        enableJobCapture()
      }
    }
  } catch (error) {
    console.error('Failed to check auth status:', error)
  }
}

/**
 * Detect if current page is a job detail page
 */
function detectJobPage() {
  const hostname = window.location.hostname
  const siteConfig = getSiteConfig(hostname)
  
  if (!siteConfig) {
    console.log('📍 Not a supported job site')
    return
  }
  
  console.log('📍 Supported job site detected:', hostname)
  
  // Try to extract job data
  const jobData = extractJobData(siteConfig)
  
  if (jobData && jobData.title) {
    console.log('📋 Job detected:', jobData.title, '@', jobData.company)
    currentJobData = jobData
    
    if (isAuthenticated) {
      showCaptureButton()
    }
  }
}

/**
 * Get site configuration for current hostname
 */
function getSiteConfig(hostname) {
  for (const [site, config] of Object.entries(JOB_SITES)) {
    if (hostname.includes(site)) {
      return config
    }
  }
  return null
}

/**
 * Extract job data from current page
 */
function extractJobData(siteConfig) {
  try {
    const selectors = siteConfig.selectors
    
    const jobData = {
      title: getTextFromSelectors(selectors.jobTitle),
      company: getTextFromSelectors(selectors.company),
      location: getTextFromSelectors(selectors.location),
      description: getTextFromSelectors(selectors.description),
      url: window.location.href,
      source: window.location.hostname,
      capturedAt: new Date().toISOString()
    }
    
    // Clean up the data
    Object.keys(jobData).forEach(key => {
      if (typeof jobData[key] === 'string') {
        jobData[key] = jobData[key].trim()
      }
    })
    
    return jobData
    
  } catch (error) {
    console.error('Failed to extract job data:', error)
    return null
  }
}

/**
 * Get text content from CSS selectors (try multiple selectors)
 */
function getTextFromSelectors(selectors) {
  if (!selectors) return ''
  
  const selectorList = selectors.split(', ')
  
  for (const selector of selectorList) {
    try {
      const element = document.querySelector(selector.trim())
      if (element) {
        return element.textContent || element.innerText || ''
      }
    } catch (error) {
      // Invalid selector, continue to next
    }
  }
  
  return ''
}

/**
 * Enable job capture functionality
 */
function enableJobCapture() {
  console.log('✅ Job capture enabled')
  
  if (currentJobData) {
    showCaptureButton()
  }
}

/**
 * Show job capture button
 */
function showCaptureButton() {
  // Don't show multiple buttons
  if (captureButton) return
  
  // Create capture button
  captureButton = createCaptureButton()
  
  // Add to page
  document.body.appendChild(captureButton)
  
  console.log('📌 Capture button added to page')
}

/**
 * Create job capture button element
 */
function createCaptureButton() {
  const button = document.createElement('div')
  button.id = 'joborbit-capture-btn'
  button.innerHTML = `
    <div class="joborbit-btn-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
    </div>
    <div class="joborbit-btn-text">Save to Job Orbit</div>
  `
  
  // Add styles
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 12px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  `
  
  // Add hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)'
    button.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)'
  })
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)'
    button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)'
  })
  
  // Add click handler
  button.addEventListener('click', handleCaptureClick)
  
  return button
}

/**
 * Handle capture button click
 */
async function handleCaptureClick() {
  if (!currentJobData) {
    console.error('No job data to capture')
    return
  }
  
  try {
    console.log('💾 Capturing job application...')
    
    // Update button to show loading
    const buttonText = captureButton.querySelector('.joborbit-btn-text')
    const originalText = buttonText.textContent
    buttonText.textContent = 'Saving...'
    captureButton.style.pointerEvents = 'none'
    
    // Send job data to background script
    const response = await sendMessage({
      type: 'SAVE_APPLICATION',
      payload: currentJobData
    })
    
    if (response.success) {
      console.log('✅ Job saved successfully')
      
      // Show success state
      buttonText.textContent = '✓ Saved!'
      captureButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
      
      // Reset after 3 seconds
      setTimeout(() => {
        buttonText.textContent = originalText
        captureButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        captureButton.style.pointerEvents = 'auto'
      }, 3000)
      
    } else {
      throw new Error(response.error || 'Failed to save job')
    }
    
  } catch (error) {
    console.error('Failed to capture job:', error)
    
    // Show error state
    const buttonText = captureButton.querySelector('.joborbit-btn-text')
    buttonText.textContent = 'Error - Try Again'
    captureButton.style.background = 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)'
    
    // Reset after 3 seconds
    setTimeout(() => {
      buttonText.textContent = 'Save to Job Orbit'
      captureButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      captureButton.style.pointerEvents = 'auto'
    }, 3000)
  }
}

/**
 * Set up page change detection for Single Page Applications
 */
function setupPageChangeDetection() {
  // For SPAs like LinkedIn, detect URL changes
  let currentUrl = window.location.href
  
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href
      console.log('📍 Page changed, re-detecting job')
      
      // Remove old capture button
      if (captureButton) {
        captureButton.remove()
        captureButton = null
        currentJobData = null
      }
      
      // Re-detect job after a delay (let page load)
      setTimeout(() => {
        detectJobPage()
      }, 2000)
    }
  }, 1000)
  
  // Also listen for popstate events
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      detectJobPage()
    }, 1000)
  })
}

/**
 * Set up message listener for communication with background script
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Content script received message:', message.type)
    
    switch (message.type) {
      case 'AUTH_STATE_CHANGED':
        isAuthenticated = message.authState.isLoggedIn
        
        if (isAuthenticated) {
          enableJobCapture()
        } else {
          // Remove capture button if logged out
          if (captureButton) {
            captureButton.remove()
            captureButton = null
          }
        }
        
        sendResponse({ success: true })
        break
        
      case 'CAPTURE_JOB':
        // Manual job capture trigger
        handleCaptureClick()
        sendResponse({ success: true })
        break
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' })
    }
    
    return true // Indicate async response
  })
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

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

console.log('✅ Job Orbit content script ready')