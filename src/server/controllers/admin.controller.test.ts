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
    listUserRoles: vi.fn().mockResolvedValue([{ id: 'ur-1', code: 'pro', name: 'Pro', description: '', is_default: false, permissions: [] }]),
    createUserRole: vi.fn().mockResolvedValue({ id: 'ur-1', code: 'pro', name: 'Pro', description: '', is_default: false, permissions: [] }),
    updateUserRole: vi.fn().mockResolvedValue({ id: 'ur-1', code: 'pro', name: 'Pro', description: '', is_default: false, permissions: [] }),
    assignUserRole: vi.fn().mockResolvedValue({ id: 'user-1', email: 'u@example.com', name: 'U', status: 'ACTIVE', daily_quota_minutes: 60, role_id: 'ur-1', role_code: 'pro', role_name: 'Pro' }),
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
    getJobs: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'd1000000-0000-0000-0000-000000000001',
          title: 'Test Meeting Recording',
          original_filename: 'test.mp3',
          file_size_bytes: 1048576,
          duration_seconds: 120,
          source_type: 'UPLOAD',
          status: 'COMPLETED',
          selected_template: 'GENERAL',
          output_language: 'id',
          is_guest: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      total_pages: 1,
    }),
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

  it('handles getJobs with query filters and returns 200 JSON', async () => {
    const req = new Request('http://localhost:3000/api/admin/jobs?page=1&limit=20&status=COMPLETED');
    const res = await controller.getJobs(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.length).toBe(1);
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.totalPages).toBe(1);
  });

  it('handles user roles controller endpoints', async () => {
    // listUserRoles
    const listRes = await controller.listUserRoles();
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.data.length).toBe(1);

    // createUserRole
    const createReq = new Request('http://localhost:3000/api/admin/user-roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'pro',
        name: 'Pro',
        permissions: ['recordings:create'],
      }),
    });
    const createRes = await controller.createUserRole(createReq);
    expect(createRes.status).toBe(201);

    // updateUserRole
    const updateReq = new Request('http://localhost:3000/api/admin/user-roles/ur-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pro Updated',
        permissions: ['recordings:create'],
      }),
    });
    const updateRes = await controller.updateUserRole(updateReq, 'ur-1');
    expect(updateRes.status).toBe(200);

    // assignUserRole
    const assignReq = new Request('http://localhost:3000/api/admin/users/user-1/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_id: '20000000-0000-4000-8000-000000000021',
      }),
    });
    const assignRes = await controller.assignUserRole(assignReq, 'user-1');
    expect(assignRes.status).toBe(200);
  });
});
