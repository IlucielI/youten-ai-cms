import { describe, it, expect, vi } from 'vitest';
import { AdminController } from './admin.controller';
import { IAdminService } from '../services/admin.service.interface';

describe('AdminController', () => {
  const mockService: IAdminService = {
    getOverviewStats: vi.fn().mockResolvedValue({
      total_users: 100,
      active_users: 90,
      total_recordings: 50,
      completed_recordings: 45,
      failed_recordings: 5,
      total_storage_bytes: 1048576,
      total_duration_seconds: 3600,
    }),
    getCostOversight: vi.fn().mockResolvedValue({
      total_audio_minutes: 60,
      stt_rate_per_minute_usd: 0.006,
      estimated_stt_cost_usd: 0.36,
      estimated_llm_tokens: 9000,
      llm_rate_per_1k_tokens_usd: 0.0003,
      estimated_llm_cost_usd: 0.0027,
      total_estimated_cost_usd: 0.3627,
    }),
    listUsers: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'a0000000-0000-0000-0000-000000000001',
          email: 'test@example.com',
          name: 'Test',
          status: 'active',
          daily_quota_minutes: 60,
        },
      ],
      total: 1,
    }),
    overrideUserQuota: vi.fn().mockResolvedValue(undefined),
    revokeUserSessions: vi.fn().mockResolvedValue(undefined),
    listRoles: vi.fn().mockResolvedValue([]),
    createRole: vi.fn().mockResolvedValue({ id: 'role-1', name: 'Role 1', description: '', permissions: [] }),
    updateRole: vi.fn().mockResolvedValue({ id: 'role-1', name: 'Role 1', description: '', permissions: [] }),
    listTemplates: vi.fn().mockResolvedValue([]),
    createTemplate: vi.fn().mockResolvedValue({ id: 'tpl-1', category_key: 'CAT', display_name: 'Cat', system_prompt: '', schema_definition: {}, version: 1, is_default: false }),
    updateTemplate: vi.fn().mockResolvedValue({ id: 'tpl-1', category_key: 'CAT', display_name: 'Cat', system_prompt: '', schema_definition: {}, version: 2, is_default: false }),
    testTemplate: vi.fn().mockResolvedValue({ output: {}, latency_ms: 100 }),
    getDLQMessages: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    retryDLQJob: vi.fn().mockResolvedValue(undefined),
    getSystemConfig: vi.fn().mockResolvedValue({ is_maintenance_mode: false, maintenance_message: '', feature_flags: {} }),
    updateSystemConfig: vi.fn().mockResolvedValue({ is_maintenance_mode: true, maintenance_message: '', feature_flags: {} }),
    listReports: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    resolveReport: vi.fn().mockResolvedValue(undefined),
    listAuditLogs: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  };

  const controller = new AdminController(mockService);

  it('handles getOverviewStats returning 200 JSON', async () => {
    const res = await controller.getOverviewStats();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.total_users).toBe(100);
  });

  it('handles getCostOversight returning 200 JSON', async () => {
    const res = await controller.getCostOversight();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.total_audio_minutes).toBe(60);
  });

  it('handles listUsers with search query parsing', async () => {
    const req = new Request('http://localhost:3000/api/admin/users?page=1&limit=10&search=test');
    const res = await controller.listUsers(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.length).toBe(1);
    expect(body.pagination.total).toBe(1);
  });

  it('handles overrideUserQuota with JSON validation', async () => {
    const req = new Request('http://localhost:3000/api/admin/users/123/quota', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_quota_minutes: 240 }),
    });

    const res = await controller.overrideUserQuota(req, '123');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
  });

  it('rejects invalid quota payload with 400 Bad Request', async () => {
    const req = new Request('http://localhost:3000/api/admin/users/123/quota', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_quota_minutes: -10 }),
    });

    const res = await controller.overrideUserQuota(req, '123');
    expect(res.status).toBe(400);
  });
});
