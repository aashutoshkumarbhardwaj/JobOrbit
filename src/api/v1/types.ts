/**
 * API Response Types
 * Defines the structure of all API responses
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: {
    requestId?: string
    timestamp?: string
  }
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
  field?: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationMeta
}

export interface ApiRequestConfig {
  headers?: Record<string, string>
  params?: Record<string, unknown>
  body?: unknown
  timeout?: number
}

export class ApiErrorClass extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
