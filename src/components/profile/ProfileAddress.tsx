/**
 * Address Section
 * Address, city, state, country, PIN code
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import type { FullProfile, ProfileValidationErrors } from '@/types/profile'

interface AddressProps {
  profile: FullProfile | null
  validationErrors: ProfileValidationErrors
  onFieldChange: (field: keyof FullProfile, value: any) => void
}

export function ProfileAddress({ profile, validationErrors, onFieldChange }: AddressProps) {
  if (!profile) return null

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Address</h3>
        <p className="text-sm text-muted-foreground">Your location information</p>
      </div>

      {/* Address Line 1 */}
      <div className="space-y-2">
        <Label htmlFor="addressLine1">Address Line 1</Label>
        <Input
          id="addressLine1"
          value={profile.addressLine1 || ''}
          onChange={(e) => onFieldChange('addressLine1', e.target.value || null)}
          placeholder="123 Main Street"
        />
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input
          id="addressLine2"
          value={profile.addressLine2 || ''}
          onChange={(e) => onFieldChange('addressLine2', e.target.value || null)}
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={profile.city || ''}
          onChange={(e) => onFieldChange('city', e.target.value || null)}
          placeholder="New York"
          className={validationErrors.city ? 'border-red-500' : ''}
        />
        {validationErrors.city && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.city}
          </div>
        )}
      </div>

      {/* State */}
      <div className="space-y-2">
        <Label htmlFor="state">State/Province</Label>
        <Input
          id="state"
          value={profile.state || ''}
          onChange={(e) => onFieldChange('state', e.target.value || null)}
          placeholder="New York"
          className={validationErrors.state ? 'border-red-500' : ''}
        />
        {validationErrors.state && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.state}
          </div>
        )}
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={profile.country || ''}
          onChange={(e) => onFieldChange('country', e.target.value || null)}
          placeholder="United States"
          className={validationErrors.country ? 'border-red-500' : ''}
        />
        {validationErrors.country && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.country}
          </div>
        )}
      </div>

      {/* ZIP Code */}
      <div className="space-y-2">
        <Label htmlFor="zipCode">ZIP/Postal Code</Label>
        <Input
          id="zipCode"
          value={profile.zipCode || ''}
          onChange={(e) => onFieldChange('zipCode', e.target.value || null)}
          placeholder="10001"
          className={validationErrors.zipCode ? 'border-red-500' : ''}
        />
        {validationErrors.zipCode && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {validationErrors.zipCode}
          </div>
        )}
      </div>
    </Card>
  )
}
