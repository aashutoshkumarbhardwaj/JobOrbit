/**
 * Chrome Extension Integration - Database Type Definitions
 * Auto-generated types for all tables in the Supabase database
 */

// ============================================================================
// Extended Profiles Table
// ============================================================================

export interface Profile {
  id: string;
  user_id: string;
  
  // Personal Information
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  
  // Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  
  // Professional
  current_role?: string;
  years_of_experience?: number;
  notice_period_days?: number;
  current_salary?: number;
  expected_salary?: number;
  employment_type?: 'full-time' | 'part-time' | 'contract';
  
  // Social Links
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  leetcode_url?: string;
  hackerrank_url?: string;
  website_url?: string;
  
  // Preferences
  preferred_locations?: string[];
  work_mode_preferences?: ('remote' | 'hybrid' | 'onsite')[];
  job_categories?: string[];
  seniority_level?: 'entry' | 'mid' | 'senior' | 'lead';
  skills?: string[];
  
  // Metadata
  profile_completion_percentage?: number;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'email'>;
export type ProfileUpdate = Partial<ProfileInsert>;

// ============================================================================
// Extended Jobs Table
// ============================================================================

export interface Job {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_url?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: 'full-time' | 'part-time' | 'contract' | 'internship';
  status?: string;
  applied_date?: string;
  notes?: string;
  
  // New fields for Chrome Extension
  cover_letter?: string;
  resume_id?: string;
  extension_id?: string;
  interview_type?: 'phone' | 'video' | 'inperson' | 'other';
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  company_notes?: string;
  job_description?: string;
  employment_type?: 'full-time' | 'part-time' | 'contract';
  
  created_at?: string;
  updated_at?: string;
}

export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at'>;
export type JobUpdate = Partial<JobInsert>;

// ============================================================================
// Resumes Table
// ============================================================================

export interface Resume {
  id: string;
  user_id: string;
  
  title: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type?: 'pdf' | 'docx' | 'txt';
  file_hash?: string;
  
  is_default: boolean;
  preview_text?: string;
  ats_score?: number;
  
  version: number;
  previous_version_id?: string;
  
  created_at?: string;
  updated_at?: string;
}

export type ResumeInsert = Omit<Resume, 'id' | 'created_at' | 'updated_at'>;
export type ResumeUpdate = Partial<Omit<ResumeInsert, 'file_url' | 'file_name' | 'file_size' | 'file_hash'>>;

// ============================================================================
// AI Answers Table
// ============================================================================

export type AnswerCategory = 
  | 'about_yourself'
  | 'why_hire'
  | 'why_this_company'
  | 'leadership'
  | 'conflict_resolution'
  | 'career_goals'
  | 'achievement'
  | 'custom';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface AIAnswer {
  id: string;
  user_id: string;
  
  title: string;
  content: string;
  category?: AnswerCategory;
  tags?: string[];
  difficulty_level?: DifficultyLevel;
  estimated_delivery_seconds?: number;
  
  is_favorite: boolean;
  usage_count: number;
  last_used_at?: string;
  
  created_at?: string;
  updated_at?: string;
}

export type AIAnswerInsert = Omit<AIAnswer, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'is_favorite' | 'last_used_at'>;
export type AIAnswerUpdate = Partial<Omit<AIAnswerInsert, 'content'>>;

// ============================================================================
// User Settings Table
// ============================================================================

export type Theme = 'light' | 'dark' | 'auto';
export type WritingStyle = 'formal' | 'conversational' | 'creative';
export type ResponseLength = 'short' | 'medium' | 'long';

export interface UserSettings {
  id: string;
  user_id: string;
  
  // UI Preferences
  theme: Theme;
  language: string;
  timezone: string;
  date_format: string;
  
  // Extension Settings
  extension_auto_fill: boolean;
  extension_floating_button: boolean;
  extension_auto_save_applications: boolean;
  extension_notifications_enabled: boolean;
  
  // AI Assistant Settings
  ai_writing_style: WritingStyle;
  ai_response_length: ResponseLength;
  ai_auto_insert_answers: boolean;
  preferred_resume_id?: string;
  
  // Notification Settings
  notify_interview_reminders: boolean;
  notify_status_updates: boolean;
  notify_weekly_summary: boolean;
  notify_important_only: boolean;
  
  // Privacy Settings
  allow_analytics: boolean;
  allow_usage_tracking: boolean;
  
  created_at?: string;
  updated_at?: string;
}

export type UserSettingsInsert = Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
export type UserSettingsUpdate = Partial<Omit<UserSettingsInsert, 'user_id'>>;

// ============================================================================
// Sync Logs Table
// ============================================================================

export type SyncSource = 'web' | 'extension';
export type SyncAction = 
  | 'profile_update'
  | 'resume_upload'
  | 'resume_delete'
  | 'answer_create'
  | 'answer_update'
  | 'answer_delete'
  | 'application_create'
  | 'application_update'
  | 'application_delete'
  | 'settings_update';
export type SyncEntityType = 'profile' | 'resume' | 'answer' | 'application' | 'settings';
export type SyncStatus = 'success' | 'failed' | 'pending';

export interface SyncLog {
  id: string;
  user_id: string;
  
  source: SyncSource;
  action: SyncAction;
  entity_type: SyncEntityType;
  entity_id?: string;
  
  data: Record<string, unknown>;
  status: SyncStatus;
  error_message?: string;
  
  sync_duration_ms?: number;
  created_at?: string;
}

export type SyncLogInsert = Omit<SyncLog, 'id' | 'created_at'>;

// ============================================================================
// Guest Data Table
// ============================================================================

export type MigrationStatus = 'pending' | 'completed' | 'failed';

export interface GuestData {
  id: string;
  user_id: string;
  
  resumes?: unknown;
  answers?: unknown;
  settings?: unknown;
  applications?: unknown;
  profile?: unknown;
  
  migrated_at?: string;
  migration_status: MigrationStatus;
  
  created_at?: string;
}

export type GuestDataInsert = Omit<GuestData, 'id' | 'created_at' | 'migrated_at'>;
export type GuestDataUpdate = Partial<Omit<GuestDataInsert, 'user_id'>>;

// ============================================================================
// Union Types for API Responses
// ============================================================================

export type AnyEntity = Profile | Job | Resume | AIAnswer | UserSettings | SyncLog | GuestData;

export interface DatabaseSchema {
  profiles: Profile;
  jobs: Job;
  resumes: Resume;
  ai_answers: AIAnswer;
  user_settings: UserSettings;
  sync_logs: SyncLog;
  guest_data: GuestData;
}
