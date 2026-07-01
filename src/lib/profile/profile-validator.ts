/**
 * Profile Validation
 * Validates profile fields in real-time
 */

import type { ProfileValidationErrors } from '@/types/profile'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/
const URL_REGEX = /^https?:\/\/.+/i
const ZIP_CODE_REGEX = /^[a-zA-Z0-9\-\s]{3,10}$/

export const profileValidator = {
  /**
   * Validate email
   */
  email: (value: string | null): string | undefined => {
    if (!value) return undefined
    if (!EMAIL_REGEX.test(value)) {
      return 'Please enter a valid email address'
    }
    return undefined
  },

  /**
   * Validate phone number
   */
  phone: (value: string | null): string | undefined => {
    if (!value) return undefined
    if (value.length < 10) {
      return 'Phone number must be at least 10 characters'
    }
    if (!PHONE_REGEX.test(value)) {
      return 'Phone number contains invalid characters'
    }
    return undefined
  },

  /**
   * Validate name fields
   */
  name: (value: string | null): string | undefined => {
    if (!value) return undefined
    if (value.length < 2) {
      return 'Name must be at least 2 characters'
    }
    if (value.length > 100) {
      return 'Name must not exceed 100 characters'
    }
    return undefined
  },

  /**
   * Validate URL fields
   */
  url: (value: string | null): string | undefined => {
    if (!value) return undefined
    if (!URL_REGEX.test(value)) {
      return 'Please enter a valid URL starting with http:// or https://'
    }
    return undefined
  },

  /**
   * Validate salary fields
   */
  salary: (value: number | null): string | undefined => {
    if (!value) return undefined
    if (value < 0) {
      return 'Salary cannot be negative'
    }
    if (value > 999999999) {
      return 'Salary value is too large'
    }
    return undefined
  },

  /**
   * Validate years of experience
   */
  yearsOfExperience: (value: number | null): string | undefined => {
    if (value === null || value === undefined) return undefined
    if (value < 0) {
      return 'Years of experience cannot be negative'
    }
    if (value > 70) {
      return 'Years of experience seems too high'
    }
    return undefined
  },

  /**
   * Validate notice period
   */
  noticePeriod: (value: number | null): string | undefined => {
    if (!value) return undefined
    if (value < 0) {
      return 'Notice period cannot be negative'
    }
    if (value > 365) {
      return 'Notice period is typically less than 365 days'
    }
    return undefined
  },

  /**
   * Validate zip code
   */
  zipCode: (value: string | null): string | undefined => {
    if (!value) return undefined
    if (!ZIP_CODE_REGEX.test(value)) {
      return 'Please enter a valid ZIP/Postal code'
    }
    return undefined
  },

  /**
   * Validate city/state/country
   */
  location: (value: string | null): string | undefined => {
    if (!value) return undefined
    if (value.length < 2) {
      return 'Location must be at least 2 characters'
    }
    if (value.length > 50) {
      return 'Location must not exceed 50 characters'
    }
    return undefined
  },

  /**
   * Validate bio
   */
  bio: (value: string | null): string | undefined => {
    if (!value) return undefined
    if (value.length > 500) {
      return 'Bio must not exceed 500 characters'
    }
    return undefined
  },

  /**
   * Validate all profile fields
   */
  validateAll: (profile: Record<string, any>): ProfileValidationErrors => {
    const errors: ProfileValidationErrors = {}

    // Personal Info
    if (profile.firstName) {
      errors.firstName = profileValidator.name(profile.firstName)
    }
    if (profile.lastName) {
      errors.lastName = profileValidator.name(profile.lastName)
    }
    if (profile.email) {
      errors.email = profileValidator.email(profile.email)
    }
    if (profile.phone) {
      errors.phone = profileValidator.phone(profile.phone)
    }

    // Address
    if (profile.city) {
      errors.city = profileValidator.location(profile.city)
    }
    if (profile.state) {
      errors.state = profileValidator.location(profile.state)
    }
    if (profile.country) {
      errors.country = profileValidator.location(profile.country)
    }
    if (profile.zipCode) {
      errors.zipCode = profileValidator.zipCode(profile.zipCode)
    }

    // Professional Info
    if (profile.currentSalary !== null && profile.currentSalary !== undefined) {
      errors.currentSalary = profileValidator.salary(profile.currentSalary)
    }
    if (profile.expectedSalary !== null && profile.expectedSalary !== undefined) {
      errors.expectedSalary = profileValidator.salary(profile.expectedSalary)
    }
    if (profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) {
      errors.yearsOfExperience = profileValidator.yearsOfExperience(profile.yearsOfExperience)
    }
    if (profile.noticePeriodDays !== null && profile.noticePeriodDays !== undefined) {
      errors.noticePeriodDays = profileValidator.noticePeriod(profile.noticePeriodDays)
    }

    // Links
    if (profile.linkedinUrl) {
      errors.linkedinUrl = profileValidator.url(profile.linkedinUrl)
    }
    if (profile.githubUrl) {
      errors.githubUrl = profileValidator.url(profile.githubUrl)
    }
    if (profile.portfolioUrl) {
      errors.portfolioUrl = profileValidator.url(profile.portfolioUrl)
    }
    if (profile.leetcodeUrl) {
      errors.leetcodeUrl = profileValidator.url(profile.leetcodeUrl)
    }
    if (profile.hackerrankUrl) {
      errors.hackerrankUrl = profileValidator.url(profile.hackerrankUrl)
    }
    if (profile.websiteUrl) {
      errors.websiteUrl = profileValidator.url(profile.websiteUrl)
    }

    // Bio
    if (profile.bio) {
      errors.bio = profileValidator.bio(profile.bio)
    }

    // Remove undefined errors
    Object.keys(errors).forEach((key) => {
      if (errors[key] === undefined) {
        delete errors[key]
      }
    })

    return errors
  },
}
