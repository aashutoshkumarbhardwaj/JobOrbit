/**
 * Sync Types
 * Types for data synchronization tracking
 */

import { UserEntity, SyncEventType, SyncStatus } from './common'

/**
 * Sync log entity
 */
export interface SyncLog extends UserEntity {
  event_type: SyncEventType
  status: SyncStatus
  data: Record<string, unknown> | null
  error_message: string | null
}

/**
 * Sync event payload
 */
export interface SyncEventPayload {
  type: SyncEventType
  entityId: string
  entityType: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Sync statistics
 */
export interface SyncStats {
  total: number
  successful: number
  failed: number
  pending: number
  lastSyncTime: string | null
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  enabled: boolean
  autoSync: boolean
  syncInterval?: number // milliseconds
  batchSize?: number
  retryAttempts?: number
}

/**
 * Default sync config
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  autoSync: true,
  syncInterval: 60000, // 1 minute
  batchSize: 50,
  retryAttempts: 3,
}

/**
 * Get status label
 */
export function getSyncStatusLabel(status: SyncStatus): string {
  const labels: Record<SyncStatus, string> = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
  }
  return labels[status] || status
}

/**
 * Get event type label
 */
export function getEventTypeLabel(eventType: SyncEventType): string {
  const labels: Record<SyncEventType, string> = {
    job_created: 'Job Created',
    job_updated: 'Job Updated',
    job_deleted: 'Job Deleted',
    resume_uploaded: 'Resume Uploaded',
    answer_created: 'Answer Created',
    settings_updated: 'Settings Updated',
  }
  return labels[eventType] || eventType
}

/**
 * Calculate sync statistics
 */
export function calculateSyncStats(logs: SyncLog[]): SyncStats {
  const successful = logs.filter((log) => log.status === 'completed').length
  const failed = logs.filter((log) => log.status === 'failed').length
  const pending = logs.filter((log) => log.status === 'pending').length

  const lastLog = logs.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )[0]

  return {
    total: logs.length,
    successful,
    failed,
    pending,
    lastSyncTime: lastLog?.updated_at || null,
  }
}

/**
 * Should retry sync
 */
export function shouldRetry(
  log: SyncLog,
  retryAttempts: number = 3
): boolean {
  // Don't retry if status is not failed
  if (log.status !== 'failed') {
    return false
  }

  // Count number of times this event was retried
  // This is a simplified check - in production, you'd track attempt count in metadata
  return true
}
