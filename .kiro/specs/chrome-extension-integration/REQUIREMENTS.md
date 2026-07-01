# Chrome Extension Integration - Requirements Document

## 1. Authentication Requirements

### Current State
- ✅ Supabase authentication configured with PKCE flow
- ✅ Email/password authentication working
- ⚠️ No OAuth providers configured

### Requirements
- Support Google OAuth login
- Support GitHub OAuth login
- Support Microsoft OAuth login (optional)
- Single account for web and extension
- Secure session management with token refresh
- Persistent login across browser restarts
- Proper logout flow

### Extension-Specific Authentication
- Extension should not require manual login if already authenticated on web
- Extension should display "Continue as Guest" or "Sign in with Job Orbit"
- After web login, extension should automatically load user data
- Session tokens must be securely stored (not in localStorage for extension)

---

## 2. User Profile Requirements

### Personal Information
- First Name
- Last Name
- Email (read-only from auth)
- Phone Number
- Profile Picture/Avatar

### Address Information
- Address Line 1
- Address Line 2
- City
- State/Province
- Country
- ZIP/PIN Code

### Professional Information
- Current Job Title/Role
- Years of Experience
- Notice Period (in days)
- Current Salary
- Expected Salary
- Employment Type (Full-time, Part-time, Contract)

### Social Links
- LinkedIn URL
- GitHub URL
- Portfolio URL
- LeetCode URL
- HackerRank URL
- Personal Website

### Preferences
- Preferred Job Locations (multiple)
- Work Mode Preferences (Remote, Hybrid, On-site)
- Job Categories (multiple)
- Seniority Level
- Skills (array)

### Requirements
- Auto-save every field change (no save button)
- Debounce auto-save (500ms)
- Show save status indicator (saving, saved, error)
- Validate inputs before saving
- Real-time sync to extension
- Profile completion percentage tracking (0-100%)

---

## 3. Resume Management Requirements

### Resume Information
- Resume File (PDF, DOCX)
- Resume Title/Name
- Upload Date
- File Size
- Last Modified Date
- Is Default (boolean)
- Resume Preview (text extraction)
- ATS Score (placeholder for future ML integration)
- Compatibility Score with Job Description (future)

### Operations
- Upload multiple resumes
- Select default resume (one per user)
- Delete resumes
- Rename resumes
- Download resumes
- View resume preview
- Resume history (view versions)
- Duplicate resume

### Extension Integration
- Extension always uses the selected default resume
- Extension can change default resume from settings
- When extension detects job application, it logs the resume used

### Requirements
- Max file size: 5MB
- Supported formats: PDF, DOCX, TXT
- Resume scanning for ATS compatibility (future)
- Resume version history (keep last 3 versions)
- Auto-backup to cloud storage
- Secure file storage with encryption

---

## 4. AI Answer Library Requirements

### Predefined Question Categories
1. Tell me about yourself
2. Why should we hire you?
3. Why do you want to work at this company?
4. Tell me about a time you demonstrated leadership
5. How do you handle conflicts?
6. What are your career goals?
7. Tell me about your greatest achievement
8. Custom question template

### Answer Features
- Store answer text (rich text/markdown)
- Favorite answers (star rating)
- Tags/Categories for easy searching
- Creation date and last modified date
- Usage statistics (times used in extension)
- Difficulty level (Easy, Medium, Hard)
- Answer length (seconds to deliver)

### Operations
- Create new answer
- Edit existing answer
- Delete answer
- Search answers by keyword
- Filter by category/tag
- Mark as favorite
- View usage statistics
- Clone/duplicate answer

### Extension Integration
- Extension displays relevant answers when filling job forms
- Extension can insert answers with one click
- Extension tracks which answers are used
- Update usage statistics in real-time

### Requirements
- Full-text search across answers
- Auto-save as user types
- Rich text editor with formatting
- Character/word limit suggestions
- Answer preview in extension format
- Sync answers to extension in real-time

---

## 5. Application Tracker Requirements

### Application Information
- Company Name
- Job Title
- Job URL
- Job Description (auto-scraped from URL)
- Location
- Salary Range (min, max)
- Job Type (Full-time, Part-time, Contract, Internship)
- Applied Date
- Application Status
- Cover Letter Used
- Resume Used
- Interview Date (if scheduled)
- Interview Type (Phone, Video, In-person, Other)
- Notes/Comments
- Recruiter Contact Info
- Company Research Notes

### Application Statuses
- To Apply (saved but not applied)
- Applied
- Assessment (coding test, assignment)
- Interview (phone/video/in-person)
- Offer
- Accepted (offer signed)
- Rejected
- Withdrawn

