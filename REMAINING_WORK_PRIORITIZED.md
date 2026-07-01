# Remaining Work - Prioritized Implementation Guide

**Total Estimated Time**: ~14 hours  
**Priority Order**: MVP First → Nice to Have

---

## 🔴 PRIORITY 1: Build 3 Critical UI Pages (MVP Features)

### Task 1.1: Resume Manager Page (3 hours)

**File**: `src/pages/Resumes.tsx`

**What it needs**:
```typescript
// Core functionality:
- List all user resumes in a table
- Upload new resume button/dialog
- Delete resume button
- Make primary resume button
- Show file size and upload date
- Show file download option

// UI Elements:
- Header: "Resume Manager"
- Button: "+ Upload Resume"
- Table columns:
  * Filename
  * Size
  * Uploaded
  * Primary (badge)
  * Actions (Download, Delete, Set Primary)
- Upload dialog with file picker
- Confirmation dialog for delete
- Loading states
- Error handling
```

**Components Needed**:
- `src/components/ResumeUploadDialog.tsx` - File upload dialog
- `src/components/ResumeTable.tsx` - Resumes list table
- `src/components/ResumePrimaryBadge.tsx` - Primary indicator

**API Integration**:
```typescript
// Use existing Edge Functions:
- GET /resumes-get
- POST /resumes-post
- Use supabase storage for file management
```

**Time Breakdown**:
- UI Layout: 45 min
- Upload dialog: 45 min
- Delete/Edit logic: 45 min
- Testing: 45 min

---

### Task 1.2: Settings Page (2.5 hours)

**File**: `src/pages/Settings.tsx`

**What it needs**:
```typescript
// Core functionality:
- Theme selection (light/dark/auto)
- Toggle: Enable notifications
- Toggle: Enable auto-sync
- Toggle: Enable extension sync
- Show connected OAuth providers
- Logout button

// UI Elements:
- Header: "Settings"
- Section: Appearance
  * Theme selector (radio buttons or dropdown)
- Section: Privacy
  * Notification toggle
  * Auto-sync toggle
  * Extension toggle
- Section: Connected Accounts
  * Show Google OAuth status
  * Show GitHub OAuth status
  * Disconnect buttons
- Section: Danger Zone
  * Delete account button
  * Download data button
```

**Components Needed**:
- `src/components/ThemeSelector.tsx` - Theme picker
- `src/components/OAuthProviderCard.tsx` - OAuth status card
- `src/components/SettingsSection.tsx` - Reusable section

**API Integration**:
```typescript
// Use existing Edge Functions:
- GET /settings-get
- PATCH /settings-patch
```

**Time Breakdown**:
- UI Layout: 45 min
- Theme integration: 30 min
- Toggle switches: 30 min
- OAuth display: 30 min
- Testing: 15 min

---

### Task 1.3: AI Answers Library Page (3 hours)

**File**: `src/pages/Answers.tsx`

**What it needs**:
```typescript
// Core functionality:
- List AI-generated interview answers
- Filter by category (behavioral, technical, etc.)
- Search by question
- Create new answer button/dialog
- Edit existing answers
- Delete answers
- Mark as favorite
- Show category tags

// UI Elements:
- Header: "Interview Answers"
- Button: "+ Add Answer"
- Category tabs/filters
- Search bar
- Answer cards showing:
  * Question
  * Answer preview (truncated)
  * Category badge
  * Favorite star button
  * Edit/Delete buttons
- Create/Edit dialog with:
  * Question input
  * Answer textarea
  * Category selector
- Delete confirmation dialog
```

**Components Needed**:
- `src/components/AnswerCreateDialog.tsx` - Create/edit dialog
- `src/components/AnswerCard.tsx` - Answer card display
- `src/components/CategoryFilter.tsx` - Category tabs
- `src/components/AnswerSearchBar.tsx` - Search component

**API Integration**:
```typescript
// Use existing Edge Functions:
- GET /answers-get
- POST /answers-post
// Need new Edge Function:
- PATCH /answers-patch (for edit/favorite)
```

