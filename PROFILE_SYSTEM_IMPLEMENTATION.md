# Profile System Implementation

## 📋 Overview

Job Orbit now includes a comprehensive **profile system** with:
- ✅ Auto-save functionality (no save button needed)
- ✅ Real-time field validation
- ✅ Instant database synchronization
- ✅ Profile completion tracking
- ✅ Responsive design
- ✅ Error handling and status messages

The profile system is designed to provide a seamless user experience where every edit is automatically saved and validated without requiring user interaction.

## ✅ Features Implemented

### Personal Information
- First Name
- Last Name
- Email (read-only, managed in account settings)
- Phone Number

### Address
- Address Line 1
- Address Line 2
- City
- State/Province
- Country
- ZIP/Postal Code

### Professional Information
- Current Role
- Years of Experience
- Notice Period (in days)
- Current Salary
- Expected Salary

### Professional Links
- LinkedIn Profile
- GitHub Profile
- Portfolio Website
- LeetCode Profile
- HackerRank Profile
- Personal Website

### Work Preferences
- Work Mode (Remote, Hybrid, On-site)
- Preferred Locations
- Seniority Level
- Professional Bio

## 🏗️ Architecture

### Core Files

```
src/lib/profile/
├── use-profile.ts           # Main hook with auto-save logic
└── profile-validator.ts     # Field validation rules

src/types/
└── profile.ts               # TypeScript type definitions

src/components/profile/
├── ProfilePersonalInfo.tsx  # Personal details form
├── ProfileAddress.tsx       # Address form
├── ProfileProfessional.tsx  # Professional details form
├── ProfileLinks.tsx         # Social/professional links
└── ProfilePreferences.tsx   # Work preferences form

src/pages/
└── Profile.tsx              # Main profile page
```

## 🔄 Auto-Save Flow

```
User Edits Field
    ↓
Field Validation (Real-time)
    ↓
UI Updates Immediately
    ↓
Debounce 1 Second
    ↓
Database Update (Supabase)
    ↓
Save Confirmation
```

### Debounce Strategy
- 1-second delay after user stops typing
- Prevents excessive database writes
- Smooth user experience without "Save" button
- Multiple field edits debounced together

## 🧪 Validation

### Real-Time Validation

All fields are validated in real-time as users type:

```typescript
import { profileValidator } from '@/lib/profile/profile-validator'

// Email validation
profileValidator.email('user@example.com') // undefined (valid)

// Phone validation
profileValidator.phone('+1 555-123-4567') // undefined (valid)

// Salary validation
profileValidator.salary(100000) // undefined (valid)

// Years of experience
profileValidator.yearsOfExperience(5) // undefined (valid)
```

### Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| Email | Valid email format | "Please enter a valid email address" |
| Phone | Min 10 chars, valid chars | "Phone number must be at least 10 characters" |
| Name | 2-100 characters | "Name must be at least 2 characters" |
| URL | Valid HTTP(S) URL | "Please enter a valid URL..." |
| Salary | 0-999,999,999 | "Salary cannot be negative" |
| Experience | 0-70 years | "Years of experience seems too high" |
| ZIP Code | 3-10 chars | "Please enter a valid ZIP/Postal code" |
| Location | 2-50 characters | "Location must be at least 2 characters" |
| Bio | Max 500 characters | "Bio must not exceed 500 characters" |

## 📱 Usage

### In React Components

```typescript
import { useProfile } from '@/lib/profile/use-profile'

export function MyComponent() {
  const {
    profile,           // Current profile data
    isLoading,         // Loading state
    autoSaveState,     // Auto-save status
    validationErrors,  // Field errors
    updateProfileField,// Update single field
    updateProfileFields,// Update multiple fields
    refetch,           // Refresh from DB
  } = useProfile()

  const handleNameChange = (name: string) => {
    updateProfileField('firstName', name)
  }

  return (
    <input
      value={profile?.firstName || ''}
      onChange={(e) => handleNameChange(e.target.value)}
    />
  )
}
```

### Auto-Save Status

```typescript
const { autoSaveState } = useProfile()

// Check if saving
if (autoSaveState.isSaving) {
  console.log('Saving...')
}

// Get last saved time
if (autoSaveState.lastSavedAt) {
  console.log('Last saved at:', autoSaveState.lastSavedAt)
}

// Handle errors
if (autoSaveState.error) {
  console.error('Save failed:', autoSaveState.error)
}
```

### Profile Completion

```typescript
const { profile } = useProfile()

// Get completion percentage
const completion = profile?.profileCompletionPercentage // 0-100

// Display progress
console.log(`Profile is ${completion}% complete`)
```

## 🔐 Data Security

### Row-Level Security
- Users can only access their own profile
- Database enforces `WHERE auth.uid() = user_id`
- No cross-user data access possible

### Token Management
- Supabase handles session tokens
- Automatic token refresh
- Secure token storage

### Field Validation
- Client-side validation for UX
- Server-side validation by Supabase
- No direct SQL access

