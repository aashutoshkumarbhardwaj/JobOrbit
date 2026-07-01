/**
 * Professional Info Section
 * Role, experience, notice period, salary
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import type { FullProfile, ProfileValidationErrors } from '@/types/profile'

interface ProfessionalProps {
  profile: FullProfile | null
  validationErrors: ProfileValidationErrors
  onFieldChange: (field: keyof FullProfile, value: any) => void
}

export function ProfileProfessional({ profile, validationErrors, onFieldChange }: ProfessionalProps) {
  if (!profile) return null

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Professional Information</h3>
        <p className="text-sm text-muted-foreground">Your career details and expectations</p>
      </div>

      {/* Current Role */}
      <div className="space-y-2">
        <Label htmlFor="currentRole">Current Role</Label>
        <Input
          id="currentRole"
          value={profile.currentRole || ''}
          onChange={(e) => onFieldChange('currentRole', e.target.value || null)}
          placeholder="Senior Software Engineer"
        />
      </div>

      {/* Years of Experience */}
      <div className="space-y-2">
        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
        <Input
          id="yearsOfExperience"
          type="number"
          min="0"
          max="70"
          value={profile.yearsOfExperience || ''}
          onChange={(e) =>
            onFieldChange('yearsOfExperience', e.target.value ? parseInt(e.target.value, 10) : null)
          }
          placeholder="5"
          className={validationErrors.yearsOfExperience ? 'border-red-500' : ''}
        />
        {validationErrors.yearsOfExperience && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.yearsOfExperience}
          </div>
        )}
      </div>

      {/* Notice Period */}
      <div className="space-y-2">
        <Label htmlFor="noticePeriodDays">Notice Period (in days)</Label>
        <Input
          id="noticePeriodDays"
          type="number"
          min="0"
          max="365"
          value={profile.noticePeriodDays || ''}
          onChange={(e) =>
            onFieldChange('noticePeriodDays', e.target.value ? parseInt(e.target.value, 10) : null)
          }
          placeholder="30"
          className={validationErrors.noticePeriodDays ? 'border-red-500' : ''}
        />
        {validationErrors.noticePeriodDays && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.noticePeriodDays}
          </div>
        )}
      </div>

      {/* Current Salary */}
      <div className="space-y-2">
        <Label htmlFor="currentSalary">Current Salary</Label>
        <Input
          id="currentSalary"
          type="number"
          min="0"
          value={profile.currentSalary || ''}
          onChange={(e) =>
            onFieldChange('currentSalary', e.target.value ? parseFloat(e.target.value) : null)
          }
          placeholder="0"
          className={validationErrors.currentSalary ? 'border-red-500' : ''}
        />
        {validationErrors.currentSalary && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.currentSalary}
          </div>
        )}
      </div>

      {/* Expected Salary */}
      <div className="space-y-2">
        <Label htmlFor="expectedSalary">Expected Salary</Label>
        <Input
          id="expectedSalary"
          type="number"
          min="0"
          value={profile.expectedSalary || ''}
          onChange={(e) =>
            onFieldChange('expectedSalary', e.target.value ? parseFloat(e.target.value) : null)
          }
          placeholder="0"
          className={validationErrors.expectedSalary ? 'border-red-500' : ''}
        />
        {validationErrors.expectedSalary && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.expectedSalary}
          </div>
        )}
      </div>
    </Card>
  )
}
