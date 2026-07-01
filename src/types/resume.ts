/**
 * Resume Types
 * Types for resume file management
 */

import { UserEntity, FileMetadata } from './common'

/**
 * Resume entity
 */
export interface Resume extends UserEntity {
  filename: string
  file_url: string
  file_size: number
  is_primary: boolean
  metadata: Record<string, unknown> | null
}

/**
 * Resume create payload
 */
export interface ResumeCreate {
  filename: string
  file: Blob | File
  is_primary?: boolean
}

/**
 * Resume update payload
 */
export interface ResumeUpdate {
  filename?: string
  is_primary?: boolean
}

/**
 * Resume upload options
 */
export interface ResumeUploadOptions {
  maxSize?: number // bytes
  allowedMimes?: string[]
  makePrimary?: boolean
}

/**
 * Resume metadata extended
 */
export interface ResumeWithMetadata extends Resume {
  parsedContent?: string
  pageCount?: number
  language?: string
}

/**
 * Default upload options
 */
export const DEFAULT_RESUME_UPLOAD_OPTIONS: ResumeUploadOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}

/**
 * Check if file is valid resume
 */
export function isValidResumeFile(
  file: File,
  options: ResumeUploadOptions = DEFAULT_RESUME_UPLOAD_OPTIONS
): { valid: boolean; error?: string } {
  if (options.maxSize && file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${options.maxSize / 1024 / 1024}MB limit`,
    }
  }

  if (
    options.allowedMimes &&
    !options.allowedMimes.includes(file.type)
  ) {
    return {
      valid: false,
      error: 'File type not supported. Please upload PDF or DOC/DOCX',
    }
  }

  return { valid: true }
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
