# Chrome Extension Integration - Implementation Tasks

## Overview
Job Orbit becomes the cloud companion for the ATS Resume Optimizer Chrome Extension. Both share a single Supabase account, unified authentication, and synchronized data.

## Phase 1: Database & Infrastructure

### Task 1.1: Create Enhanced Profiles Table
**Requirement**: Extend profiles table with personal, professional, and preference data (Requirement #2)
**Description**: Add 20+ columns to profiles table including address, professional info, links, and preferences. Enable RLS with auth.uid() policies.
**Files to Create/Modify**:
- Create SQL migration script at `src/migrations/001_enhance_profiles.sql`

**Acceptance Criteria**:
- [ ] All personal fields added (first_name, last_name, phone, avatar_url)
- [ ] Address fields added (address_line_1, address_line_2, city, state, country, zip_code)
- [ ] Professional fields added (current_role, years_of_experience, notice_period_days, current_salary, expected_salary, employment_type)
- [ ] Social links added (linkedin_url, github_url, portfolio_url, leetcode_url, hackerrank_url, website_url)
- [ ] Preference fields added (preferred_locations, work_mode_preferences, job_categories, seniority_level, skills)
- [ ] RLS enabled with SELECT/UPDATE/INSERT policies using auth.uid()
- [ ] profile_completion_percentage field added
- [ ] Indexes created on user_id and profile_completion_percentage

### Task 1.2: Create Resumes Table
**Requirement**: Resume Management (Requirement #3), Database schema enhancement
**Description**: Create resumes table with file handling, default selection, versioning, and metadata.
**Files to Create/Modify**:
- Create SQL migration script at `src/migrations/002_create_resumes.sql`

**Acceptance Criteria**:
- [ ] resumes table created with UUID, user_id, title, file_url, file_name, file_size, file_type
- [ ] file_hash field added for duplicate detection
- [ ] is_default boolean with UNIQUE constraint (only one default per user)
- [ ] version tracking implemented (version INT, previous_version_id UUID)
- [ ] ats_score field added (placeholder for future ML)
- [ ] preview_text field for resume preview
- [ ] created_at, updated_at timestamps
- [ ] RLS policies enabled (SELECT, INSERT, UPDATE, DELETE)
- [ ] Indexes on user_id and is_default
- [ ] Storage bucket configured at `resumes/{user_id}/{resume_id}`


### Task 1.3: Create AI Answers Table
**Requirement**: AI Answer Library (Requirement #4)
**Description**: Create ai_answers table to store reusable interview responses with categories, favorites, and usage tracking.
**Files to Create/Modify**:
- Create SQL migration script at `src/migrations/003_create_ai_answers.sql`

**Acceptance Criteria**:
- [ ] ai_answers table created with UUID, user_id, title, content (markdown)
- [ ] category field added (enum-like string: about_yourself, why_hire, leadership, etc.)
- [ ] tags field as TEXT array for flexible tagging
- [ ] difficulty_level field (easy, medium, hard)
- [ ] estimated_delivery_seconds field for timing
- [ ] is_favorite boolean
- [ ] usage_count INT DEFAULT 0
- [ ] last_used_at timestamp
- [ ] created_at, updated_at timestamps
- [ ] RLS policies enabled (SELECT, INSERT, UPDATE, DELETE)
- [ ] Indexes on user_id, category, is_favorite

### Task 1.4: Create User Settings Table
**Requirement**: Settings Management (Requirement #9)
**Description**: Create user_settings table with theme, extension behavior, AI assistant, notification, and privacy settings.
**Files to Create/Modify**:
- Create SQL migration script at `src/migrations/004_create_user_settings.sql`

**Acceptance Criteria**:
- [ ] user_settings table created with UUID, user_id (UNIQUE)
- [ ] theme field (light, dark, auto)
- [ ] extension_auto_fill, extension_floating_button, extension_auto_save_applications booleans
- [ ] extension_notifications_enabled boolean
- [ ] ai_writing_style (formal, conversational, creative)
- [ ] ai_response_length (short, medium, long)
- [ ] ai_auto_insert_answers boolean
- [ ] preferred_resume_id UUID foreign key
- [ ] Notification preference booleans (interview_reminders, status_updates, weekly_summary, important_only)
- [ ] Privacy preference booleans (allow_analytics, allow_usage_tracking)
- [ ] created_at, updated_at timestamps
- [ ] RLS policies enabled (SELECT, UPDATE, INSERT)

### Task 1.5: Enhance Jobs Table for Extension Integration
**Requirement**: Application Tracker (Requirement #5), Chrome Extension Integration (Requirement #7)
**Description**: Add columns to jobs table for cover letter, resume tracking, extension integration, and recruiter contact info.
**Files to Create/Modify**:
- Create SQL migration script at `src/migrations/005_enhance_jobs.sql`

**Acceptance Criteria**:
- [ ] cover_letter TEXT field added
- [ ] resume_id UUID foreign key to resumes table added
- [ ] extension_id VARCHAR(255) for extension integration tracking
- [ ] interview_type field (phone, video, inperson, other)
- [ ] recruiter_name, recruiter_email, recruiter_phone fields added
- [ ] company_notes TEXT field added
- [ ] job_description TEXT field added
- [ ] employment_type VARCHAR(50) added
- [ ] RLS policies enforced (SELECT, INSERT, UPDATE, DELETE)
- [ ] Indexes created on user_id, resume_id

### Task 1.6: Create Sync Logs Table
**Requirement**: Real-Time Synchronization (Requirement #13), Database schema
**Description**: Create sync_logs table to track all synchronization events between web and extension.
**Files to Create/Modify**:
- Create SQL migration script at `src/migrations/006_create_sync_logs.sql`

**Acceptance Criteria**:
- [ ] sync_logs table created with UUID, user_id, source (web/extension)
- [ ] action field (profile_update, resume_upload, answer_create, etc.)
- [ ] entity_type field (profile, resume, answer, application, settings)
- [ ] entity_id UUID field
- [ ] data JSONB field for synced payload
- [ ] status field (success, failed, pending)
- [ ] error_message TEXT field
- [ ] sync_duration_ms INT field
- [ ] created_at timestamp
- [ ] RLS policies enabled (SELECT)
- [ ] Indexes on user_id, created_at for query performance

### Task 1.7: Create Guest Data Table
**Requirement**: Guest Migration (Requirement #8)
**Description**: Create guest_data table to temporarily store guest data for migration when user signs up.
**Files to Create/Modify**:
- Create SQL migration script at `src/migrations/007_create_guest_data.sql`

**Acceptance Criteria**:
- [ ] guest_data table created with UUID, user_id (UNIQUE), JSONB fields
- [ ] resumes JSONB, answers JSONB, settings JSONB, applications JSONB fields
- [ ] profile JSONB field
- [ ] migrated_at timestamp
- [ ] migration_status field (pending, completed, failed)
- [ ] created_at timestamp
- [ ] RLS policies enabled


## Phase 2: Authentication & OAuth

### Task 2.1: Configure OAuth Providers in Supabase
**Requirement**: Authentication & OAuth (Requirement #1)
**Description**: Configure Google and GitHub OAuth providers in Supabase dashboard. Set up redirect URLs and credential management.
**Files to Modify**: None (Supabase dashboard configuration)

**Acceptance Criteria**:
- [ ] Google OAuth provider configured with credentials
- [ ] Google redirect URL set to `https://joborbit.com/auth/callback` (dev: localhost:5173)
- [ ] GitHub OAuth provider configured with credentials
- [ ] GitHub redirect URL configured
- [ ] OAuth credentials stored in environment variables
- [ ] Test login flow with both providers works

### Task 2.2: Update useAuth Hook for OAuth Support
**Requirement**: Authentication & OAuth (Requirement #1)
**Description**: Enhance useAuth hook to support Google and GitHub OAuth sign-in methods.
**Files to Create/Modify**:
- Modify `src/hooks/useAuth.tsx`

**Acceptance Criteria**:
- [ ] signInWithGoogle() method added using supabase.auth.signInWithOAuth('google')
- [ ] signInWithGitHub() method added using supabase.auth.signInWithOAuth('github')
- [ ] signInWithOAuth(provider) generic method for future providers
- [ ] OAuth redirect handling in useEffect
- [ ] Error handling for OAuth failures
- [ ] Session validation after OAuth redirect
- [ ] localStorage clearing on logout

### Task 2.3: Add OAuth Buttons to Login Page
**Requirement**: Authentication & OAuth (Requirement #1)
**Description**: Add Google and GitHub OAuth buttons to the Login page.
**Files to Modify**:
- Modify `src/pages/Login.tsx`

**Acceptance Criteria**:
- [ ] Google OAuth button added with Google icon
- [ ] GitHub OAuth button added with GitHub icon
- [ ] Divider with "or continue with email" text
- [ ] Loading state for OAuth buttons
- [ ] Error toast on OAuth failure
- [ ] Responsive design on mobile
- [ ] Accessibility: proper aria labels and keyboard navigation

### Task 2.4: Add OAuth Options to Signup Page
**Requirement**: Authentication & OAuth (Requirement #1)
**Description**: Add OAuth options to Signup page with proper messaging.
**Files to Modify**:
- Modify `src/pages/Signup.tsx`

**Acceptance Criteria**:
- [ ] Google OAuth button added
- [ ] GitHub OAuth button added
- [ ] "Sign up with email" alternative text
- [ ] Same loading and error handling as login
- [ ] Profile auto-population from OAuth provider (when available)
- [ ] Accessibility compliant

### Task 2.5: Create OAuth Callback Handler
**Requirement**: Authentication & OAuth (Requirement #1)
**Description**: Create a callback page to handle OAuth redirects from Supabase.
**Files to Create**:
- Create `src/pages/AuthCallback.tsx`
- Create `src/hooks/useAuthCallback.tsx`

**Acceptance Criteria**:
- [ ] AuthCallback page created at /auth/callback route
- [ ] useAuthCallback hook detects redirect code and exchanges for session
- [ ] Loading state while processing callback
- [ ] Error handling for callback failures
- [ ] Redirects to /dashboard on success
- [ ] Redirects to /login on failure
- [ ] Auto-creates user profile on first-time OAuth login



## Phase 3: API Layer (v1)

### Task 3.1: Create API Base Infrastructure
**Requirement**: API Design (Requirement #11)
**Description**: Set up Vite API routing, request validation, error handling, and response formatting.
**Files to Create**:
- Create `src/api/v1/middleware.ts` - Auth, CORS, logging, rate limiting
- Create `src/api/v1/validators.ts` - Zod schemas for request validation
- Create `src/api/v1/responses.ts` - Standardized response formatting
- Create `src/api/v1/errors.ts` - Custom error classes

**Acceptance Criteria**:
- [ ] Express/Hono API server setup (via Vite plugin)
- [ ] Authentication middleware checks bearer token
- [ ] CORS configured for extension origin
- [ ] Rate limiting middleware (100 req/min per user)
- [ ] Request logging middleware
- [ ] Response wrapper with success/error format
- [ ] Error handling with consistent format
- [ ] Request timeout handling (30s)

### Task 3.2: Create Profile API Endpoints
**Requirement**: API Design (Requirement #11), User Profile Management
**Description**: Implement GET and PATCH endpoints for user profile management.
**Files to Create**:
- Create `src/api/v1/routes/profile.ts`

**Acceptance Criteria**:
- [ ] GET /api/v1/profile - Returns full user profile
- [ ] PATCH /api/v1/profile - Update profile fields (auto-save compatible)
- [ ] GET /api/v1/profile/completion - Returns completion percentage
- [ ] POST /api/v1/profile/avatar - Upload profile picture
- [ ] Request validation with Zod
- [ ] Field-level updates (partial updates)
- [ ] Optimistic update support via response
- [ ] Error handling for validation failures

### Task 3.3: Create Resume API Endpoints
**Requirement**: API Design (Requirement #11), Resume Management
**Description**: Implement CRUD endpoints for resume management.
**Files to Create**:
- Create `src/api/v1/routes/resumes.ts`

**Acceptance Criteria**:
- [ ] GET /api/v1/resumes - List all resumes with pagination
- [ ] GET /api/v1/resumes/:id - Get specific resume details
- [ ] POST /api/v1/resumes - Upload new resume (multipart/form-data)
- [ ] PATCH /api/v1/resumes/:id - Update resume metadata (title, etc.)
- [ ] DELETE /api/v1/resumes/:id - Delete resume
- [ ] POST /api/v1/resumes/:id/set-default - Set as default resume
- [ ] GET /api/v1/resumes/:id/preview - Get resume preview text
- [ ] File upload validation (type, size, hash)
- [ ] Duplicate detection via file hash

### Task 3.4: Create AI Answer API Endpoints
**Requirement**: API Design (Requirement #11), AI Answer Library
**Description**: Implement CRUD endpoints for AI answers.
**Files to Create**:
- Create `src/api/v1/routes/answers.ts`

**Acceptance Criteria**:
- [ ] GET /api/v1/answers - List answers with filters and pagination
- [ ] GET /api/v1/answers/:id - Get specific answer
- [ ] POST /api/v1/answers - Create new answer
- [ ] PATCH /api/v1/answers/:id - Update answer
- [ ] DELETE /api/v1/answers/:id - Delete answer
- [ ] POST /api/v1/answers/:id/favorite - Toggle favorite
- [ ] GET /api/v1/answers/search?q=query - Search answers
- [ ] Filtering by category, tags, is_favorite
- [ ] Sorting by created_at, usage_count, last_used_at

### Task 3.5: Create Application API Endpoints
**Requirement**: API Design (Requirement #11), Application Tracker
**Description**: Implement CRUD endpoints for job applications.
**Files to Create**:
- Create `src/api/v1/routes/applications.ts`

**Acceptance Criteria**:
- [ ] GET /api/v1/applications - List with filters (status, date range, company)
- [ ] GET /api/v1/applications/:id - Get application details
- [ ] POST /api/v1/applications - Create application
- [ ] PATCH /api/v1/applications/:id - Update application
- [ ] DELETE /api/v1/applications/:id - Delete application
- [ ] PATCH /api/v1/applications/:id/status - Update status only
- [ ] POST /api/v1/applications/:id/notes - Add/update notes
- [ ] Duplicate detection (company + role + date)
- [ ] Pagination support (limit, offset)


### Task 3.6: Create Settings API Endpoints
**Requirement**: API Design (Requirement #11), Settings Management
**Description**: Implement endpoints for user settings management.
**Files to Create**:
- Create `src/api/v1/routes/settings.ts`

**Acceptance Criteria**:
- [ ] GET /api/v1/settings - Get all user settings
- [ ] PATCH /api/v1/settings - Update multiple settings
- [ ] GET /api/v1/settings/:key - Get specific setting value
- [ ] PATCH /api/v1/settings/:key - Update specific setting
- [ ] Validation for setting values (enums, booleans)
- [ ] Default values for missing settings
- [ ] Settings inheritance from defaults

### Task 3.7: Create Authentication API Endpoints
**Requirement**: API Design (Requirement #11), Authentication
**Description**: Implement auth helper endpoints.
**Files to Create**:
- Create `src/api/v1/routes/auth.ts`

**Acceptance Criteria**:
- [ ] GET /api/v1/auth/session - Check current session
- [ ] POST /api/v1/auth/logout - Invalidate current token
- [ ] POST /api/v1/auth/refresh - Refresh access token
- [ ] POST /api/v1/auth/extension-token - Get extension-safe token
- [ ] Returns session user info or null
- [ ] Proper token expiry handling

## Phase 4: User Profile Management

### Task 4.1: Create Comprehensive Profile Page
**Requirement**: User Profile Management (Requirement #2)
**Description**: Build a full-featured profile management page with auto-save.
**Files to Create**:
- Create `src/pages/Profile.tsx`
- Create `src/components/profile/PersonalSection.tsx`
- Create `src/components/profile/AddressSection.tsx`
- Create `src/components/profile/ProfessionalSection.tsx`
- Create `src/components/profile/LinksSection.tsx`
- Create `src/components/profile/PreferencesSection.tsx`
- Create `src/hooks/useProfileAutoSave.tsx`

**Acceptance Criteria**:
- [ ] Profile page responsive on all devices
- [ ] Personal section with first name, last name, phone, avatar upload
- [ ] Address section with all address fields
- [ ] Professional section with role, experience, salary info
- [ ] Links section for social profiles
- [ ] Preferences section for job preferences
- [ ] Auto-save every 500ms (debounced)
- [ ] Save status indicator (Saving, Saved, Error)
- [ ] No explicit Save button
- [ ] Validation on each field change
- [ ] Error messages for invalid inputs
- [ ] Profile completion percentage display and tracking

### Task 4.2: Create Profile Auto-Save Hook
**Requirement**: User Profile Management (Requirement #2)
**Description**: Implement useProfileAutoSave hook for field-level auto-saving.
**Files to Create**:
- Create `src/hooks/useProfileAutoSave.tsx`

**Acceptance Criteria**:
- [ ] Hook accepts profile field and value
- [ ] Debounces saves (500ms)
- [ ] Returns { isSaving, error, isDirty }
- [ ] Optimistic UI updates
- [ ] Handles concurrent field updates
- [ ] Rollback on error
- [ ] Shows user feedback for save status

### Task 4.3: Add Profile Completion Tracker
**Requirement**: User Profile Management (Requirement #2)
**Description**: Implement profile completion percentage calculation and display.
**Files to Create**:
- Create `src/lib/profileCompletion.ts`
- Create `src/components/profile/CompletionIndicator.tsx`

**Acceptance Criteria**:
- [ ] Calculate completion based on filled fields
- [ ] Weight different sections (personal 30%, professional 40%, preferences 30%)
- [ ] Update on every profile change
- [ ] Show visual progress indicator
- [ ] Display percentage
- [ ] Show next steps for profile completion



## Phase 5: Resume Management

### Task 5.1: Create Resume Upload Handler
**Requirement**: Resume Management (Requirement #3)
**Description**: Implement file upload handler for resumes with validation and storage.
**Files to Create**:
- Create `src/lib/resumeUpload.ts`
- Create `src/hooks/useResumeUpload.tsx`

**Acceptance Criteria**:
- [ ] File type validation (PDF, DOCX, TXT only)
- [ ] File size validation (max 5MB)
- [ ] Duplicate detection via SHA256 hash
- [ ] Upload to Supabase Storage at `/resumes/{user_id}/{resume_id}`
- [ ] Extract text preview from PDF/DOCX
- [ ] Store file metadata in database
- [ ] Progress tracking for large files
- [ ] Error handling for upload failures
- [ ] Automatic retry on failure

### Task 5.2: Build Resumes Management Page
**Requirement**: Resume Management (Requirement #3)
**Description**: Create page to manage multiple resumes.
**Files to Create**:
- Create `src/pages/Resumes.tsx`
- Create `src/components/resumes/ResumeUploader.tsx`
- Create `src/components/resumes/ResumeList.tsx`
- Create `src/components/resumes/ResumeCard.tsx`

**Acceptance Criteria**:
- [ ] Upload new resume button/dropzone
- [ ] List all user resumes
- [ ] Show default resume indicator
- [ ] Show upload date, file size, preview
- [ ] Set default resume functionality
- [ ] Delete resume functionality with confirmation
- [ ] Rename resume functionality
- [ ] Download resume option
- [ ] View preview option
- [ ] Show version history
- [ ] Pagination if multiple resumes

### Task 5.3: Implement Default Resume Selection
**Requirement**: Resume Management (Requirement #3)
**Description**: Allow users to select default resume used by extension.
**Files to Create**:
- Create `src/hooks/useDefaultResume.tsx`

**Acceptance Criteria**:
- [ ] Only one resume can be default
- [ ] PATCH endpoint to set default
- [ ] UI clearly shows default resume
- [ ] Extension automatically uses default resume
- [ ] Settings page shows current default
- [ ] Can change default anytime

### Task 5.4: Create Resume Preview Component
**Requirement**: Resume Management (Requirement #3)
**Description**: Build resume preview viewer.
**Files to Create**:
- Create `src/components/resumes/ResumePreview.tsx`

**Acceptance Criteria**:
- [ ] Show extracted text preview
- [ ] Show PDF preview if available
- [ ] Show metadata (upload date, size, version)
- [ ] Copy preview text functionality
- [ ] Download option
- [ ] Close/modal functionality

## Phase 6: AI Answer Library

### Task 6.1: Create AI Answer Storage and Management Page
**Requirement**: AI Answer Library (Requirement #4)
**Description**: Build comprehensive AI answer management interface.
**Files to Create**:
- Create `src/pages/AIAnswers.tsx`
- Create `src/components/answers/AnswerList.tsx`
- Create `src/components/answers/AnswerCard.tsx`
- Create `src/components/answers/AnswerEditor.tsx`

**Acceptance Criteria**:
- [ ] List all answers with category filter
- [ ] Search answers by keyword
- [ ] Filter by category (dropdown/buttons)
- [ ] Filter by favorite (star icon)
- [ ] Create new answer button
- [ ] Edit existing answer
- [ ] Delete answer with confirmation
- [ ] Toggle favorite
- [ ] Show usage count and last used date
- [ ] Responsive design

### Task 6.2: Build Answer Editor Component
**Requirement**: AI Answer Library (Requirement #4)
**Description**: Create rich text editor for answer content.
**Files to Create**:
- Create `src/components/answers/AnswerEditor.tsx`

**Acceptance Criteria**:
- [ ] Rich text editor (basic formatting: bold, italic, bullet points)
- [ ] Title input field
- [ ] Category dropdown (predefined + custom)
- [ ] Tags input with comma separation
- [ ] Difficulty level selector
- [ ] Estimated delivery time input
- [ ] Save draft functionality
- [ ] Auto-save to localStorage
- [ ] Character/word counter
- [ ] Preview mode

### Task 6.3: Implement Search and Filter System
**Requirement**: AI Answer Library (Requirement #4)
**Description**: Build search and filtering for answers.
**Files to Create**:
- Create `src/lib/answerSearch.ts`
- Modify `src/pages/AIAnswers.tsx`

**Acceptance Criteria**:
- [ ] Full-text search across title and content
- [ ] Filter by category (multi-select)
- [ ] Filter by tags
- [ ] Filter by difficulty level
- [ ] Filter by favorite status
- [ ] Sort by created_at, usage_count, last_used_at
- [ ] Search highlights results
- [ ] No results message with suggestions



### Task 6.4: Create Answer Templates
**Requirement**: AI Answer Library (Requirement #4)
**Description**: Provide pre-built answer templates for common interview questions.
**Files to Create**:
- Create `src/lib/answerTemplates.ts`
- Create `src/components/answers/TemplateGallery.tsx`

**Acceptance Criteria**:
- [ ] 8 predefined templates for common questions
- [ ] One-click duplicate template as starting point
- [ ] Templates include estimated delivery time
- [ ] Templates have tags pre-applied
- [ ] Template gallery accessible from answer creation
- [ ] Customizable after duplication

## Phase 7: Settings Management

### Task 7.1: Create Comprehensive Settings Page
**Requirement**: Settings Management (Requirement #9)
**Description**: Build settings page with all user preferences.
**Files to Create**:
- Create `src/pages/Settings.tsx`
- Create `src/components/settings/AppearanceSettings.tsx`
- Create `src/components/settings/ExtensionSettings.tsx`
- Create `src/components/settings/NotificationSettings.tsx`
- Create `src/components/settings/PrivacySettings.tsx`
- Create `src/hooks/useSettingsAutoSave.tsx`

**Acceptance Criteria**:
- [ ] Appearance section (theme, language, timezone)
- [ ] Extension section (auto-fill, floating button, notifications)
- [ ] AI section (writing style, response length, default resume)
- [ ] Notification section (interview reminders, status updates, etc.)
- [ ] Privacy section (analytics, usage tracking)
- [ ] All settings auto-save on change
- [ ] Status indicator (Saving, Saved)
- [ ] Settings organized in tabs or sections
- [ ] Responsive design

### Task 7.2: Implement Auto-Save for Settings
**Requirement**: Settings Management (Requirement #9)
**Description**: Create auto-save hook for settings with debouncing.
**Files to Create**:
- Create `src/hooks/useSettingsAutoSave.tsx`

**Acceptance Criteria**:
- [ ] Debounced saves (500ms)
- [ ] Returns { isSaving, error }
- [ ] Optimistic UI updates
- [ ] Handles concurrent setting updates
- [ ] Error recovery
- [ ] User feedback for save status

## Phase 8: Chrome Extension Integration Foundation

### Task 8.1: Create Extension Session Manager
**Requirement**: Chrome Extension Integration (Requirement #7, 12)
**Description**: Implement session management for Chrome Extension authentication.
**Files to Create**:
- Create `src/lib/extensionSession.ts`
- Create `src/hooks/useExtensionSession.tsx`

**Acceptance Criteria**:
- [ ] Generate secure extension token (JWT)
- [ ] Token includes extension ID verification
- [ ] Token expires in 1 hour
- [ ] Refresh token mechanism (7 day expiry)
- [ ] Store tokens in chrome.storage.session (not localStorage)
- [ ] Validate extension origin
- [ ] Secure token exchange endpoint

### Task 8.2: Create Extension Authentication Flow
**Requirement**: Chrome Extension Integration (Requirement #12)
**Description**: Implement sign-in flow for Chrome Extension.
**Files to Create**:
- Create `src/api/v1/routes/extension-auth.ts`
- Create `src/lib/extensionAuth.ts`

**Acceptance Criteria**:
- [ ] POST /api/v1/auth/extension-token endpoint
- [ ] Check if user logged in on web
- [ ] Auto-load user data if already authenticated
- [ ] Return session data (profile, default resume, settings)
- [ ] Extension can continue as guest if not authenticated
- [ ] Secure origin verification
- [ ] Rate limiting on extension endpoints

### Task 8.3: Create Extension Data Fetcher
**Requirement**: Chrome Extension Integration (Requirement #7)
**Description**: Build API to fetch all user data needed by extension.
**Files to Create**:
- Create `src/api/v1/routes/extension-data.ts`
- Create `src/lib/extensionData.ts`

**Acceptance Criteria**:
- [ ] GET /api/v1/extension/data endpoint
- [ ] Returns: profile, default resume, AI answers, settings, recent applications
- [ ] Single endpoint for efficiency
- [ ] Cached on extension side
- [ ] Minimal data transfer
- [ ] Version tracking for invalidation



## Phase 9: Real-Time Synchronization

### Task 9.1: Implement Supabase Realtime Subscriptions
**Requirement**: Real-Time Synchronization (Requirement #13)
**Description**: Set up realtime listeners for data changes.
**Files to Create**:
- Create `src/lib/realtimeSubscriptions.ts`
- Create `src/hooks/useRealtimeSync.tsx`

**Acceptance Criteria**:
- [ ] Subscribe to profile changes
- [ ] Subscribe to resume changes
- [ ] Subscribe to AI answer changes
- [ ] Subscribe to application changes
- [ ] Subscribe to settings changes
- [ ] Unsubscribe on unmount
- [ ] Handle reconnection
- [ ] Queue updates while offline
- [ ] Apply updates immediately on reconnect

### Task 9.2: Create Sync Conflict Resolution
**Requirement**: Real-Time Synchronization (Requirement #13)
**Description**: Handle conflicts when both web and extension update simultaneously.
**Files to Create**:
- Create `src/lib/syncConflictResolver.ts`

**Acceptance Criteria**:
- [ ] Last-write-wins strategy
- [ ] Timestamp-based conflict detection
- [ ] Log conflicts to sync_logs table
- [ ] Notify user of conflicts
- [ ] Provide conflict resolution UI
- [ ] Manual merge option

### Task 9.3: Build Sync Status Indicator
**Requirement**: Real-Time Synchronization (Requirement #13)
**Description**: Create UI component showing sync status.
**Files to Create**:
- Create `src/components/SyncStatusIndicator.tsx`
- Create `src/hooks/useSyncStatus.tsx`

**Acceptance Criteria**:
- [ ] Show sync in progress
- [ ] Show last sync time
- [ ] Show sync errors
- [ ] Manual sync button
- [ ] Icon indicator in header
- [ ] Tooltip with details

## Phase 10: Dashboard Enhancements

### Task 10.1: Add Profile Completion Widget
**Requirement**: Dashboard Enhancements (Requirement #11)
**Description**: Add profile completion percentage to dashboard.
**Files to Modify**:
- Modify `src/pages/Dashboard.tsx`

**Acceptance Criteria**:
- [ ] Display profile completion percentage
- [ ] Show as progress bar
- [ ] Show next incomplete field
- [ ] Quick link to profile page
- [ ] Update in real-time

### Task 10.2: Add Resume Score Display
**Requirement**: Dashboard Enhancements (Requirement #11)
**Description**: Display resume ATS score on dashboard.
**Files to Modify**:
- Modify `src/pages/Dashboard.tsx`

**Acceptance Criteria**:
- [ ] Show default resume name
- [ ] Show upload date
- [ ] Show ATS score (placeholder)
- [ ] Quick upload new resume link

### Task 10.3: Add Sync Status to Dashboard
**Requirement**: Dashboard Enhancements (Requirement #11)
**Description**: Display extension connection and sync status.
**Files to Modify**:
- Modify `src/pages/Dashboard.tsx`

**Acceptance Criteria**:
- [ ] Show extension connection status
- [ ] Show last sync time
- [ ] Manual sync button
- [ ] Extension settings link

## Phase 11: Security & RLS

### Task 11.1: Verify RLS Policies on All Tables
**Requirement**: Security (Requirement #10)
**Description**: Verify and test Row Level Security on all tables.
**Files to Review**: All migration files
**Acceptance Criteria**:
- [ ] profiles table - auth.uid() = user_id for all operations
- [ ] resumes table - auth.uid() = user_id for all operations
- [ ] ai_answers table - auth.uid() = user_id for all operations
- [ ] user_settings table - auth.uid() = user_id for all operations
- [ ] jobs table - auth.uid() = user_id for all operations
- [ ] sync_logs table - auth.uid() = user_id for SELECT
- [ ] guest_data table - auth.uid() = user_id for all operations
- [ ] Test RLS with different users

### Task 11.2: Implement API Route Protection
**Requirement**: Security (Requirement #10)
**Description**: Add authentication checks to all API routes.
**Files to Modify**: All API route files

**Acceptance Criteria**:
- [ ] All routes require valid bearer token
- [ ] Routes verify token user matches request
- [ ] 401 Unauthorized for missing token
- [ ] 403 Forbidden for token/user mismatch
- [ ] Token expiry checking
- [ ] Refresh token endpoint accessible without auth

### Task 11.3: Add CORS Configuration for Extension
**Requirement**: Security (Requirement #10)
**Description**: Configure CORS to allow extension domain.
**Files to Modify**: API middleware

**Acceptance Criteria**:
- [ ] CORS headers configured for extension
- [ ] Content-Type application/json
- [ ] Credentials included in requests
- [ ] Extension origin verified
- [ ] Pre-flight requests handled

### Task 11.4: Implement Rate Limiting
**Requirement**: Security (Requirement #10)
**Description**: Add rate limiting to prevent abuse.
**Files to Modify**: API middleware

**Acceptance Criteria**:
- [ ] Rate limit: 100 requests/minute per user
- [ ] Rate limit: 10 file uploads/hour per user
- [ ] Return 429 Too Many Requests on limit
- [ ] Include retry-after header
- [ ] Log rate limit violations



## Phase 12: Guest Migration

### Task 12.1: Create Guest Data Detection
**Requirement**: Guest Migration (Requirement #8)
**Description**: Detect and store guest data on first signup.
**Files to Create**:
- Create `src/lib/guestDataDetection.ts`
- Create `src/hooks/useGuestData.tsx`

**Acceptance Criteria**:
- [ ] Check localStorage for guest data on signup
- [ ] Detect guest resumes (if any)
- [ ] Detect guest answers (if any)
- [ ] Detect guest settings (if any)
- [ ] Store guest data in guest_data table
- [ ] Set migration_status to 'pending'

### Task 12.2: Build Guest Data Migration UI
**Requirement**: Guest Migration (Requirement #8)
**Description**: Create UI for guest data import/migration.
**Files to Create**:
- Create `src/components/GuestMigrationDialog.tsx`

**Acceptance Criteria**:
- [ ] Modal shows available guest data
- [ ] Checkboxes for each data type (resumes, answers, settings, applications)
- [ ] "Migrate" and "Skip" buttons
- [ ] Shows count of items to migrate
- [ ] Preview of data to migrate
- [ ] Success message after migration
- [ ] Error handling and retry

### Task 12.3: Implement Safe Merge
**Requirement**: Guest Migration (Requirement #8)
**Description**: Safely merge guest data without duplicates.
**Files to Create**:
- Create `src/lib/guestDataMerge.ts`

**Acceptance Criteria**:
- [ ] Check for duplicate resumes (file hash comparison)
- [ ] Check for duplicate answers (title + content hash)
- [ ] Check for duplicate applications (company + role + date)
- [ ] Merge settings (override with migrated)
- [ ] Merge profile (preserve user data, add missing)
- [ ] Preserve timestamps
- [ ] Log all merged items

### Task 12.4: Build Guest Data Cleanup
**Requirement**: Guest Migration (Requirement #8)
**Description**: Clean up guest data after successful migration.
**Files to Create**:
- Create `src/lib/guestDataCleanup.ts`

**Acceptance Criteria**:
- [ ] Clear localStorage after migration
- [ ] Mark guest_data.migration_status = 'completed'
- [ ] Log migration completion
- [ ] Prevent re-migration

## Phase 13: Testing & Validation

### Task 13.1: Create API Endpoint Tests
**Requirement**: Testing & Validation (Requirement #13)
**Description**: Write tests for all API endpoints.
**Files to Create**:
- Create `src/api/v1/routes/__tests__/profile.test.ts`
- Create `src/api/v1/routes/__tests__/resumes.test.ts`
- Create `src/api/v1/routes/__tests__/answers.test.ts`
- Create `src/api/v1/routes/__tests__/applications.test.ts`
- Create `src/api/v1/routes/__tests__/settings.test.ts`

**Acceptance Criteria**:
- [ ] Test GET endpoints return correct data
- [ ] Test PATCH endpoints update correctly
- [ ] Test POST endpoints create with correct data
- [ ] Test DELETE endpoints remove correctly
- [ ] Test validation rejects invalid input
- [ ] Test authentication required
- [ ] Test RLS prevents access to other users' data
- [ ] Test error handling

### Task 13.2: Create Authentication Flow Tests
**Requirement**: Testing & Validation (Requirement #13)
**Description**: Test authentication and OAuth flows.
**Files to Create**:
- Create `src/hooks/__tests__/useAuth.test.tsx`

**Acceptance Criteria**:
- [ ] Test email/password login
- [ ] Test OAuth sign-in
- [ ] Test logout
- [ ] Test session persistence
- [ ] Test auto-logout on token expiry

### Task 13.3: Create Profile Auto-Save Tests
**Requirement**: Testing & Validation (Requirement #13)
**Description**: Test profile auto-save functionality.
**Files to Create**:
- Create `src/hooks/__tests__/useProfileAutoSave.test.tsx`

**Acceptance Criteria**:
- [ ] Test debounced saves
- [ ] Test optimistic updates
- [ ] Test error recovery
- [ ] Test multiple concurrent updates

### Task 13.4: Create Sync Tests
**Requirement**: Testing & Validation (Requirement #13)
**Description**: Test synchronization between web and extension.
**Files to Create**:
- Create `src/lib/__tests__/realtimeSync.test.ts`

**Acceptance Criteria**:
- [ ] Test realtime subscription
- [ ] Test conflict detection
- [ ] Test conflict resolution
- [ ] Test offline queue
- [ ] Test reconnection sync

## Phase 14: Documentation

### Task 14.1: Create API Documentation
**Requirement**: Documentation & Deployment (Requirement #14)
**Description**: Document all API endpoints.
**Files to Create**:
- Create `API_DOCUMENTATION.md`

**Acceptance Criteria**:
- [ ] Endpoint URL and method
- [ ] Request/response format
- [ ] Authentication requirements
- [ ] Error codes and messages
- [ ] Rate limiting info
- [ ] Example requests/responses
- [ ] Extension-specific notes

### Task 14.2: Create Extension Developer Guide
**Requirement**: Documentation & Deployment (Requirement #14)
**Description**: Guide for extension developers integrating with Job Orbit.
**Files to Create**:
- Create `EXTENSION_INTEGRATION_GUIDE.md`

**Acceptance Criteria**:
- [ ] Architecture overview
- [ ] Authentication flow
- [ ] Data sync mechanism
- [ ] API usage examples
- [ ] Security considerations
- [ ] Troubleshooting guide

### Task 14.3: Create Deployment Checklist
**Requirement**: Documentation & Deployment (Requirement #14)
**Description**: Pre-deployment verification checklist.
**Files to Create**:
- Create `DEPLOYMENT_CHECKLIST.md`

**Acceptance Criteria**:
- [ ] Database migrations verified
- [ ] RLS policies enabled
- [ ] OAuth credentials configured
- [ ] API endpoints tested
- [ ] Rate limiting configured
- [ ] Error logging enabled
- [ ] Monitoring setup
- [ ] Backup procedures

## Priority Implementation Order
1. Phase 1: Database & Infrastructure (Tasks 1.1-1.7)
2. Phase 2: Authentication & OAuth (Tasks 2.1-2.5)
3. Phase 3: API Layer (Tasks 3.1-3.7)
4. Phase 4: User Profile Management (Tasks 4.1-4.3)
5. Phase 5: Resume Management (Tasks 5.1-5.4)
6. Phase 6: AI Answer Library (Tasks 6.1-6.4)
7. Phase 7: Settings Management (Tasks 7.1-7.2)
8. Phase 8: Chrome Extension Integration Foundation (Tasks 8.1-8.3)
9. Phase 9: Real-Time Synchronization (Tasks 9.1-9.3)
10. Phase 10: Dashboard Enhancements (Tasks 10.1-10.3)
11. Phase 11: Security & RLS (Tasks 11.1-11.4)
12. Phase 12: Guest Migration (Tasks 12.1-12.4)
13. Phase 13: Testing & Validation (Tasks 13.1-13.4)
14. Phase 14: Documentation (Tasks 14.1-14.3)
