/**
 * API v1 - Main Export
 * Exports all API endpoints and utilities
 */

// Client
export { apiClient, default } from './client'

// Types
export type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  PaginatedResponse,
  ApiRequestConfig,
} from './types'
export { ApiErrorClass } from './types'

// Profile Endpoints
export * from './endpoints/profile'

// Resumes Endpoints
export * from './endpoints/resumes'

// Answers Endpoints
export * from './endpoints/answers'

// Applications Endpoints
export * from './endpoints/applications'

// Settings Endpoints
export * from './endpoints/settings'

// Auth Endpoints
export * from './endpoints/auth'
