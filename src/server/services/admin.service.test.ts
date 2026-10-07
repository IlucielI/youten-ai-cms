import { describe, it, expect, vi } from 'vitest';
import { AdminService } from './admin.service';
import { IAdminRepository } from '../repositories/admin.repository.interface';

describe('AdminService', () => {
  const mockRepo: IAdminRepository = {
    getOverviewStats: vi.fn().mockResolvedValue({
      total_users: 10,
      active_users: 8,
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
    listUsers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
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

  const service = new AdminService(mockRepo);

  it('delegates getOverviewStats to repository', async () => {
    const stats = await service.getOverviewStats();
    expect(mockRepo.getOverviewStats).toHaveBeenCalled();
    expect(stats.total_users).toBe(10);
  });

  it('delegates getCostOversight to repository', async () => {
    const cost = await service.getCostOversight();
    expect(mockRepo.getCostOversight).toHaveBeenCalled();
    expect(cost.total_audio_minutes).toBe(60);
  });

  it('delegates overrideUserQuota to repository', async () => {
    await service.overrideUserQuota('user-123', 240);
    expect(mockRepo.overrideUserQuota).toHaveBeenCalledWith('user-123', 240);
  });

  it('delegates retryDLQJob to repository', async () => {
    await service.retryDLQJob({
      recording_id: 'e0000000-0000-0000-0000-000000000001',
      stage: 'TRANSCRIBING',
    });
    expect(mockRepo.retryDLQJob).toHaveBeenCalled();
  });
});
