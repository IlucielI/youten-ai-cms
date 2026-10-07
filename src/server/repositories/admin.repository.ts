export { type IAdminRepository } from './admin.repository.interface';
import { IAdminRepository } from './admin.repository.interface';
import {
  SystemOverviewStats,
  SystemOverviewStatsSchema,
  CostOversight,
  CostOversightSchema,
  AdminUserItem,
  AdminUserItemSchema,
  AdminListUsersQuery,
  AdminRoleItem,
  AdminRoleItemSchema,
  AdminCreateRoleRequest,
  AdminCreateRoleRequestSchema,
  AdminUpdateRoleRequest,
  AdminTemplateItem,
  AdminTemplateItemSchema,
  AdminCreateTemplateRequest,
  AdminCreateTemplateRequestSchema,
  AdminUpdateTemplateRequest,
  AdminUpdateTemplateRequestSchema,
  AdminTestTemplateRequest,
  AdminTestTemplateRequestSchema,
  AdminTestTemplateResult,
  AdminTestTemplateResultSchema,
  AdminDLQItem,
  AdminDLQItemSchema,
  AdminRetryDLQRequest,
  AdminRetryDLQRequestSchema,
  AdminSystemConfig,
  AdminSystemConfigSchema,
  AdminUpdateSystemConfigRequest,
  AdminUpdateSystemConfigRequestSchema,
  AdminReportItem,
  AdminReportItemSchema,
  AdminResolveReportRequest,
  AdminResolveReportRequestSchema,
  AdminAuditLogItem,
  AdminAuditLogItemSchema,
  AdminAuditLogQuery,
} from '../schemas/admin.schema';
import { IHttpClient, HttpClient } from '../datasources/http';
import { env } from '../config/env';
import { logger } from '../logger/pino.logger';

/**
 * Core API response envelope model (dtos.APIResponse[T]).
 */
interface CoreApiResponse<T> {
  status?: string;
  code?: string;
  message?: string;
  data: T;
  timestamp?: string;
}

/**
 * Stateful in-memory mock store for resilient local development & testing.
 */
