/**
 * Application Types
 * Types for job applications
 */

import { UserEntity, ApplicationStatus } from './common'

/**
 * Application entity
 */
export interface Application extends UserEntity {
  company: string
  role: string
  status: ApplicationStatus
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
}

/**
 * Application create payload
 */
export interface ApplicationCreate {
  company: string
  role: string
  status?: ApplicationStatus
  applied_date?: string
  location?: string
  salary?: string
  url?: string
  notes?: string
  source?: string
  job_description?: string
  requirements?: string
}

/**
 * Application update payload
 */
export interface ApplicationUpdate {
  company?: string
  role?: string
  status?: ApplicationStatus
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

/**
 * Application filter options
 */
export interface ApplicationFilters {
  status?: ApplicationStatus | ApplicationStatus[]
  company?: string
  location?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

/**
 * Application with computed properties
 */
export interface ApplicationWithDetails extends Application {
  daysOpen: number
  daysUntilInterview: number | null
  isRecentlyUpdated: boolean
}

/**
 * Application statistics
 */
export interface ApplicationStats {
  total: number
  byStatus: Record<ApplicationStatus, number>
  recentCount: number
  conversionRate: number
}

/**
 * Status labels
 */
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  interviewing: 'Interviewing',
  rejected: 'Rejected',
  offered: 'Offered',
  accepted: 'Accepted',
}

/**
 * Status colors (for UI)
 */
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'blue',
  interviewing: 'purple',
  rejected: 'red',
  offered: 'green',
  accepted: 'emerald',
}

/**
 * Get label for status
 */
export function getStatusLabel(status: ApplicationStatus): string {
  return STATUS_LABELS[status] || status
}

/**
 * Get color for status
 */
export function getStatusColor(status: ApplicationStatus): string {
  return STATUS_COLORS[status] || 'gray'
}

/**
 * Calculate days since applied
 */
export function getDaysOpen(appliedDate: string | null): number {
  if (!appliedDate) return 0
  const now = new Date()
  const applied = new Date(appliedDate)
  const diff = now.getTime() - applied.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Calculate days until interview
 */
export function getDaysUntilInterview(interviewDate: string | null): number | null {
  if (!interviewDate) return null
  const now = new Date()
  const interview = new Date(interviewDate)
  const diff = interview.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days
}

/**
 * Check if recently updated (within 7 days)
 */
export function isRecentlyUpdated(updatedAt: string): boolean {
  const now = new Date()
  const updated = new Date(updatedAt)
  const diff = now.getTime() - updated.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return days < 7
}

/**
 * Create application with computed properties
 */
export function createApplicationWithDetails(
  application: Application
): ApplicationWithDetails {
  return {
    ...application,
    daysOpen: getDaysOpen(application.applied_date),
    daysUntilInterview: getDaysUntilInterview(application.interview_date),
    isRecentlyUpdated: isRecentlyUpdated(application.updated_at),
  }
}

/**
 * Calculate statistics from applications list
 */
export function calculateStats(applications: Application[]): ApplicationStats {
  const byStatus: Record<ApplicationStatus, number> = {
    applied: 0,
    interviewing: 0,
    rejected: 0,
    offered: 0,
    accepted: 0,
  }

  let recentCount = 0
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  applications.forEach((app) => {
    byStatus[app.status]++
    if (new Date(app.updated_at) > sevenDaysAgo) {
      recentCount++
    }
  })

  const offered = byStatus.offered + byStatus.accepted
  const total = applications.length
  const conversionRate = total === 0 ? 0 : (offered / total) * 100

  return {
    total,
    byStatus,
    recentCount,
    conversionRate,
  }
}
