# Job Orbit Chrome Extension

The Job Orbit Chrome Extension allows users to capture job applications directly from job sites and sync them with their Job Orbit account.

## Features

- 🔐 **Secure Authentication** - OAuth login with Google, GitHub, or Microsoft
- 🔄 **Auto Job Detection** - Automatically detects jobs on LinkedIn, Indeed, Glassdoor, and Monster
- 💾 **One-Click Save** - Save job applications with a single click
- 🔄 **Real-time Sync** - Automatically syncs with Job Orbit dashboard
- 📱 **Persistent Login** - Stay logged in across browser sessions
- 🎯 **Smart Capture** - Extracts job title, company, location, and description

## Supported Job Sites

- LinkedIn
- Indeed  
- Glassdoor
- Monster

## Installation

### Development Setup

1. **Load Extension in Chrome**:
   ```
   1. Open Chrome and go to chrome://extensions/
   2. Enable "Developer mode" (toggle in top right)
   3. Click "Load unpacked" 
   4. Select the chrome-extension directory
   5. The extension should appear in your extensions list
   ```

2. **Configure Environment**:
   - The extension automatically detects localhost:5173 (development) or production
   - Make sure the Job Orbit web app is running

### Production Installation

1. Download the extension package from the Chrome Web Store (when published)
2. Install and pin to toolbar
3. Click the extension icon and sign in with your Job Orbit account

## Usage

### First Time Setup

1. **Install Extension** - Add to Chrome via developer mode or Chrome Web Store
2. **Sign In** - Click the extension icon and sign in with your Job Orbit account
3. **Grant Permissions** - Allow access to job sites when prompted

### Capturing Jobs

1. **Visit Job Site** - Go to LinkedIn, Indeed, Glassdoor, or Monster
2. **Open Job Listing** - Navigate to a specific job detail page
3. **Save Job** - Click the "Save to Job Orbit" button that appears
4. **Verify Sync** - Check your Job Orbit dashboard to confirm the job was saved

### Managing Extension

- **Open Popup** - Click extension icon to see status and stats
- **Sync Data** - Manual sync button in popup
- **Sign Out** - Logout from popup settings
- **View Dashboard** - Quick link to Job Orbit dashboard

## Architecture

### Authentication Flow

```
1. User clicks "Sign in" in extension popup
2. Opens Job Orbit OAuth window (/extension-auth)
3. User completes OAuth with provider (Google/GitHub/Microsoft)
4. Job Orbit creates extension session token
5. Extension stores token in chrome.storage.local
6. All API calls use X-Extension-Token header
```

### File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (handles auth & API)
├── popup.html            # Extension popup UI
├── popup.js              # Popup interactions
├── auth.html             # OAuth authentication page  
├── auth.js               # OAuth flow handling
├── content.js            # Job site content script
├── lib/
│   └── auth-manager.js   # Authentication manager
├── icons/               # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png  
│   ├── icon-48.png
│   └── icon-128.png
└── README.md
```

### Key Components

- **AuthManager** - Handles authentication state and token management
- **Background Script** - Service worker for persistent auth and API communication
- **Content Script** - Runs on job sites to detect and capture job listings
- **Popup** - Extension UI for login, status, and quick actions
- **OAuth Flow** - Secure authentication via Job Orbit web app

## API Integration

### Extension Session API

The extension uses a secure session token system:

1. **Create Session**: `GET /functions/v1/extension-session`
   - Requires valid Supabase JWT
   - Returns extension-specific JWT token
   - Token contains minimal payload (sessionId + userId)

2. **API Requests**: Include `X-Extension-Token` header
   - All Job Orbit API endpoints support extension tokens
   - Backend validates token against extension_sessions table

3. **Token Refresh**: Tokens expire in 1 hour
   - Extension automatically prompts for re-authentication
   - No automatic refresh (user must log in again)

### Data Synchronization

- **Applications**: Synced to Job Orbit `jobs` table
- **Profile**: Retrieved from `profiles` table  
- **Settings**: Retrieved from `user_settings` table
- **Real-time**: Uses Supabase real-time for instant updates

## Security

### Token Storage
- Extension tokens stored in `chrome.storage.local`
- Tokens are JWT with minimal payload
- Backend validates each request against database

### Permissions
- `storage` - Store authentication tokens
- `tabs` - Detect job sites and inject content scripts
- `activeTab` - Access current page content for job extraction
- Host permissions for supported job sites

### Data Privacy  
- Only job-related data is captured
- No personal browsing data stored
- All communication over HTTPS
- Follows Chrome Extension security guidelines

## Development

### Local Development

1. **Start Job Orbit Web App**:
   ```bash
   cd /path/to/joborbit
   npm run dev  # Starts on localhost:5173
   ```

2. **Load Extension**:
   - Open Chrome → Extensions → Developer Mode
   - Load unpacked → Select chrome-extension folder

3. **Test Authentication**:
   - Click extension icon
   - Sign in should open localhost:5173/extension-auth
   - Complete OAuth flow

4. **Test Job Capture**:
   - Visit linkedin.com/jobs or indeed.com
   - Open a job listing  
   - Look for "Save to Job Orbit" button

### Testing Checklist

#### Authentication
- [ ] Extension popup shows login when not authenticated  
- [ ] OAuth window opens when clicking sign in
- [ ] OAuth completes and stores extension token
- [ ] Popup shows user info when authenticated
- [ ] Logout clears stored tokens
- [ ] Login persists across browser restart

#### Job Capture
- [ ] Content script loads on supported job sites
- [ ] Job data extracted correctly from listings
- [ ] "Save to Job Orbit" button appears when authenticated
- [ ] Button click saves job and shows success
- [ ] Saved job appears in Job Orbit dashboard
- [ ] Error handling for failed saves

#### UI/UX
- [ ] Popup UI responsive and styled correctly
- [ ] Loading states work properly  
- [ ] Error messages are clear and helpful
- [ ] Success feedback is visible
- [ ] Extension icon shows in toolbar

### Debugging

1. **Background Script**: `chrome://extensions` → Extension details → Inspect views: background page
2. **Popup**: Right-click extension icon → Inspect popup
3. **Content Script**: Open DevTools on job site pages
4. **Storage**: `chrome://extensions` → Extension details → Storage

### Common Issues

**Extension won't load**: Check manifest.json syntax
**Auth popup blocked**: Ensure pop-ups are allowed
**Content script not injecting**: Check host permissions
**API calls failing**: Verify extension token in storage
**Job detection not working**: Check CSS selectors for job sites

## Deployment

### Chrome Web Store

1. **Package Extension**:
   ```bash
   zip -r joborbit-extension.zip chrome-extension/
   ```

2. **Upload to Chrome Web Store**:
   - Go to Chrome Web Store Developer Dashboard
   - Upload ZIP file
   - Fill out store listing details
   - Submit for review

3. **Update Process**:
   - Increment version in manifest.json
   - Package and upload new version
   - Chrome auto-updates installed extensions

### Production Configuration

Before publishing:
- [ ] Replace placeholder icons with Job Orbit branding
- [ ] Update manifest.json with production URLs
- [ ] Configure Supabase production keys
- [ ] Test with production Job Orbit environment
- [ ] Add proper Chrome Web Store listing
- [ ] Set up error tracking and analytics

## Support

- **Documentation**: [Job Orbit Help Center](https://joborbit.com/help)
- **Bug Reports**: [GitHub Issues](https://github.com/joborbit/extension/issues)  
- **Feature Requests**: [Feature Request Form](https://joborbit.com/feedback)

## License

Private - Job Orbit Extension  
Copyright © 2024 Job Orbit. All rights reserved.