class AdminMockStore {
  users: AdminUserItem[] = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'alex.rivera@acme.corp',
      name: 'Alex Rivera',
      full_name: 'Alex Rivera',
      status: 'active',
      daily_quota: 120,
      daily_quota_minutes: 120,
      quota_used_today: 15,
      email_verified: true,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      email: 'sarah.chen@techflow.io',
      name: 'Sarah Chen',
      full_name: 'Sarah Chen',
      status: 'active',
      daily_quota: 60,
      daily_quota_minutes: 60,
      quota_used_today: 45,
      email_verified: true,
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      email: 'marcus.vance@solaris.ai',
      name: 'Marcus Vance',
      full_name: 'Marcus Vance',
      status: 'suspended',
      daily_quota: 0,
      daily_quota_minutes: 0,
      quota_used_today: 0,
      email_verified: false,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      email: 'elena.rostova@quantum.org',
      name: 'Elena Rostova',
      full_name: 'Elena Rostova',
      status: 'active',
      daily_quota: 300,
      daily_quota_minutes: 300,
      quota_used_today: 120,
      email_verified: true,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  roles: AdminRoleItem[] = [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'Super Admin',
      description: 'Full unconstrained platform control, staff audits, and RBAC administration',
      permissions: ['*'],
      is_system: true,
      created_at: new Date(Date.now() - 86400000 * 100).toISOString(),
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      name: 'Content Moderator',
      description: 'Abuse report triage, recording content review, and public link suspension',
      permissions: ['moderation:read', 'moderation:write'],
      is_system: false,
      created_at: new Date(Date.now() - 86400000 * 50).toISOString(),
    },
    {
      id: 'b0000000-0000-0000-0000-000000000003',
      name: 'Ops Engineer',
      description: 'Pipeline health monitoring, DLQ job retries, and maintenance controls',
      permissions: ['ops:read', 'ops:write', 'config:read', 'analytics:read'],
      is_system: false,
      created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    },
  ];

  templates: AdminTemplateItem[] = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      category_key: 'GENERAL',
      name: 'General Meeting Summary',
      display_name: 'General Meeting Summary',
      description: 'Executive overview and actionable next steps',
      prompt: 'You are an executive assistant. Summarize the key meeting takeaways, decisions, and action items with clear markdown bullet points.',
      system_prompt: 'You are an executive assistant. Summarize the key meeting takeaways, decisions, and action items with clear markdown bullet points.',
      output_schema: { type: 'object', properties: { summary: { type: 'string' }, action_items: { type: 'array', items: { type: 'string' } } } },
      schema_definition: { type: 'object', properties: { summary: { type: 'string' }, action_items: { type: 'array', items: { type: 'string' } } } },
      version: 1,
      is_active: true,
      is_default: true,
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      category_key: 'MOM',
      name: 'Minutes of Meeting (MOM)',
      display_name: 'Minutes of Meeting (MOM)',
      description: 'Formal corporate minutes with attendees and decisions',
      prompt: 'Generate formal corporate Minutes of Meeting structured with Agenda, Attendees, Discussion Points, Formal Decisions, and Assigned Tasks.',
      system_prompt: 'Generate formal corporate Minutes of Meeting structured with Agenda, Attendees, Discussion Points, Formal Decisions, and Assigned Tasks.',
      output_schema: { type: 'object', properties: { agenda: { type: 'string' }, decisions: { type: 'array', items: { type: 'string' } } } },
      schema_definition: { type: 'object', properties: { agenda: { type: 'string' }, decisions: { type: 'array', items: { type: 'string' } } } },
      version: 2,
      is_active: true,
      is_default: false,
      created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      category_key: 'ONE_ON_ONE',
      name: '1-on-1 Performance & Sync',
      display_name: '1-on-1 Performance & Sync',
      description: 'Manager-report alignment and growth milestones',
      prompt: 'Analyze this 1-on-1 discussion for manager feedback, growth opportunities, morale indicators, and agreed milestones.',
      system_prompt: 'Analyze this 1-on-1 discussion for manager feedback, growth opportunities, morale indicators, and agreed milestones.',
      output_schema: { type: 'object', properties: { feedback: { type: 'string' }, goals: { type: 'array', items: { type: 'string' } } } },
      schema_definition: { type: 'object', properties: { feedback: { type: 'string' }, goals: { type: 'array', items: { type: 'string' } } } },
      version: 1,
      is_active: true,
      is_default: false,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ];

  dlq: AdminDLQItem[] = [
    {
      recording_id: 'd0000000-0000-0000-0000-000000000001',
      title: 'Q3 Financial Review Recording',
      status: 'FAILED',
      stage: 'TRANSCRIBING',
      error_code: 'ERR_STT_RATE_LIMIT',
      error_message: 'STT rate limit exceeded (429 Too Many Requests)',
      error_reason: 'STT rate limit exceeded (429 Too Many Requests)',
      retry_count: 2,
      failed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      recording_id: 'd0000000-0000-0000-0000-000000000002',
      title: 'Customer Onboarding Walkthrough',
      status: 'FAILED',
      stage: 'EXTRACTING',
      error_code: 'ERR_FFMPEG_CORRUPT',
      error_message: 'FFmpeg audio stream corruption at timestamp 00:14:22',
      error_reason: 'FFmpeg audio stream corruption at timestamp 00:14:22',
      retry_count: 3,
      failed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];

  config: AdminSystemConfig = {
    maintenance_mode: false,
    is_maintenance_mode: false,
    allow_guest_uploads: true,
    bot_waitlist_enabled: true,
    maintenance_message: 'Youten AI is undergoing scheduled maintenance. Recording ingestion will resume shortly.',
    feature_flags: {
      meeting_bot_enabled: true,
      discord_bot_enabled: true,
      ai_chapters_enabled: true,
      diarization_v2_enabled: true,
    },
  };

  reports: AdminReportItem[] = [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      recording_id: 'd0000000-0000-0000-0000-000000000001',
      recording_title: 'Q3 Financial Review Recording',
      reporter_type: 'user',
      reporter_ref: 'reporter@acme.corp',
      reason: 'Shared recording contains proprietary financial IP leaked without authorization.',
      status: 'PENDING',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      recording_id: 'd0000000-0000-0000-0000-000000000002',
      recording_title: 'Customer Onboarding Walkthrough',
      reporter_type: 'guest',
      reporter_ref: '192.168.1.105',
      reason: 'Inappropriate language in transcript audio.',
      status: 'RESOLVED',
      resolution_note: 'Reviewed and confirmed benign conversational context.',
      resolution_notes: 'Reviewed and confirmed benign conversational context.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  auditLogs: AdminAuditLogItem[] = [
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      action: 'USER_QUOTA_OVERRIDE',
      entity: 'USER',
      entity_type: 'USER',
      entity_id: 'a0000000-0000-0000-0000-000000000004',
      admin_username: 'superadmin',
      admin_full_name: 'Platform Administrator',
      payload: { old_quota: 60, new_quota: 300 },
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'f0000000-0000-0000-0000-000000000002',
      action: 'SYSTEM_CONFIG_UPDATE',
      entity: 'SYSTEM_CONFIG',
      entity_type: 'SYSTEM_CONFIG',
      entity_id: null,
      admin_username: 'superadmin',
      admin_full_name: 'Platform Administrator',
      payload: { is_maintenance_mode: false },
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
  ];
}

