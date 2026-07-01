/**
 * Work Preferences Section
 * Preferred locations, work mode, job categories
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Plus } from 'lucide-react'
import type { FullProfile } from '@/types/profile'

interface PreferencesProps {
  profile: FullProfile | null
  onFieldChange: (field: keyof FullProfile, value: any) => void
}

export function ProfilePreferences({ profile, onFieldChange }: PreferencesProps) {
  const [newLocation, setNewLocation] = useState('')

  if (!profile) return null

  const workModes = ['Remote', 'Hybrid', 'On-site'] as const

  const toggleWorkMode = (mode: typeof workModes[number]) => {
    const current = profile.workModePreferences || []
    const updated = current.includes(mode)
      ? current.filter((m) => m !== mode)
      : [...current, mode]
    onFieldChange('workModePreferences', updated)
  }

  const addLocation = () => {
    if (newLocation.trim()) {
      const current = profile.preferredLocations || []
      onFieldChange('preferredLocations', [...current, newLocation.trim()])
      setNewLocation('')
    }
  }

  const removeLocation = (location: string) => {
    const current = profile.preferredLocations || []
    onFieldChange('preferredLocations', current.filter((loc) => loc !== location))
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Work Preferences</h3>
        <p className="text-sm text-muted-foreground">Tell us about your ideal role</p>
      </div>

      {/* Work Mode */}
      <div className="space-y-4">
        <Label>Work Mode</Label>
        <div className="space-y-3">
          {workModes.map((mode) => (
            <div key={mode} className="flex items-center space-x-2">
              <Checkbox
                id={`mode-${mode}`}
                checked={profile.workModePreferences?.includes(mode) || false}
                onCheckedChange={() => toggleWorkMode(mode)}
              />
              <Label htmlFor={`mode-${mode}`} className="font-normal cursor-pointer">
                {mode}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Preferred Locations */}
      <div className="space-y-3">
        <Label>Preferred Locations</Label>
        <div className="flex gap-2">
          <Input
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addLocation()
              }
            }}
            placeholder="Add a city (e.g., New York, San Francisco)"
          />
          <Button onClick={addLocation} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {profile.preferredLocations && profile.preferredLocations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.preferredLocations.map((location) => (
              <div
                key={location}
                className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-sm"
              >
                {location}
                <button
                  onClick={() => removeLocation(location)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seniority Level */}
      <div className="space-y-2">
        <Label htmlFor="seniorityLevel">Seniority Level</Label>
        <select
          id="seniorityLevel"
          value={profile.seniorityLevel || ''}
          onChange={(e) => onFieldChange('seniorityLevel', e.target.value || null)}
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="">Select seniority level</option>
          <option value="internship">Internship</option>
          <option value="entry_level">Entry Level</option>
          <option value="mid_level">Mid Level</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
          <option value="principal">Principal</option>
        </select>
      </div>

      {/* Current Role */}
      <div className="space-y-2">
        <Label htmlFor="currentRole">Current Role</Label>
        <Input
          id="currentRole"
          value={profile.currentRole || ''}
          onChange={(e) => onFieldChange('currentRole', e.target.value || null)}
          placeholder="Software Engineer"
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Professional Bio</Label>
        <textarea
          id="bio"
          value={profile.bio || ''}
          onChange={(e) => onFieldChange('bio', e.target.value || null)}
          placeholder="Tell employers about yourself..."
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none"
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          {profile.bio?.length || 0}/500 characters
        </p>
      </div>
    </Card>
  )
}
