/**
 * AI Answers API Endpoints
 * Handles AI-generated interview answers
 */

import { apiClient } from '../client'

export interface AIAnswerResponse {
  id: string
  user_id: string
  question: string
  answer: string
  category: string
  is_favorite: boolean
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
}

export interface CreateAnswerPayload {
  question: string
  answer: string
  category?: string
}

export interface UpdateAnswerPayload {
  question?: string
  answer?: string
  category?: string
  is_favorite?: boolean
}

/**
 * Get all AI answers for current user
 */
export async function getAnswers(
  category?: string
): Promise<AIAnswerResponse[]> {
  return apiClient.get<AIAnswerResponse[]>('/answers', {
    params: category ? { category } : undefined,
  })
}

/**
 * Get answer by ID
 */
export async function getAnswerById(answerId: string): Promise<AIAnswerResponse> {
  return apiClient.get<AIAnswerResponse>(`/answers/${answerId}`)
}

/**
 * Create new AI answer
 */
export async function createAnswer(
  payload: CreateAnswerPayload
): Promise<AIAnswerResponse> {
  return apiClient.post<AIAnswerResponse>('/answers', payload)
}

/**
 * Update AI answer
 */
export async function updateAnswer(
  answerId: string,
  payload: UpdateAnswerPayload
): Promise<AIAnswerResponse> {
  return apiClient.patch<AIAnswerResponse>(`/answers/${answerId}`, payload)
}

/**
 * Delete AI answer
 */
export async function deleteAnswer(answerId: string): Promise<void> {
  await apiClient.delete<void>(`/answers/${answerId}`)
}

/**
 * Mark answer as favorite
 */
export async function markAnswerAsFavorite(answerId: string): Promise<AIAnswerResponse> {
  return apiClient.patch<AIAnswerResponse>(`/answers/${answerId}`, {
    is_favorite: true,
  })
}

/**
 * Unmark answer as favorite
 */
export async function unmarkAnswerAsFavorite(answerId: string): Promise<AIAnswerResponse> {
  return apiClient.patch<AIAnswerResponse>(`/answers/${answerId}`, {
    is_favorite: false,
  })
}

/**
 * Get favorite answers
 */
export async function getFavoriteAnswers(): Promise<AIAnswerResponse[]> {
  return apiClient.get<AIAnswerResponse[]>('/answers?is_favorite=true')
}
