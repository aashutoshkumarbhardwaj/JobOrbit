/**
 * Validation Schemas
 * Zod schemas for all forms and API inputs
 */

import { z } from 'zod'

/**
 * Common validation rules
 */
const COMMON = {
  // UUID validation
  uuid: z
    .string()
    .uuid('Invalid ID format'),
  
  // Email validation
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  
  // URL validation
  url: z
    .string()
    .url('Invalid URL format'),
  
  // Phone validation
  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Invalid phone number format'
    )
    .optional()
    .nullable(),
  
  // Date validation
  date: z
    .string()
    .datetime('Invalid date format'),
  
  // Required string
  requiredString: z
    .string()
    .min(1, 'This field is required'),
  
  // Optional string
  optionalString: z
    .string()
    .optional()
    .nullable(),
}

/**
 * Profile validation schemas
 */
export const profileSchemas = {
  // Profile update
  update: z.object({
    full_name: COMMON.optionalString,
    email: z
      .string()
      .email()
      .optional()
      .nullable(),
    phone: COMMON.phone,
    location: COMMON.optionalString,
    bio: COMMON.optionalString,
    avatar_url: z
      .string()
      .url()
      .optional()
      .nullable(),
  }),
}

export type ProfileUpdate = z.infer<typeof profileSchemas.update>

/**
 * Resume validation schemas
 */
export const resumeSchemas = {
  // Resume upload
  create: z.object({
    filename: z
      .string()
      .min(1, 'Filename is required')
      .max(255, 'Filename must be less than 255 characters'),
    file: z
      .instanceof(File)
      .or(z.instanceof(Blob)),
    is_primary: z.boolean().optional(),
  }),
  
  // Resume update
  update: z.object({
    filename: COMMON.optionalString,
    is_primary: z.boolean().optional(),
  }),
}

export type ResumeCreate = z.infer<typeof resumeSchemas.create>
export type ResumeUpdate = z.infer<typeof resumeSchemas.update>

/**
 * AI Answer validation schemas
 */
export const answerSchemas = {
  // Create answer
  create: z.object({
    question: z
      .string()
      .min(5, 'Question must be at least 5 characters')
      .max(500, 'Question must be less than 500 characters'),
    answer: z
      .string()
      .min(10, 'Answer must be at least 10 characters')
      .max(5000, 'Answer must be less than 5000 characters'),
    category: z
      .string()
      .optional(),
  }),
  
  // Update answer
  update: z.object({
    question: z
      .string()
      .min(5)
      .max(500)
      .optional(),
    answer: z
      .string()
      .min(10)
      .max(5000)
      .optional(),
    category: COMMON.optionalString,
    is_favorite: z.boolean().optional(),
  }),
}

export type AnswerCreate = z.infer<typeof answerSchemas.create>
export type AnswerUpdate = z.infer<typeof answerSchemas.update>

/**
 * Application validation schemas
 */
export const applicationSchemas = {
  // Create application
  create: z.object({
    company: z
      .string()
      .min(1, 'Company name is required')
      .max(255, 'Company name must be less than 255 characters'),
    role: z
      .string()
      .min(1, 'Job role is required')
      .max(255, 'Job role must be less than 255 characters'),
    status: z
      .enum(['applied', 'interviewing', 'rejected', 'offered', 'accepted'])
      .optional(),
    applied_date: z
      .string()
      .datetime()
      .optional()
      .nullable(),
    location: COMMON.optionalString,
    salary: COMMON.optionalString,
    url: z
      .string()
      .url()
      .optional()
      .nullable(),
    notes: COMMON.optionalString,
    source: COMMON.optionalString,
    job_description: COMMON.optionalString,
    requirements: COMMON.optionalString,
  }),
  
  // Update application
  update: z.object({
    company: z.string().max(255).optional(),
    role: z.string().max(255).optional(),
    status: z
      .enum(['applied', 'interviewing', 'rejected', 'offered', 'accepted'])
      .optional(),
    applied_date: z
      .string()
      .datetime()
      .optional()
      .nullable(),
    interview_date: z
      .string()
      .datetime()
      .optional()
      .nullable(),
    location: COMMON.optionalString,
    salary: COMMON.optionalString,
    url: z
      .string()
      .url()
      .optional()
      .nullable(),
    notes: COMMON.optionalString,
    source: COMMON.optionalString,
    job_description: COMMON.optionalString,
    requirements: COMMON.optionalString,
    extension_saved: z.boolean().optional(),
  }),
}

export type ApplicationCreate = z.infer<typeof applicationSchemas.create>
export type ApplicationUpdate = z.infer<typeof applicationSchemas.update>

/**
 * Settings validation schemas
 */
export const settingsSchemas = {
  // Update settings
  update: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    notifications_enabled: z.boolean().optional(),
    auto_sync_enabled: z.boolean().optional(),
    extension_enabled: z.boolean().optional(),
    oauth_providers: z.record(z.unknown()).optional(),
  }),
}

export type SettingsUpdate = z.infer<typeof settingsSchemas.update>

/**
 * Authentication validation schemas
 */
export const authSchemas = {
  // OAuth token exchange
  oauthExchange: z.object({
    code: z.string().min(1, 'Authorization code is required'),
    provider: z.enum(['google', 'github', 'microsoft']),
    redirectUri: z.string().url('Invalid redirect URI'),
  }),
  
  // Token refresh
  refreshToken: z.object({
    refresh_token: z.string().min(1, 'Refresh token is required'),
  }),
}

export type OAuthExchange = z.infer<typeof authSchemas.oauthExchange>
export type RefreshToken = z.infer<typeof authSchemas.refreshToken>

/**
 * Validation utility functions
 */

/**
 * Validate data against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Validate data safely, returning errors instead of throwing
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Get validation error messages
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    errors[path] = issue.message
  })
  return errors
}