## 📊 Profile Completion Calculation

Profile completion is calculated based on key fields:

```typescript
Fields counted:
- firstName
- lastName
- phone
- currentRole
- yearsOfExperience
- currentSalary
- expectedSalary
- city
- country

Percentage = (Filled Fields / Total Fields) * 100
```

## 🎯 User Experience

### Status Indicators

**Saving State**
```
🔄 Saving your changes...
```

**Saved State**
```
✅ All changes saved • Last saved at 2:30 PM
```

**Error State**
```
⚠️ Failed to save: [error message]
```

**Profile Completion**
```
Progress Bar: [████████░░░░░░░░░░] 45% complete
```

### Field Feedback

- Red border indicates validation error
- Error message displayed below field
- Validation runs as user types
- No blocking prevents input

## 🚀 API Integration

### Supabase Upsert

```typescript
// Profile is automatically upverted (update or insert)
const { error } = await supabase
  .from('profiles')
  .upsert(profileData, { onConflict: 'user_id' })
```

### Data Mapping

```typescript
// Frontend → Database
{
  firstName → first_name
  lastName → last_name
  addressLine1 → address_line_1
  addressLine2 → address_line_2
  zipCode → zip_code
  currentRole → current_role
  yearsOfExperience → years_of_experience
  noticePeriodDays → notice_period_days
  currentSalary → current_salary
  expectedSalary → expected_salary
  linkedinUrl → linkedin_url
  githubUrl → github_url
  portfolioUrl → portfolio_url
  leetcodeUrl → leetcode_url
  hackerrankUrl → hackerrank_url
  websiteUrl → website_url
  preferredLocations → preferred_locations
  workModePreferences → work_mode_preferences
  jobCategories → job_categories
  seniorityLevel → seniority_level
  profileCompletionPercentage → profile_completion_percentage
}
```

## 📋 Profile Page Structure

```
/profile
├── Header
│  └── "Profile Settings"
├── Status Messages
│  ├── Saving indicator
│  ├── Success message
│  └── Error message
├── Profile Completion Bar
│  └── Visual progress (0-100%)
└── Form Sections
   ├── Personal Information
   ├── Address
   ├── Professional Information
   ├── Professional Links
   └── Work Preferences
```

## 🧩 Integration with Other Features

### Chrome Extension
- Profile shared with extension
- Same database tables used
- Data synchronized in real-time

### Dashboard
- Profile completion shown
- Quick link to edit profile
- Profile data used for matching

### Applications
- Resume linked from profile
- Current role shown
- Salary expectations used

## 🔗 Navigation

Add profile link to navbar/menu:

```typescript
<Link to="/profile">
  <Settings className="h-4 w-4" />
  Profile
</Link>
```

## 🧪 Testing the Profile System

### Test Auto-Save

1. Go to `/profile`
2. Change any field (e.g., first name)
3. Observe "Saving..." message
4. Wait for success message
5. Refresh page - data persists

### Test Validation

1. Go to `/profile`
2. Enter invalid email
3. See red border and error message
4. Correct the email
5. Error disappears

### Test Profile Completion

1. Leave most fields empty
2. Note low completion percentage
3. Fill in 5-6 key fields
4. Watch completion percentage increase

### Test Mobile Responsiveness

1. Open `/profile` on mobile
2. All sections should be readable
3. Forms should be responsive
4. Save functionality works on mobile

## ❓ FAQ

**Q: Why is my profile not saving?**
A: Check your internet connection and ensure you're logged in. Errors appear in red alerts at the top.

**Q: Can I save multiple fields at once?**
A: Yes, use `updateProfileFields()` to batch updates. Each change still debounces for 1 second.

**Q: How often is the profile saved?**
A: Every 1 second after you stop typing. Each field change triggers a new 1-second timer.

**Q: What if I close the page before it saves?**
A: The system saves immediately upon detecting a field change. If you close within 1 second, the change may be lost (debounce period).

**Q: Can I edit email in the profile?**
A: No, email is managed in account settings for security. Use Auth settings to change email.

**Q: How is profile completion calculated?**
A: Based on 9 key fields (name, phone, role, experience, salary, city, country, etc.). Each field counts as ~11%.

**Q: Will my data sync to the Chrome Extension?**
A: Yes, the same database is used. Extension can access your profile immediately.

**Q: What validation happens?**
A: URL format, email format, phone length, salary range, experience range, and text length limits.

**Q: Is validation only client-side?**
A: No, Supabase also validates on server-side before saving.

## 📝 Future Enhancements

- [ ] Profile picture upload
- [ ] Resume upload from profile
- [ ] Skills management
- [ ] Social media verification
- [ ] Profile visibility settings
- [ ] Export profile as PDF
- [ ] Profile templates
- [ ] Automatic profile scoring

## 🔗 Related Documentation

- [Authentication System](./SUPABASE_AUTH_IMPLEMENTATION.md)
- [Database Schema](./DATABASE_README.md)
- [Chrome Extension Integration](./PRODUCTION_READINESS.md)
