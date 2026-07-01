/**
 * Profile Types
 * Comprehensive type definitions for user profiles
 */

export interface PersonalInfo {
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
}

export interface Address {
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  country: string | null
  zipCode: string | null
}

export interface ProfessionalInfo {
  currentRole: string | null
  yearsOfExperience: number | null
  noticePeriodDays: number | null
  currentSalary: number | null
  expectedSalary: number | null
}

export interface ProfileLinks {
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  leetcodeUrl: string | null
  hackerrankUrl: string | null
  websiteUrl: string | null
}

export interface WorkPreferences {
  preferredLocations: string[]
  workModePreferences: ('Remote' | 'Hybrid' | 'On-site')[]
  jobCategories: string[]
  seniorityLevel: string | null
}

export interface FullProfile extends PersonalInfo, Address, ProfessionalInfo, ProfileLinks, WorkPreferences {
  id: string
  userId: string
  skills: string[]
  bio: string | null
  profileCompletionPercentage: number
  createdAt: string
  updatedAt: string
}

export interface ProfileValidationErrors {
  [key: string]: string | undefined
}

export interface AutoSaveState {
  isSaving: boolean
  lastSavedAt: Date | null
  error: string | null
  hasChanges: boolean
}
