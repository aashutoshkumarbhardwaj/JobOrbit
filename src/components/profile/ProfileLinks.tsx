/**
 * Social & Professional Links Section
 * LinkedIn, GitHub, Portfolio, LeetCode, HackerRank
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle, Linkedin, Github, Globe, Code2, Database } from 'lucide-react'
import type { FullProfile, ProfileValidationErrors } from '@/types/profile'

interface LinksProps {
  profile: FullProfile | null
  validationErrors: ProfileValidationErrors
  onFieldChange: (field: keyof FullProfile, value: any) => void
}

export function ProfileLinks({ profile, validationErrors, onFieldChange }: LinksProps) {
  if (!profile) return null

  const linkFields = [
    {
      field: 'linkedinUrl' as const,
      label: 'LinkedIn Profile',
      placeholder: 'https://linkedin.com/in/yourprofile',
      icon: Linkedin,
    },
    {
      field: 'githubUrl' as const,
      label: 'GitHub Profile',
      placeholder: 'https://github.com/username',
      icon: Github,
    },
    {
      field: 'portfolioUrl' as const,
      label: 'Portfolio Website',
      placeholder: 'https://yourportfolio.com',
      icon: Globe,
    },
    {
      field: 'leetcodeUrl' as const,
      label: 'LeetCode Profile',
      placeholder: 'https://leetcode.com/username',
      icon: Code2,
    },
    {
      field: 'hackerrankUrl' as const,
      label: 'HackerRank Profile',
      placeholder: 'https://hackerrank.com/username',
      icon: Database,
    },
    {
      field: 'websiteUrl' as const,
      label: 'Personal Website',
      placeholder: 'https://yourwebsite.com',
      icon: Globe,
    },
  ]

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Professional Links</h3>
        <p className="text-sm text-muted-foreground">Connect your profiles and portfolios</p>
      </div>

      <div className="space-y-6">
        {linkFields.map(({ field, label, placeholder, icon: Icon }) => (
          <div key={field} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={field} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </Label>
            </div>
            <Input
              id={field}
              type="url"
              value={profile[field] || ''}
              onChange={(e) => onFieldChange(field, e.target.value || null)}
              placeholder={placeholder}
              className={validationErrors[field] ? 'border-red-500' : ''}
            />
            {validationErrors[field] && (
              <div className="flex items-center gap-2 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {validationErrors[field]}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
