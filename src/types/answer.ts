/**
 * AI Answer Types
 * Types for AI-generated interview answers
 */

import { UserEntity } from './common'

/**
 * AI answer entity
 */
export interface AIAnswer extends UserEntity {
  question: string
  answer: string
  category: string
  is_favorite: boolean
  metadata: Record<string, unknown> | null
}

/**
 * AI answer create payload
 */
export interface AnswerCreate {
  question: string
  answer: string
  category?: string
}

/**
 * AI answer update payload
 */
export interface AnswerUpdate {
  question?: string
  answer?: string
  category?: string
  is_favorite?: boolean
}

/**
 * Answer categories
 */
export const ANSWER_CATEGORIES = [
  'behavioral',
  'technical',
  'situational',
  'culture',
  'growth',
  'other',
] as const

export type AnswerCategory = (typeof ANSWER_CATEGORIES)[number]

/**
 * Answer with computed properties
 */
export interface AnswerWithDetails extends AIAnswer {
  wordCount: number
  characterCount: number
  estimatedReadTime: number
}

/**
 * Get word count
 */
export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Get character count
 */
export function getCharacterCount(text: string): number {
  return text.length
}

/**
 * Get estimated read time in seconds
 * Assuming 200 words per minute
 */
export function getEstimatedReadTime(text: string): number {
  const wordCount = getWordCount(text)
  const wordsPerMinute = 200
  return Math.ceil((wordCount / wordsPerMinute) * 60)
}

/**
 * Create answer with computed properties
 */
export function createAnswerWithDetails(answer: AIAnswer): AnswerWithDetails {
  return {
    ...answer,
    wordCount: getWordCount(answer.answer),
    characterCount: getCharacterCount(answer.answer),
    estimatedReadTime: getEstimatedReadTime(answer.answer),
  }
}

/**
 * Is valid answer category
 */
export function isValidCategory(category: string): boolean {
  return ANSWER_CATEGORIES.includes(category as AnswerCategory)
}

/**
 * Normalize category
 */
export function normalizeCategory(category: string): AnswerCategory {
  const normalized = category.toLowerCase()
  if (isValidCategory(normalized)) {
    return normalized as AnswerCategory
  }
  return 'other'
}