### Operations
- Create application (manual or auto from extension)
- Edit application details
- Update application status
- Add notes
- Delete application
- Search applications
- Filter by status/date/company
- Export applications

### Extension Integration
- Extension auto-creates application record after successful application
- Extension pre-fills known job data (title, company, salary, location)
- Extension logs which resume and cover letter were used
- Extension can add notes to application
- Real-time sync when status changes

### Requirements
- Auto-extract job data from job posting pages
- Duplicate detection (prevent duplicate applications)
- LinkedIn integration for auto-filling company info
- Interview reminders
- Follow-up scheduling
- Statistics and analytics

---

## 6. Settings Requirements

### User Preferences
- Theme (Light, Dark, Auto)
- Language (English, others)
- Timezone
- Date Format
- Currency Format

### Extension Behavior
- Auto-Fill Enabled (boolean)
- Floating Button Enabled (boolean)
- Auto-Save Applications (boolean)
- Show Notifications (boolean)

### AI Assistant Settings
- AI Writing Style (Formal, Conversational, Creative)
- Response Length Preference (Short, Medium, Long)
- Preferred Resume (resume_id)
- Auto-insert Answers (boolean)

### Notification Settings
- Interview Reminders (boolean)
- Application Status Updates (boolean)
- Weekly Summary (boolean)
- Important Events Only (boolean)

### Privacy Settings
- Data Collection (for analytics)
- Browser History Permission
- Share Usage Statistics (boolean)

### Requirements
- All settings auto-save
- Settings sync to extension in real-time
- Granular permission controls
- Default sensible values
- Settings export/import for backup

---

## 7. API Requirements

### Architecture
- RESTful API with versioning (/api/v1/)
- JSON request/response format
- Consistent error handling
- Request/response logging
- Rate limiting per user (100 req/min)
- CORS configured for extension

### Authentication
- Bearer token in Authorization header
- Session token refresh mechanism
- Extension-specific token exchange
- Secure token storage

### Response Format
```json
{
  "success": boolean,
  "data": object | null,
  "error": {
    "code": string,
    "message": string,
    "details": object | null
  },
  "timestamp": ISO8601,
  "request_id": string
}
```

### Profile Endpoints
- `GET /api/v1/profile` - Get user profile
- `PATCH /api/v1/profile` - Update profile (auto-save)
- `GET /api/v1/profile/completion` - Get completion percentage
- `PATCH /api/v1/profile/avatar` - Upload avatar

### Resume Endpoints
- `GET /api/v1/resumes` - List all resumes
- `GET /api/v1/resumes/:id` - Get resume details
- `POST /api/v1/resumes` - Upload new resume
- `PATCH /api/v1/resumes/:id` - Update resume metadata
- `DELETE /api/v1/resumes/:id` - Delete resume
- `POST /api/v1/resumes/:id/set-default` - Set as default
- `GET /api/v1/resumes/:id/preview` - Get resume preview

### AI Answer Endpoints
- `GET /api/v1/answers` - List all answers
- `GET /api/v1/answers/:id` - Get specific answer
- `POST /api/v1/answers` - Create new answer
- `PATCH /api/v1/answers/:id` - Update answer
- `DELETE /api/v1/answers/:id` - Delete answer
- `POST /api/v1/answers/:id/favorite` - Toggle favorite
- `GET /api/v1/answers/search?q=query` - Search answers

### Application Endpoints
- `GET /api/v1/applications` - List applications (with filters)
- `GET /api/v1/applications/:id` - Get application details
- `POST /api/v1/applications` - Create new application
- `PATCH /api/v1/applications/:id` - Update application
- `DELETE /api/v1/applications/:id` - Delete application
- `PATCH /api/v1/applications/:id/status` - Update status
- `POST /api/v1/applications/:id/notes` - Add note

### Settings Endpoints
- `GET /api/v1/settings` - Get all user settings
- `PATCH /api/v1/settings` - Update settings
- `GET /api/v1/settings/:key` - Get specific setting
- `PATCH /api/v1/settings/:key` - Update specific setting

