import { z } from 'zod';
import { PaginationQuerySchema } from './common.schema';

/**
 * -----------------------------------------------------------------------------
 * Canonical Domain Enums (1:1 with youten-ai-core-api / routes.yaml)
 * -----------------------------------------------------------------------------
 */

export const AdminPermissionEnum = z.enum([
  'users:read',
  'users:write',
  'roles:read',
  'roles:write',
  'templates:read',
  'templates:write',
  'ops:read',
  'ops:write',
  'config:read',
  'config:write',
  'moderation:read',
  'moderation:write',
  'analytics:read',
  'audit:read',
]);
export type AdminPermission = z.infer<typeof AdminPermissionEnum>;

export const DLQStageEnum = z.enum([
  'QUEUED',
  'EXTRACTING',
  'TRANSCRIBING',
  'SUMMARIZING',
  'INDEXING',
]);
export type DLQStage = z.infer<typeof DLQStageEnum>;

export const ReportStatusEnum = z.enum([
  'pending',
  'reviewed',
  'resolved',
  'dismissed',
  'PENDING',
  'REVIEWED',
  'RESOLVED',
  'DISMISSED',
]);
export type ReportStatus = z.infer<typeof ReportStatusEnum>;

export const ReportActionEnum = z.enum([
  'DISMISS',
  'SUSPEND_RECORDING',
  'BAN_USER',
]);
export type ReportAction = z.infer<typeof ReportActionEnum>;

/**
 * -----------------------------------------------------------------------------
 * 1. Overview Stats & Cost Oversight
 * -----------------------------------------------------------------------------
 */
export const SystemOverviewStatsSchema = z.object({
  total_users: z.number().int().nonnegative(),
  active_users: z.number().int().nonnegative(),
  total_recordings: z.number().int().nonnegative(),
  completed_recordings: z.number().int().nonnegative(),
  failed_recordings: z.number().int().nonnegative(),
  total_storage_bytes: z.number().int().nonnegative(),
  total_duration_seconds: z.number().nonnegative(),
});

export type SystemOverviewStats = z.infer<typeof SystemOverviewStatsSchema>;

export const CostOversightSchema = z.object({
  total_audio_minutes: z.number().nonnegative(),
  stt_rate_per_minute_usd: z.number().nonnegative().default(0.0043),
  estimated_stt_cost_usd: z.number().nonnegative(),
  estimated_llm_tokens: z.number().int().nonnegative().optional(),
  total_llm_tokens: z.number().int().nonnegative().optional(),
  llm_rate_per_1k_tokens_usd: z.number().nonnegative().default(0.00015),
  estimated_llm_cost_usd: z.number().nonnegative(),
  total_estimated_cost_usd: z.number().nonnegative(),
  currency: z.string().default('USD'),
}).transform((c) => ({
  ...c,
  estimated_llm_tokens: c.estimated_llm_tokens ?? c.total_llm_tokens ?? 0,
  total_llm_tokens: c.total_llm_tokens ?? c.estimated_llm_tokens ?? 0,
}));

export type CostOversight = z.infer<typeof CostOversightSchema>;

/**
 * -----------------------------------------------------------------------------
 * 2. User Management & Quota Overrides
 * -----------------------------------------------------------------------------
 */
export interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  status: string;
  daily_quota?: number;
  daily_quota_minutes: number;
  quota_used_today?: number;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const AdminUserItemSchema: z.ZodType<AdminUserItem> = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  full_name: z.string().optional(),
  status: z.string(),
  daily_quota: z.number().int().optional(),
  daily_quota_minutes: z.number().int().optional(),
  quota_used_today: z.number().int().optional(),
  email_verified: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).transform((u) => ({
  ...u,
  name: u.name || u.full_name || u.email,
  full_name: u.full_name || u.name || u.email,
  daily_quota_minutes: u.daily_quota_minutes ?? u.daily_quota ?? 60,
  daily_quota: u.daily_quota ?? u.daily_quota_minutes ?? 60,
}));

export const AdminListUsersQuerySchema = PaginationQuerySchema.extend({
  status: z.string().optional(),
});

export type AdminListUsersQuery = Partial<z.infer<typeof AdminListUsersQuerySchema>>;

export interface AdminOverrideQuotaRequest {
  daily_quota_override?: number;
  daily_quota_minutes?: number;
}

export const AdminOverrideQuotaRequestSchema = z.object({
  daily_quota_override: z.number().int().min(0).max(10000).optional(),
  daily_quota_minutes: z.number().int().min(0).max(10000).optional(),
}).transform((r) => {
  const quota = r.daily_quota_override ?? r.daily_quota_minutes ?? 60;
  return {
    daily_quota_override: quota,
    daily_quota_minutes: quota,
  };
});

