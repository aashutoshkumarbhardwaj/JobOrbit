/**
 * Resumes API Endpoints
 * Handles resume file management
 */

import { apiClient } from '../client'

export interface ResumeResponse {
  id: string
  user_id: string
  filename: string
  file_url: string
  file_size: number
  is_primary: boolean
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
}

export interface CreateResumePayload {
  filename: string
  file: Blob
  is_primary?: boolean
}

export interface UpdateResumePayload {
  filename?: string
  is_primary?: boolean
}

/**
 * Get all resumes for current user
 */
export async function getResumes(): Promise<ResumeResponse[]> {
  return apiClient.get<ResumeResponse[]>('/resumes')
}

/**
 * Get resume by ID
 */
export async function getResumeById(resumeId: string): Promise<ResumeResponse> {
  return apiClient.get<ResumeResponse>(`/resumes/${resumeId}`)
}

/**
 * Create new resume (upload file)
 */
export async function createResume(
  payload: CreateResumePayload
): Promise<ResumeResponse> {
  const formData = new FormData()
  formData.append('file', payload.file, payload.filename)
  formData.append('filename', payload.filename)
  if (payload.is_primary !== undefined) {
    formData.append('is_primary', String(payload.is_primary))
  }

  return apiClient.post<ResumeResponse>('/resumes', formData, {
    headers: {
      // Remove Content-Type to let browser set it with boundary for multipart
      'Content-Type': undefined as any,
    },
  })
}

/**
 * Update resume metadata
 */
export async function updateResume(
  resumeId: string,
  payload: UpdateResumePayload
): Promise<ResumeResponse> {
  return apiClient.patch<ResumeResponse>(`/resumes/${resumeId}`, payload)
}

/**
 * Delete resume
 */
export async function deleteResume(resumeId: string): Promise<void> {
  await apiClient.delete<void>(`/resumes/${resumeId}`)
}

/**
 * Set resume as primary
 */
export async function setPrimaryResume(resumeId: string): Promise<ResumeResponse> {
  return apiClient.patch<ResumeResponse>(`/resumes/${resumeId}`, {
    is_primary: true,
  })
}
