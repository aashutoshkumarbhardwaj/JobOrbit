/**
 * Applications API Endpoints
 * Handles job applications
 */

import { apiClient } from '../client'

export interface ApplicationResponse {
  id: string
  user_id: string
  company: string
  role: string
  status: string
  applied_date: string | null
  interview_date: string | null
  location: string | null
  salary: string | null
  url: string | null
  notes: string | null
  source: string | null
  job_description: string | null
  requirements: string | null
  extension_saved: boolean
  created_at: string
  updated_at: string
}

export interface CreateApplicationPayload {
  company: string
  role: string
  status?: string
  applied_date?: string
  location?: string
  salary?: string
  url?: string
  notes?: string
  source?: string
  job_description?: string
  requirements?: string
}

export interface UpdateApplicationPayload {
  company?: string
  role?: string
  status?: string
  applied_date?: string
  interview_date?: string
  location?: string
  salary?: string
  url?: string
  notes?: string
  source?: string
  job_description?: string
  requirements?: string
  extension_saved?: boolean
}

export interface ApplicationFilters {
  status?: string
  company?: string
  location?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

/**
 * Get all applications for current user
 */
export async function getApplications(
  filters?: ApplicationFilters
): Promise<ApplicationResponse[]> {
  return apiClient.get<ApplicationResponse[]>('/applications', {
    params: filters,
  })
}

/**
 * Get application by ID
 */
export async function getApplicationById(
  applicationId: string
): Promise<ApplicationResponse> {
  return apiClient.get<ApplicationResponse>(`/applications/${applicationId}`)
}

/**
 * Create new application
 */
export async function createApplication(
  payload: CreateApplicationPayload
): Promise<ApplicationResponse> {
  return apiClient.post<ApplicationResponse>('/applications', payload)
}

/**
 * Update application
 */
export async function updateApplication(
  applicationId: string,
  payload: UpdateApplicationPayload
): Promise<ApplicationResponse> {
  return apiClient.patch<ApplicationResponse>(
    `/applications/${applicationId}`,
    payload
  )
}

/**
 * Delete application
 */
export async function deleteApplication(applicationId: string): Promise<void> {
  await apiClient.delete<void>(`/applications/${applicationId}`)
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<ApplicationResponse> {
  return apiClient.patch<ApplicationResponse>(
    `/applications/${applicationId}`,
    { status }
  )
}

/**
 * Get applications by status
 */
export async function getApplicationsByStatus(
  status: string
): Promise<ApplicationResponse[]> {
  return apiClient.get<ApplicationResponse[]>('/applications', {
    params: { status },
  })
}

/**
 * Get recent applications
 */
export async function getRecentApplications(
  limit: number = 10
): Promise<ApplicationResponse[]> {
  return apiClient.get<ApplicationResponse[]>('/applications', {
    params: { limit, sort: '-applied_date' },
  })
}