### Auth Endpoints
- `GET /api/v1/auth/session` - Check current session
- `POST /api/v1/auth/logout` - Logout (invalidate token)
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/extension-token` - Get extension token

### Requirements
- Input validation on all endpoints
- Rate limiting
- Proper HTTP status codes
- Comprehensive error messages
- Request logging
- Performance monitoring

---

## 8. Chrome Extension Integration Requirements

### Extension Architecture
- Manifest V3 compliant
- Background script for sync
- Content script for job form detection
- Popup for quick access
- Settings page

### Extension Capabilities
- Auto-detect job application forms
- Pre-fill job details (title, company, location, salary)
- Insert pre-written answers from AI library
- Auto-save applications to Job Orbit
- Show user profile information
- Change preferred resume
- Update application status
- View recent applications

### Authentication Flow
- Extension checks if user is logged in (via Job Orbit)
- If logged in, extension loads user data automatically
- If not logged in, shows "Sign in" or "Continue as Guest" options
- Extension uses secure token exchange
- Session tokens stored in chrome.storage.session (not localStorage)

### Data Sync
- Bi-directional sync (web ↔ extension)
- Real-time updates using Supabase realtime
- Background sync every 5 minutes
- Manual sync button in extension
- Sync status indicator
- Conflict resolution (last-write-wins)

### User Experience
- Floating button on job sites (LinkedIn, Indeed, etc.)
- Right-click context menu
- Keyboard shortcuts (Cmd+Shift+A)
- Notification badges
- One-click answer insertion
- Application tracking dashboard

### Requirements
- Fast performance (<500ms load time)
- Minimal permissions (only necessary)
- Privacy-first design
- Offline support with sync on reconnect
- No direct database access (all via API)

---

## 9. Guest Migration Requirements

### Detection
- When user signs up, check for guest data in localStorage
- Guest data includes: resumes, answers, settings, applications

### Migration Flow
1. User signs up → System detects guest data
2. Show migration prompt: "Import your guest data?"
3. User can select what to import (checkboxes)
4. Validate and merge safely
5. Show success message
6. Clear guest data from localStorage

### Merge Strategy
- Resumes: Import as new resumes
- Answers: Import as new answers (check for duplicates)
- Settings: Override with migrated settings
- Applications: Import as new applications (check for duplicates)
- Profiles: Merge profile data (preserve user-entered data, add missing fields)

### Duplicate Detection
- For answers: Check title and first 100 characters
- For applications: Check company + role + applied_date
- For resumes: Check file hash

### Requirements
- No data loss during migration
- Provide option to select what to import
- Clear user guidance
- Rollback capability
- Migration log for debugging

---

## 10. Real-Time Synchronization Requirements

### Data to Sync
- Profile updates
- Resume uploads/deletions
- AI answer changes
- Application status updates
- Application notes
- Settings changes

### Sync Direction
- Web → Extension: Auto-sync within 1 second
- Extension → Web: Auto-sync within 1 second
- Manual sync button available
- Conflict resolution when both sides update simultaneously

### Implementation
- Use Supabase realtime subscriptions
- Background script polls every 5 minutes (backup)
- Message passing between popup and background
- Web page uses realtime listeners
- Cache data locally for offline use

### Requirements
- No data loss on sync failure
- Clear error messages
- Automatic retry with exponential backoff
- Sync logs for debugging
- User control over sync frequency

---

## 11. Security Requirements

### Row Level Security (RLS)
- All tables have RLS enabled
- Each user can only access their own data
- Service role key never used in client
- Supabase key rotation periodic
- No sensitive data in API responses

### API Security
- JWT bearer tokens
- Secure token refresh mechanism
- Rate limiting per user
- Input sanitization
- SQL injection prevention (via Supabase)
- XSS prevention
- CSRF protection

### Data Encryption
- Sensitive fields encrypted at rest
- HTTPS for all communications
- File uploads encrypted
- Session tokens short-lived (1 hour)
- Refresh tokens long-lived (7 days)

### Extension Security
- No hardcoded API keys
- Extension ID verification
- Secure origin verification
- No direct database access
- All API calls verified

### Requirements
- Regular security audits
- Dependency vulnerability scanning
- GDPR compliance
- Data retention policies
- User data deletion on account deletion

---

## 12. Dashboard Enhancements

### Profile Completion
- Display profile completion percentage (0-100%)
- Show which sections are incomplete
- Quick edit buttons for incomplete sections
- Incentivize profile completion

### Resume Status
- Default resume indicator
- Resume count
- Latest upload date
- Quick upload button

### Extension Status
- Extension connection indicator (Connected/Disconnected)
- Last sync time
- Extension version
- Quick settings link

### Upcoming Follow-ups
- List of applications needing follow-up
- Days since last update
- Quick action buttons
- Follow-up reminders

### Recent Activity
- Recent applications added
- Recent status changes
- Resume uploads
- Profile updates

---

## 13. Future Enhancements (Out of Scope)

- AI-powered resume optimization
- Job market insights and salary data
- Interview coaching with AI
- LinkedIn job recommendation integration
- Indeed integration
- Glassdoor integration
- Job board scraping
- Email tracking for applications
- Interview scheduler
- Cover letter generator (AI)
- Job description analyzer
- Skill gap analyzer
- Mobile app (iOS/Android)
- Firefox extension
- Edge extension