/**
 * -----------------------------------------------------------------------------
 * 3. Roles & RBAC Management
 * -----------------------------------------------------------------------------
 */
export interface AdminRoleItem {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const AdminRoleItemSchema: z.ZodType<AdminRoleItem> = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
  is_system: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export interface AdminCreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
}

export const AdminCreateRoleRequestSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().default(''),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
});

export interface AdminUpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export const AdminUpdateRoleRequestSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

/**
 * -----------------------------------------------------------------------------
 * 4. Prompt Templates & Sandbox
 * -----------------------------------------------------------------------------
 */
export interface AdminTemplateItem {
  id: string;
  category_key: string;
  name?: string;
  display_name: string;
  description?: string;
  prompt?: string;
  system_prompt: string;
  output_schema?: Record<string, unknown>;
  schema_definition?: Record<string, unknown>;
  version: number;
  is_active?: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export const AdminTemplateItemSchema: z.ZodType<AdminTemplateItem> = z.object({
  id: z.string().uuid(),
  category_key: z.string(),
  name: z.string().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
  system_prompt: z.string().optional(),
  output_schema: z.record(z.string(), z.unknown()).optional(),
  schema_definition: z.record(z.string(), z.unknown()).optional(),
  version: z.number().int().default(1),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).transform((t) => ({
  ...t,
  name: t.name || t.display_name || t.category_key,
  display_name: t.display_name || t.name || t.category_key,
  prompt: t.prompt || t.system_prompt || '',
  system_prompt: t.system_prompt || t.prompt || '',
  output_schema: t.output_schema || t.schema_definition || { type: 'object', properties: {} },
  schema_definition: t.schema_definition || t.output_schema || { type: 'object', properties: {} },
  version: t.version,
  is_active: t.is_active ?? t.is_default ?? true,
  is_default: t.is_default ?? t.is_active ?? false,
}));

export interface AdminCreateTemplateRequest {
  category_key: string;
  name?: string;
  display_name?: string;
  description?: string;
  prompt?: string;
  system_prompt?: string;
  output_schema?: Record<string, unknown>;
  schema_definition?: Record<string, unknown>;
  is_active?: boolean;
  is_default?: boolean;
}

export const AdminCreateTemplateRequestSchema = z.object({
  category_key: z.string().min(2, 'Category key required').regex(/^[A-Z0-9_]+$/, 'Category key must be uppercase alphanumeric and underscores'),
  name: z.string().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
  system_prompt: z.string().optional(),
  output_schema: z.record(z.string(), z.unknown()).optional(),
  schema_definition: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
}).transform((t) => ({
  category_key: t.category_key,
  name: t.name || t.display_name || 'Prompt Template',
  display_name: t.display_name || t.name || 'Prompt Template',
  description: t.description || '',
  prompt: t.prompt || t.system_prompt || '',
  system_prompt: t.system_prompt || t.prompt || '',
  output_schema: t.output_schema || t.schema_definition || { type: 'object', properties: {} },
  schema_definition: t.schema_definition || t.output_schema || { type: 'object', properties: {} },
  is_active: t.is_active ?? t.is_default ?? true,
  is_default: t.is_default ?? t.is_active ?? false,
}));

export interface AdminUpdateTemplateRequest {
  name?: string;
  display_name?: string;
  description?: string;
  prompt?: string;
  system_prompt?: string;
  output_schema?: Record<string, unknown>;
  schema_definition?: Record<string, unknown>;
  is_active?: boolean;
  is_default?: boolean;
}

export const AdminUpdateTemplateRequestSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
  system_prompt: z.string().optional(),
  output_schema: z.record(z.string(), z.unknown()).optional(),
  schema_definition: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
}).transform((t) => ({
  name: t.name || t.display_name,
  display_name: t.display_name || t.name,
  description: t.description,
  prompt: t.prompt || t.system_prompt,
  system_prompt: t.system_prompt || t.prompt,
  output_schema: t.output_schema || t.schema_definition,
  schema_definition: t.schema_definition || t.output_schema,
  is_active: t.is_active ?? t.is_default,
  is_default: t.is_default ?? t.is_active,
}));

export interface AdminTestTemplateRequest {
  prompt?: string;
  system_prompt?: string;
  output_schema?: Record<string, unknown>;
  schema_definition?: Record<string, unknown>;
  sample_transcript: string;
}