**Time Breakdown**:
- UI Layout: 45 min
- Answer cards: 45 min
- Filter/search: 45 min
- Create/Edit dialog: 45 min
- Testing: 30 min

---

## 🟡 PRIORITY 2: Critical Backend Features (1.5-2 hours)

### Task 2.1: Guest-to-Account Migration API (1.5 hours)

**File**: `supabase/functions/migrate-guest-data/index.ts`

**What it needs**:
```typescript
// Endpoint: POST /functions/v1/migrate-guest-data
// Behavior:
// 1. Check if user has guest data
// 2. Validate guest data exists
// 3. Copy guest data to user account
// 4. Clear guest data after migration
// 5. Log migration event

// Security:
// - JWT token validation
// - Check auth.uid()
// - RLS policies for data access

// Response:
{
  success: true,
  migrated_count: 5,
  items: {
    applications: 5,
    answers: 2,
    resumes: 1
  }
}
```

**Implementation Steps**:
1. Create function stub (15 min)
2. Add JWT validation (15 min)
3. Query guest data (15 min)
4. Copy to user account (30 min)
5. Cleanup and logging (15 min)
6. Testing (15 min)

**Integration Points**:
- Call from Login page or Dashboard
- Show progress/success message
- Handle errors gracefully

---

### Task 2.2: Create /answers-patch Edge Function (30 min)

**File**: `supabase/functions/answers-patch/index.ts`

**What it needs**:
```typescript
// Endpoint: PATCH /functions/v1/answers-patch/{id}
// Allow updates to:
// - question
// - answer text
// - category
// - is_favorite flag

// Validation:
// - JWT token valid
// - User owns the answer
// - Data integrity
```

---

## 🟢 PRIORITY 3: Production Configuration (30 min - 1 hour)

### Task 3.1: Enable Real-time in Supabase

**Steps**:
1. Go to Supabase Dashboard
2. Navigate to: Database → Replication
3. Enable replication for tables:
   ```
   ✅ profiles
   ✅ resumes
   ✅ ai_answers
   ✅ jobs
   ✅ user_settings
   ```
4. Test real-time updates work
5. Monitor performance

**Time**: 15 minutes

---

### Task 3.2: Add Routes to App.tsx

**File**: `src/App.tsx`

```typescript
// Add these routes:
<Route path="/resumes" element={<ProtectedRoute><Resumes /></ProtectedRoute>} />
<Route path="/answers" element={<ProtectedRoute><Answers /></ProtectedRoute>} />
<Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
```

**Time**: 5 minutes

---

### Task 3.3: Update Navigation

**File**: `src/components/layout/Navbar.tsx` or `NavLink.tsx`

Add links to new pages in navigation menu:
- Resumes
- Answers
- Settings

**Time**: 10 minutes

---

## 📊 Implementation Timeline

### Week 1: UI Pages

**Day 1-2**: Resume Manager UI
```
- Create page structure
- Build upload dialog
- Create resumes table
- Add delete/edit logic
- Test & debug
```

**Day 2-3**: Settings UI
```
- Create settings layout
- Build theme selector
- Add toggle switches
- Display OAuth providers
- Test & debug
```

**Day 3-4**: AI Answers UI
```
- Create answer cards
- Build category filters
- Create answer dialog
- Add search functionality
- Test & debug
```

### Week 2: Backend Features

**Day 1**: Guest Migration
```
- Create migration endpoint
- Implement data copying logic
- Add error handling
- Test migration
```

**Day 1-2**: Testing & Fixes
```
- End-to-end testing
- Bug fixes
- Performance optimization
- Security review
```

### Week 2-3: Deployment

**Day 1**: Production Setup
```
- Deploy Edge Functions
- Enable real-time
- Update environment
- Test in production
```

**Day 2**: Go Live
```
- Monitor performance
- Check for errors
- User acceptance testing
```

---

## Code Templates

### Resume Manager Stub

```typescript
// src/pages/Resumes.tsx
import { useUserResumes } from '@/context/AuthenticatedDataContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'

export default function Resumes() {
  const resumes = useUserResumes()
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Resume Manager</h1>
        <Button>+ Upload Resume</Button>
      </div>
      
      {/* TODO: Table showing resumes */}
      {/* TODO: Upload dialog */}
      {/* TODO: Delete/Edit actions */}
    </div>
  )
}
```

