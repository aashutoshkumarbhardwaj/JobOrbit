/**
 * User Profile Page
 * Complete profile management with auto-save
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { useProfile } from '@/lib/profile/use-profile'
import { ProfilePersonalInfo } from '@/components/profile/ProfilePersonalInfo'
import { ProfileAddress } from '@/components/profile/ProfileAddress'
import { ProfileProfessional } from '@/components/profile/ProfileProfessional'
import { ProfileLinks } from '@/components/profile/ProfileLinks'
import { ProfilePreferences } from '@/components/profile/ProfilePreferences'
import type { FullProfile } from '@/types/profile'

export default function Profile() {
  const {
    profile,
    isLoading,
    autoSaveState,
    validationErrors,
    updateProfileField,
    updateProfileFields,
  } = useProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="border-red-200 bg-red-50 max-w-md">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load profile. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleFieldChange = (field: keyof FullProfile, value: any) => {
    updateProfileField(field, value)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your professional profile. Changes are saved automatically.
          </p>
        </div>

        {/* Status Messages */}
        <div className="mb-6 space-y-3">
          {autoSaveState.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{autoSaveState.error}</AlertDescription>
            </Alert>
          )}

          {autoSaveState.isSaving && (
            <Alert className="border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2">
                <LoadingSpinner className="h-4 w-4" />
                <AlertDescription className="text-blue-800">Saving your changes...</AlertDescription>
              </div>
            </Alert>
          )}

          {autoSaveState.lastSavedAt && !autoSaveState.isSaving && !autoSaveState.error && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All changes saved • Last saved at {autoSaveState.lastSavedAt.toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Profile Completion */}
        <div className="mb-8 bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Profile Completion</h3>
              <p className="text-sm text-muted-foreground">
                {profile.profileCompletionPercentage}% complete
              </p>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${profile.profileCompletionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-8">
          {/* Personal Info */}
          <ProfilePersonalInfo
            profile={profile}
            validationErrors={validationErrors}
            onFieldChange={handleFieldChange}
          />

          {/* Address */}
          <ProfileAddress
            profile={profile}
            validationErrors={validationErrors}
            onFieldChange={handleFieldChange}
          />

          {/* Professional */}
          <ProfileProfessional
            profile={profile}
            validationErrors={validationErrors}
            onFieldChange={handleFieldChange}
          />

          {/* Links */}
          <ProfileLinks
            profile={profile}
            validationErrors={validationErrors}
            onFieldChange={handleFieldChange}
          />

          {/* Preferences */}
          <ProfilePreferences profile={profile} onFieldChange={handleFieldChange} />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Your profile is kept up to date and synchronized across all your devices.
          </p>
        </div>
      </div>
    </div>
  )
}