export const AdminTestTemplateRequestSchema = z.object({
  prompt: z.string().optional(),
  system_prompt: z.string().optional(),
  output_schema: z.record(z.string(), z.unknown()).optional(),
  schema_definition: z.record(z.string(), z.unknown()).optional(),
  sample_transcript: z.string().min(10, 'Sample transcript must be at least 10 characters'),
}).transform((t) => ({
  prompt: t.prompt || t.system_prompt || '',
  output_schema: t.output_schema || t.schema_definition || { type: 'object', properties: {} },
  sample_transcript: t.sample_transcript,
}));

export interface AdminTestTemplateResult {
  output?: Record<string, unknown>;
  latency_ms?: number;
  execution_time_ms?: number;
  tokens_used?: number;
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  raw_output?: string;
  parsed_json?: unknown;
}

export const AdminTestTemplateResultSchema: z.ZodType<AdminTestTemplateResult> = z.object({
  raw_output: z.string().optional(),
  parsed_json: z.unknown().optional(),
  output: z.record(z.string(), z.unknown()).optional(),
  execution_time_ms: z.number().optional(),
  latency_ms: z.number().optional(),
  tokens_used: z.number().optional(),
  token_usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
}).transform((r) => ({
  raw_output: r.raw_output || JSON.stringify(r.output || r.parsed_json || {}),
  parsed_json: r.parsed_json || r.output || {},
  output: r.output || (typeof r.parsed_json === 'object' && r.parsed_json !== null ? (r.parsed_json as Record<string, unknown>) : {}),
  execution_time_ms: r.execution_time_ms ?? r.latency_ms ?? 0,
  latency_ms: r.latency_ms ?? r.execution_time_ms ?? 0,
  tokens_used: r.tokens_used ?? r.token_usage?.total_tokens ?? 0,
  token_usage: r.token_usage ?? { total_tokens: r.tokens_used },
}));

/**
 * -----------------------------------------------------------------------------
 * 5. Ops Console & DLQ Pipeline Monitor
 * -----------------------------------------------------------------------------
 */
export interface AdminDLQItem {
  recording_id: string;
  title: string;
  status: string;
  stage?: DLQStage | string;
  error_code?: string;
  error_message?: string;
  error_reason?: string;
  retry_count: number;
  queue?: string;
  queue_name?: string;
  routing_key?: string;
  failed_at?: string;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  user_email?: string;
}