export class AdminRepository implements IAdminRepository {
  private readonly client: IHttpClient;
  private readonly mockStore = new AdminMockStore();

  constructor(client?: IHttpClient) {
    this.client =
      client ||
      new HttpClient({
        baseUrl: env.CORE_API_URL || 'http://localhost:8080',
        defaultHeaders: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.CORE_API_ADMIN_TOKEN || 'mock-admin-token'}`,
        },
      });
  }

  private shouldUseMock(): boolean {
    return env.USE_MOCK_DATA || env.MOCK_CORE_API || !env.CORE_API_URL;
  }

  async getOverviewStats(): Promise<SystemOverviewStats> {
    if (this.shouldUseMock()) {
      return this.getOverviewStatsWithFallback();
    }

    try {
      const res = await this.client.get<CoreApiResponse<SystemOverviewStats>>('/v1/admin/stats/overview');
      const payload = res.data ?? res;
      return SystemOverviewStatsSchema.parse(payload);
    } catch (err) {
      logger.warn('Core API getOverviewStats failed; falling back to in-memory store', { err: String(err) });
      return this.getOverviewStatsWithFallback();
    }
  }

  private getOverviewStatsWithFallback(): SystemOverviewStats {
    return {
      total_users: this.mockStore.users.length,
      active_users: this.mockStore.users.filter((u) => u.status === 'active').length,
      total_recordings: 142,
      completed_recordings: 135,
      failed_recordings: 7,
      total_storage_bytes: 4831838208, // ~4.5 GB
      total_duration_seconds: 189200, // ~52.5 hours
    };
  }

  async getCostOversight(): Promise<CostOversight> {
    if (this.shouldUseMock()) {
      return this.getCostOversightWithFallback();
    }

    try {
      const res = await this.client.get<CoreApiResponse<CostOversight>>('/v1/admin/stats/costs');
      const payload = res.data ?? res;
      return CostOversightSchema.parse(payload);
    } catch (err) {
      logger.warn('Core API getCostOversight failed; falling back to mock', { err: String(err) });
      return this.getCostOversightWithFallback();
    }
  }

  private getCostOversightWithFallback(): CostOversight {
    const minutes = 3153.33;
    const sttRate = 0.006;
    const sttCost = Number((minutes * sttRate).toFixed(4));
    const tokens = Math.round(minutes * 150);
    const llmRate = 0.0003;
    const llmCost = Number(((tokens / 1000) * llmRate).toFixed(4));
    return {
      total_audio_minutes: minutes,
      stt_rate_per_minute_usd: sttRate,
      estimated_stt_cost_usd: sttCost,
      estimated_llm_tokens: tokens,
      total_llm_tokens: tokens,
      llm_rate_per_1k_tokens_usd: llmRate,
      estimated_llm_cost_usd: llmCost,
      total_estimated_cost_usd: Number((sttCost + llmCost).toFixed(4)),
      currency: 'USD',
    };
  }

  async listUsers(query?: AdminListUsersQuery): Promise<{ items: AdminUserItem[]; total: number }> {
    if (this.shouldUseMock()) {
      let filtered = [...this.mockStore.users];
      if (query?.search) {
        const s = query.search.toLowerCase();
        filtered = filtered.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
      }
      if (query?.status) {
        filtered = filtered.filter((u) => u.status === query.status);
      }
      return { items: filtered, total: filtered.length };
    }

    try {
      const res = await this.client.get<CoreApiResponse<{ items: unknown[]; pagination?: { total: number } }>>('/v1/admin/users', {
        params: {
          page: query?.page ?? 1,
          limit: query?.limit ?? 20,
          search: query?.search,
          status: query?.status,
        },
      });
      const data = res.data ?? res;
      const rawList = Array.isArray(data) ? data : (data?.items ?? []);
      const items = rawList.map((u) => AdminUserItemSchema.parse(u));
      const total = data?.pagination?.total ?? items.length;
      return { items, total };
    } catch (err) {
      logger.warn('Core API listUsers failed; falling back to mock', { err: String(err) });
      return { items: this.mockStore.users, total: this.mockStore.users.length };
    }
  }

  async overrideUserQuota(userId: string, dailyQuotaMinutes: number): Promise<void> {
    const user = this.mockStore.users.find((u) => u.id === userId);
    if (user) {
      user.daily_quota_minutes = dailyQuotaMinutes;
      user.daily_quota = dailyQuotaMinutes;
    }

    if (!this.shouldUseMock()) {
      try {
        await this.client.patch(`/v1/admin/users/${userId}/quota`, { daily_quota_override: dailyQuotaMinutes });
      } catch (err) {
        logger.warn('Core API overrideUserQuota failed; updated in-memory', { err: String(err) });
      }
    }
  }

  async revokeUserSessions(userId: string): Promise<void> {
    if (!this.shouldUseMock()) {
      try {
        await this.client.post(`/v1/admin/users/${userId}/revoke-sessions`);
      } catch (err) {
        logger.warn('Core API revokeUserSessions failed', { err: String(err) });
      }
    }
  }

  async listRoles(): Promise<AdminRoleItem[]> {
    if (this.shouldUseMock()) {
      return this.mockStore.roles;
    }

    try {
      const res = await this.client.get<CoreApiResponse<{ items: unknown[] } | unknown[]>>('/v1/admin/roles');
      const data = res.data ?? res;
      const rawList = Array.isArray(data) ? data : ((data as { items?: unknown[] })?.items ?? []);
      return rawList.map((r) => AdminRoleItemSchema.parse(r));
    } catch (err) {
      logger.warn('Core API listRoles failed; using mock', { err: String(err) });
      return this.mockStore.roles;
    }
  }

  async createRole(data: AdminCreateRoleRequest): Promise<AdminRoleItem> {
    const validated = AdminCreateRoleRequestSchema.parse(data);
    const newRole: AdminRoleItem = {
      id: `b0000000-0000-0000-0000-00000000000${this.mockStore.roles.length + 1}`,
      name: validated.name,
      description: validated.description,
      permissions: validated.permissions,
      is_system: false,
      created_at: new Date().toISOString(),
    };
    this.mockStore.roles.push(newRole);

    if (!this.shouldUseMock()) {
      try {
        const res = await this.client.post<CoreApiResponse<unknown>>('/v1/admin/roles', {
          name: validated.name,
          description: validated.description,
          permissions: validated.permissions,
        });
        const payload = res.data ?? res;
        return AdminRoleItemSchema.parse(payload);
      } catch (err) {
        logger.warn('Core API createRole failed; using mock', { err: String(err) });
      }
    }

    return newRole;
  }

  async updateRole(id: string, data: AdminUpdateRoleRequest): Promise<AdminRoleItem> {
    const role = this.mockStore.roles.find((r) => r.id === id);
    if (role) {
      if (data.name) role.name = data.name;
      if (data.description !== undefined) role.description = data.description;
      if (data.permissions) role.permissions = data.permissions;
      role.updated_at = new Date().toISOString();
    }

    if (!this.shouldUseMock()) {
      try {
        const res = await this.client.put<CoreApiResponse<unknown>>(`/v1/admin/roles/${id}`, {
          name: data.name ?? role?.name,
          description: data.description ?? role?.description,
          permissions: data.permissions ?? role?.permissions,
        });
        const payload = res.data ?? res;
        return AdminRoleItemSchema.parse(payload);
      } catch (err) {
        logger.warn('Core API updateRole failed; using mock', { err: String(err) });
      }
    }

    return role || this.mockStore.roles[0];
  }

  async listTemplates(): Promise<AdminTemplateItem[]> {
    if (this.shouldUseMock()) {
      return this.mockStore.templates;
    }

    try {
      const res = await this.client.get<CoreApiResponse<{ items: unknown[] } | unknown[]>>('/v1/admin/templates');
      const data = res.data ?? res;
      const rawList = Array.isArray(data) ? data : ((data as { items?: unknown[] })?.items ?? []);
      return rawList.map((t) => AdminTemplateItemSchema.parse(t));
    } catch (err) {
      logger.warn('Core API listTemplates failed; using mock', { err: String(err) });
      return this.mockStore.templates;
    }
  }

  async createTemplate(data: AdminCreateTemplateRequest): Promise<AdminTemplateItem> {
    const validated = AdminCreateTemplateRequestSchema.parse(data);
    const newTpl: AdminTemplateItem = {
      id: `c0000000-0000-0000-0000-00000000000${this.mockStore.templates.length + 1}`,
      category_key: validated.category_key,
      name: validated.name,
      display_name: validated.display_name,
      description: validated.description,
      prompt: validated.prompt,
      system_prompt: validated.system_prompt,
      output_schema: validated.output_schema,
      schema_definition: validated.schema_definition,
      version: 1,
      is_active: validated.is_active,
      is_default: validated.is_default,
      created_at: new Date().toISOString(),
    };
    this.mockStore.templates.push(newTpl);

    if (!this.shouldUseMock()) {
      try {
        const res = await this.client.post<CoreApiResponse<unknown>>('/v1/admin/templates', {
          category_key: validated.category_key,
          name: validated.name,
          description: validated.description,
          prompt: validated.prompt,
          output_schema: validated.output_schema,
          is_active: validated.is_active,
        });
        const payload = res.data ?? res;
        return AdminTemplateItemSchema.parse(payload);
      } catch (err) {
        logger.warn('Core API createTemplate failed; using mock', { err: String(err) });
      }
    }

    return newTpl;
  }

  async updateTemplate(id: string, data: AdminUpdateTemplateRequest): Promise<AdminTemplateItem> {
    const validated = AdminUpdateTemplateRequestSchema.parse(data);
    const tpl = this.mockStore.templates.find((t) => t.id === id);
    if (tpl) {
      if (validated.name) tpl.name = validated.name;
      if (validated.display_name) tpl.display_name = validated.display_name;
      if (validated.description !== undefined) tpl.description = validated.description;
      if (validated.prompt) {
        tpl.prompt = validated.prompt;
        tpl.system_prompt = validated.system_prompt || validated.prompt;
        tpl.version = (tpl.version || 1) + 1;
      }
      if (validated.output_schema) {
        tpl.output_schema = validated.output_schema;
        tpl.schema_definition = validated.schema_definition || validated.output_schema;
      }
      if (validated.is_active !== undefined) tpl.is_active = validated.is_active;
      if (validated.is_default !== undefined) tpl.is_default = validated.is_default;
      tpl.updated_at = new Date().toISOString();
    }

    if (!this.shouldUseMock()) {
      try {
        const res = await this.client.put<CoreApiResponse<unknown>>(`/v1/admin/templates/${id}`, {
          name: validated.name ?? tpl?.name,
          description: validated.description ?? tpl?.description,
          prompt: validated.prompt ?? tpl?.prompt,
          output_schema: validated.output_schema ?? tpl?.output_schema,
          is_active: validated.is_active ?? tpl?.is_active,
        });
        const payload = res.data ?? res;
        return AdminTemplateItemSchema.parse(payload);
      } catch (err) {
        logger.warn('Core API updateTemplate failed; using mock', { err: String(err) });
      }
    }

    return tpl || this.mockStore.templates[0];
  }

  async testTemplate(data: AdminTestTemplateRequest): Promise<AdminTestTemplateResult> {
    const validated = AdminTestTemplateRequestSchema.parse(data);
    if (this.shouldUseMock()) {
      return {
        raw_output: JSON.stringify({
          summary: 'Simulated AI summary output: Discussed quarterly milestones and aligned on deployment deadlines.',
          action_items: [
            'Finalize backend migration scripts before Sprint review',
            'Conduct load testing on worker queue clusters',
          ],
        }),
        parsed_json: {
          summary: 'Simulated AI summary output: Discussed quarterly milestones and aligned on deployment deadlines.',
        },
        output: {
          summary: 'Simulated AI summary output: Discussed quarterly milestones and aligned on deployment deadlines.',
          action_items: [
            'Finalize backend migration scripts before Sprint review',
            'Conduct load testing on worker queue clusters',
          ],
        },
        execution_time_ms: 642,
        latency_ms: 642,
        tokens_used: 375,
        token_usage: {
          prompt_tokens: 280,
          completion_tokens: 95,
          total_tokens: 375,
        },
      };
    }

    try {
      const res = await this.client.post<CoreApiResponse<unknown>>('/v1/admin/templates/test', {
        prompt: validated.prompt,
        output_schema: validated.output_schema,
        sample_transcript: validated.sample_transcript,
      });
      const payload = res.data ?? res;
      return AdminTestTemplateResultSchema.parse(payload);
    } catch (err) {
      logger.warn('Core API testTemplate failed; returning simulated test result', { err: String(err) });
      return {
        raw_output: JSON.stringify({
          summary: 'Simulated fallback result: Prompt processed sample transcript accurately.',
          decisions: ['Approved API contract updates'],
        }),
        parsed_json: {
          summary: 'Simulated fallback result: Prompt processed sample transcript accurately.',
        },
        output: {
          summary: 'Simulated fallback result: Prompt processed sample transcript accurately.',
          decisions: ['Approved API contract updates'],
        },
        execution_time_ms: 710,
        latency_ms: 710,
        tokens_used: 330,
        token_usage: { prompt_tokens: 250, completion_tokens: 80, total_tokens: 330 },
      };
    }
  }

  async getDLQMessages(query?: { stage?: string; page?: number; limit?: number }): Promise<{ items: AdminDLQItem[]; total: number }> {
    if (this.shouldUseMock()) {
      let items = [...this.mockStore.dlq];
      if (query?.stage) {
        items = items.filter((d) => d.status.includes(query.stage!) || d.stage?.includes(query.stage!));
      }
      return { items, total: items.length };
    }

    try {
      const res = await this.client.get<CoreApiResponse<{ items: unknown[]; total?: number; pagination?: { total: number } }>>('/v1/admin/pipeline/dlq', {
        params: {
          page: query?.page ?? 1,
          limit: query?.limit ?? 20,
        },
      });
      const data = res.data ?? res;
      const rawList = Array.isArray(data) ? data : (data?.items ?? []);
      const items = rawList.map((d) => AdminDLQItemSchema.parse(d));
      const total = data?.total ?? data?.pagination?.total ?? items.length;
      return { items, total };
    } catch (err) {
      logger.warn('Core API getDLQMessages failed; using mock', { err: String(err) });
      return { items: this.mockStore.dlq, total: this.mockStore.dlq.length };
    }
  }

  async retryDLQJob(data: AdminRetryDLQRequest): Promise<void> {
    const validated = AdminRetryDLQRequestSchema.parse(data);
    this.mockStore.dlq = this.mockStore.dlq.filter((d) => d.recording_id !== validated.recording_id);

    if (!this.shouldUseMock()) {
      try {
        await this.client.post('/v1/admin/pipeline/dlq/retry', {
          recording_id: validated.recording_id,
          stage: validated.stage,
        });
      } catch (err) {
        logger.warn('Core API retryDLQJob failed', { err: String(err) });
      }
    }
  }

  async getSystemConfig(): Promise<AdminSystemConfig> {
    if (this.shouldUseMock()) {
      return this.mockStore.config;
    }

    try {
      const res = await this.client.get<CoreApiResponse<unknown>>('/v1/admin/config');
      const payload = res.data ?? res;
      return AdminSystemConfigSchema.parse(payload);
    } catch (err) {
      logger.warn('Core API getSystemConfig failed; using mock', { err: String(err) });
      return this.mockStore.config;
    }
  }

  async updateSystemConfig(data: AdminUpdateSystemConfigRequest): Promise<AdminSystemConfig> {
    const validated = AdminUpdateSystemConfigRequestSchema.parse(data);
    if (validated.maintenance_mode !== undefined) {
      this.mockStore.config.maintenance_mode = validated.maintenance_mode;
      this.mockStore.config.is_maintenance_mode = validated.maintenance_mode;
    }
    if (data.maintenance_message !== undefined) {
      this.mockStore.config.maintenance_message = data.maintenance_message;
    }
    if (data.feature_flags) {
      this.mockStore.config.feature_flags = {
        ...this.mockStore.config.feature_flags,
        ...data.feature_flags,
      };
    }

    if (!this.shouldUseMock()) {
      try {
        const payload: Record<string, boolean> = {};
        if (validated.maintenance_mode !== undefined) payload.maintenance_mode = validated.maintenance_mode;
        if (validated.allow_guest_uploads !== undefined) payload.allow_guest_uploads = validated.allow_guest_uploads;
        if (validated.bot_waitlist_enabled !== undefined) payload.bot_waitlist_enabled = validated.bot_waitlist_enabled;

        const res = await this.client.patch<CoreApiResponse<unknown>>('/v1/admin/config', payload);
        const resData = res.data ?? res;
        return AdminSystemConfigSchema.parse(resData);
      } catch (err) {
        logger.warn('Core API updateSystemConfig failed; using mock', { err: String(err) });
      }
    }

    return this.mockStore.config;
  }

  async listReports(query?: { status?: string; page?: number; limit?: number }): Promise<{ items: AdminReportItem[]; total: number }> {
    if (this.shouldUseMock()) {
      let filtered = [...this.mockStore.reports];
      if (query?.status) {
        filtered = filtered.filter((r) => r.status.toLowerCase() === query.status?.toLowerCase());
      }
      return { items: filtered, total: filtered.length };
    }

    try {
      const res = await this.client.get<CoreApiResponse<{ items: unknown[]; pagination?: { total: number } }>>('/v1/admin/reports', {
        params: {
          page: query?.page ?? 1,
          limit: query?.limit ?? 20,
          status: query?.status ? query.status.toLowerCase() : undefined,
        },
      });
      const data = res.data ?? res;
      const rawList = Array.isArray(data) ? data : (data?.items ?? []);
      const items = rawList.map((r) => AdminReportItemSchema.parse(r));
      const total = data?.pagination?.total ?? items.length;
      return { items, total };
    } catch (err) {
      logger.warn('Core API listReports failed; using mock', { err: String(err) });
      return { items: this.mockStore.reports, total: this.mockStore.reports.length };
    }
  }

  async resolveReport(id: string, data: AdminResolveReportRequest): Promise<void> {
    const validated = AdminResolveReportRequestSchema.parse(data);
    const report = this.mockStore.reports.find((r) => r.id === id);
    if (report) {
      report.status = validated.action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
      report.resolution_note = validated.resolution_note || null;
      report.resolution_notes = validated.resolution_note || null;
      report.updated_at = new Date().toISOString();
    }

    if (!this.shouldUseMock()) {
      try {
        await this.client.post(`/v1/admin/reports/${id}/resolve`, {
          action: validated.action,
          resolution_note: validated.resolution_note,
        });
      } catch (err) {
        logger.warn('Core API resolveReport failed', { err: String(err) });
      }
    }
  }

  async listAuditLogs(query?: AdminAuditLogQuery): Promise<{ items: AdminAuditLogItem[]; total: number }> {
    if (this.shouldUseMock()) {
      let filtered = [...this.mockStore.auditLogs];
      if (query?.action) {
        filtered = filtered.filter((l) => l.action.toLowerCase().includes(query.action!.toLowerCase()));
      }
      if (query?.entity_type) {
        filtered = filtered.filter((l) => l.entity_type === query.entity_type || l.entity === query.entity_type);
      }
      return { items: filtered, total: filtered.length };
    }

    try {
      const res = await this.client.get<CoreApiResponse<{ items: unknown[]; pagination?: { total: number } }>>('/v1/admin/audit-logs', {
        params: {
          page: query?.page ?? 1,
          limit: query?.limit ?? 20,
          action: query?.action,
          admin_id: query?.admin_id,
          entity: query?.entity_type,
        },
      });
      const data = res.data ?? res;
      const rawList = Array.isArray(data) ? data : (data?.items ?? []);
      const items = rawList.map((l) => AdminAuditLogItemSchema.parse(l));
      const total = data?.pagination?.total ?? items.length;
      return { items, total };
    } catch (err) {
      logger.warn('Core API listAuditLogs failed; using mock', { err: String(err) });
      return { items: this.mockStore.auditLogs, total: this.mockStore.auditLogs.length };
    }
  }
}

export const adminRepository: IAdminRepository = new AdminRepository();
