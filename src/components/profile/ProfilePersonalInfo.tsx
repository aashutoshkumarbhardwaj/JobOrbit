/**
 * Personal Info Section
 * First name, last name, email, phone
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import type { FullProfile, ProfileValidationErrors } from '@/types/profile'

interface PersonalInfoProps {
  profile: FullProfile | null
  validationErrors: ProfileValidationErrors
  onFieldChange: (field: keyof FullProfile, value: any) => void
}

export function ProfilePersonalInfo({
  profile,
  validationErrors,
  onFieldChange,
}: PersonalInfoProps) {
  if (!profile) return null

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <p className="text-sm text-muted-foreground">Basic details about you</p>
      </div>

      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          value={profile.firstName || ''}
          onChange={(e) => onFieldChange('firstName', e.target.value || null)}
          placeholder="John"
          className={validationErrors.firstName ? 'border-red-500' : ''}
        />
        {validationErrors.firstName && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.firstName}
          </div>
        )}
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={profile.lastName || ''}
          onChange={(e) => onFieldChange('lastName', e.target.value || null)}
          placeholder="Doe"
          className={validationErrors.lastName ? 'border-red-500' : ''}
        />
        {validationErrors.lastName && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.lastName}
          </div>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={profile.email || ''}
          placeholder="john@example.com"
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">Email is managed through your account settings</p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={profile.phone || ''}
          onChange={(e) => onFieldChange('phone', e.target.value || null)}
          placeholder="+1 (555) 123-4567"
          className={validationErrors.phone ? 'border-red-500' : ''}
        />
        {validationErrors.phone && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.phone}
          </div>
        )}
      </div>
    </Card>
  )
}