### Settings Stub

```typescript
// src/pages/Settings.tsx
import { useUserSettings } from '@/context/AuthenticatedDataContext'
import { Switch } from '@/components/ui/switch'

export default function Settings() {
  const settings = useUserSettings()
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6 max-w-2xl">
        {/* TODO: Theme section */}
        {/* TODO: Notification toggles */}
        {/* TODO: OAuth providers */}
      </div>
    </div>
  )
}
```

### Answers Library Stub

```typescript
// src/pages/Answers.tsx
import { useAIAnswers } from '@/context/AuthenticatedDataContext'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'

export default function Answers() {
  const answers = useAIAnswers()
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Interview Answers</h1>
        <Button>+ Add Answer</Button>
      </div>
      
      {/* TODO: Category tabs */}
      {/* TODO: Answer cards */}
      {/* TODO: Create/edit dialog */}
    </div>
  )
}
```

---

## Testing Checklist

### Resume Manager
- [ ] Upload file works
- [ ] File appears in list
- [ ] Delete removes file
- [ ] Set primary works
- [ ] Download works
- [ ] Mobile responsive
- [ ] Error handling

### Settings
- [ ] Theme change saves
- [ ] Toggles save state
- [ ] OAuth providers show
- [ ] Disconnect works
- [ ] Mobile responsive
- [ ] Error handling

### AI Answers
- [ ] Create answer works
- [ ] Edit answer works
- [ ] Delete answer works
- [ ] Category filter works
- [ ] Search works
- [ ] Favorite toggle works
- [ ] Mobile responsive
- [ ] Error handling

### Guest Migration
- [ ] Detects guest data
- [ ] Migrates applications
- [ ] Migrates answers
- [ ] Migrates resumes
- [ ] Clears guest data
- [ ] Shows success message
- [ ] Handles errors

---

## Resource Links

### UI Component Library
- All needed components available in `src/components/ui/`
- Shadcn/ui components documented

### API Integration
- Auth context: `src/context/AuthenticatedDataContext.tsx`
- Hooks: `src/hooks/useAuthenticatedData.ts`
- Edge Functions: `supabase/functions/`

### Type Definitions
- All types defined in `src/types/`
- Use for type safety throughout

---

## Risk Mitigation

**Risk**: User data loss during migration
- **Mitigation**: Test with dummy data first, backup before migration

**Risk**: Real-time updates not working
- **Mitigation**: Have fallback polling if real-time fails

**Risk**: File upload fails
- **Mitigation**: Retry logic, clear error messages

**Risk**: Performance issues with large datasets
- **Mitigation**: Implement pagination, lazy loading

---

## Definition of Done (Per Task)

✅ Code written and compiles without errors  
✅ TypeScript strict mode passes  
✅ UI looks good on mobile and desktop  
✅ API integration working  
✅ Error handling implemented  
✅ Loading states shown  
✅ Manual testing passed  
✅ No console warnings or errors  
✅ Responsive design verified  
✅ Accessibility checks passed  

---

## Deployment Checklist

- [ ] All code merged to main
- [ ] Tests passing
- [ ] Build successful
- [ ] Edge Functions deployed to Supabase
- [ ] Real-time enabled for tables
- [ ] Environment variables set
- [ ] Production database seeded with test data
- [ ] Staging environment tested
- [ ] Chrome Extension updated
- [ ] Performance monitored
- [ ] Error tracking configured
- [ ] User documentation updated

---

## Success Metrics

After completion:
- ✅ All 11 features at 100% completion
- ✅ Application fully functional MVP
- ✅ Zero critical bugs
- ✅ Page load < 2 seconds
- ✅ Real-time sync < 500ms
- ✅ Zero security vulnerabilities
- ✅ Chrome Extension fully integrated

---

**Version**: 1.0 Implementation Guide  
**Status**: Ready to Build  
**Confidence**: High  
**Estimated Completion**: 2-3 weeks with focused effort