export const AdminDLQItemSchema: z.ZodType<AdminDLQItem> = z.object({
  recording_id: z.string().min(1),
  queue: z.string().optional(),
  queue_name: z.string().optional(),
  routing_key: z.string().optional(),
  stage: z.string().optional(),
  status: z.string(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  error_reason: z.string().optional(),
  retry_count: z.number().int(),
  failed_at: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  title: z.string(),
  user_name: z.string().optional(),
  user_email: z.string().optional(),
}).transform((item) => ({
  ...item,
  stage: (item.stage || 'TRANSCRIBING') as DLQStage,
  error_message: item.error_message || item.error_reason || 'Pipeline execution failed',
  error_reason: item.error_reason || item.error_message || 'Pipeline execution failed',
  queue_name: item.queue_name || item.queue || 'dlx.audio.pipeline',
  failed_at: item.failed_at || item.created_at || new Date().toISOString(),
}));

export interface AdminRetryDLQRequest {
  recording_id: string;
  stage?: DLQStage | string;
}

export const AdminRetryDLQRequestSchema = z.object({
  recording_id: z.string().min(1, 'Valid recording UUID required'),
  stage: z.string().optional(),
}).transform((r) => {
  let s = (r.stage || 'TRANSCRIBING').toUpperCase();
  if (s === 'AUDIO_EXTRACTION') {
    s = 'EXTRACTING';
  }
  return {
    recording_id: r.recording_id,
    stage: s as DLQStage,
  };
});

/**
 * -----------------------------------------------------------------------------
 * 6. System Configuration & Maintenance Mode
 * -----------------------------------------------------------------------------
 */
export interface AdminSystemConfig {
  maintenance_mode?: boolean;
  is_maintenance_mode: boolean;
  allow_guest_uploads?: boolean;
  bot_waitlist_enabled?: boolean;
  maintenance_message: string;
  feature_flags?: Record<string, boolean>;
}

export const AdminSystemConfigSchema: z.ZodType<AdminSystemConfig> = z.object({
  maintenance_mode: z.boolean().default(false),
  is_maintenance_mode: z.boolean().optional(),
  allow_guest_uploads: z.boolean().default(false),
  bot_waitlist_enabled: z.boolean().default(false),
  maintenance_message: z.string().default('The system is undergoing scheduled infrastructure maintenance.'),
  feature_flags: z.record(z.string(), z.boolean()).default({}),
}).transform((cfg) => ({
  ...cfg,
  maintenance_mode: cfg.maintenance_mode || !!cfg.is_maintenance_mode,
  is_maintenance_mode: cfg.is_maintenance_mode ?? cfg.maintenance_mode ?? false,
  maintenance_message: cfg.maintenance_message || 'The system is undergoing scheduled infrastructure maintenance.',
}));

export interface AdminUpdateSystemConfigRequest {
  maintenance_mode?: boolean;
  is_maintenance_mode?: boolean;
  allow_guest_uploads?: boolean;
  bot_waitlist_enabled?: boolean;
  maintenance_message?: string;
  feature_flags?: Record<string, boolean>;
}

export const AdminUpdateSystemConfigRequestSchema = z.object({
  maintenance_mode: z.boolean().optional(),
  is_maintenance_mode: z.boolean().optional(),
  allow_guest_uploads: z.boolean().optional(),
  bot_waitlist_enabled: z.boolean().optional(),
  maintenance_message: z.string().optional(),
  feature_flags: z.record(z.string(), z.boolean()).optional(),
}).transform((cfg) => ({
  ...cfg,
  maintenance_mode: cfg.maintenance_mode ?? cfg.is_maintenance_mode,
  is_maintenance_mode: cfg.is_maintenance_mode ?? cfg.maintenance_mode,
}));

/**
 * -----------------------------------------------------------------------------
 * 7. Abuse Reports & Moderation
 * -----------------------------------------------------------------------------
 */
export interface AdminReportItem {
  id: string;
  recording_id: string;
  recording_title?: string;
  reporter_type?: string;
  reporter_ref?: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  resolution_note?: string | null;
  resolution_notes?: string | null;
  handled_by?: string;
  handler_name?: string;
  created_at?: string;
  updated_at?: string;
}

export const AdminReportItemSchema: z.ZodType<AdminReportItem> = z.object({
  id: z.string().uuid(),
  recording_id: z.string().uuid(),
  recording_title: z.string().optional(),
  reporter_type: z.string().optional(),
  reporter_ref: z.string().optional(),
  reason: z.string(),
  details: z.string().optional(),
  status: ReportStatusEnum,
  resolution_note: z.string().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
  handled_by: z.string().optional(),
  handler_name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).transform((r) => ({
  ...r,
  status: r.status.toUpperCase() as 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED',
  resolution_note: r.resolution_note ?? r.resolution_notes ?? null,
  resolution_notes: r.resolution_notes ?? r.resolution_note ?? null,
}));

export interface AdminResolveReportRequest {
  action: ReportAction;
  resolution_note?: string;
  resolution_notes?: string;
}

export const AdminResolveReportRequestSchema = z.object({
  action: ReportActionEnum,
  resolution_note: z.string().optional(),
  resolution_notes: z.string().optional(),
}).transform((r) => ({
  action: r.action,
  resolution_note: r.resolution_note || r.resolution_notes || '',
  resolution_notes: r.resolution_notes || r.resolution_note || '',
}));

/**
 * -----------------------------------------------------------------------------
 * 8. Staff Audit Logs
 * -----------------------------------------------------------------------------
 */
export interface AdminAuditLogItem {
  id: string;
  admin_id?: string | null;
  admin_username: string;
  admin_full_name?: string;
  action: string;
  entity?: string;
  entity_type?: string;
  entity_id?: string | null;
  payload?: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export const AdminAuditLogItemSchema: z.ZodType<AdminAuditLogItem> = z.object({
  id: z.string().uuid(),
  admin_id: z.string().uuid().nullable().optional(),
  admin_username: z.string().optional(),
  admin_full_name: z.string().optional(),
  action: z.string(),
  entity: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  created_at: z.string(),
}).transform((l) => ({
  ...l,
  admin_username: l.admin_username || l.admin_full_name || 'superadmin',
  entity: l.entity || l.entity_type || 'SYSTEM',
  entity_type: l.entity_type || l.entity || 'SYSTEM',
}));

export const AdminAuditLogQuerySchema = PaginationQuerySchema.extend({
  action: z.string().optional(),
  admin_id: z.string().uuid().optional(),
  entity_type: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type AdminAuditLogQuery = Partial<z.infer<typeof AdminAuditLogQuerySchema>>;
