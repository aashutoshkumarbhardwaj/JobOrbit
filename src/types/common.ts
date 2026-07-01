/**
 * Common Types
 * Shared types used across the application
 */

/**
 * Timestamp fields present in all database records
 */
export interface Timestamps {
  created_at: string
  updated_at: string
}

/**
 * Base entity type with ID and timestamps
 */
export interface BaseEntity extends Timestamps {
  id: string
}

/**
 * Base entity with user association
 */
export interface UserEntity extends BaseEntity {
  user_id: string
}

/**
 * API Response metadata
 */
export interface ResponseMeta {
  requestId?: string
  timestamp?: string
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  sort?: string
}

/**
 * Generic list response
 */
export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Status values for applications
 */
export type ApplicationStatus =
  | 'applied'
  | 'interviewing'
  | 'rejected'
  | 'offered'
  | 'accepted'

/**
 * Theme options
 */
export type ThemeType = 'light' | 'dark' | 'system'

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'github' | 'microsoft'

/**
 * File metadata
 */
export interface FileMetadata {
  mimeType: string
  size: number
  lastModified?: number
  path?: string
}

/**
 * Sync event types
 */
export type SyncEventType =
  | 'job_created'
  | 'job_updated'
  | 'job_deleted'
  | 'resume_uploaded'
  | 'answer_created'
  | 'settings_updated'

/**
 * Sync status
 */
export type SyncStatus = 'pending' | 'completed' | 'failed'

/**
 * Nullable helper type
 */
export type Nullable<T> = T | null

/**
 * Optional helper type
 */
export type Optional<T> = T | undefined
