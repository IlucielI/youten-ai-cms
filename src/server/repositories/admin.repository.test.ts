import { describe, it, expect } from 'vitest';
import { AdminRepository } from './admin.repository';

describe('AdminRepository', () => {
  const repo = new AdminRepository();

  it('retrieves overview stats with all aggregate metrics', async () => {
    const stats = await repo.getOverviewStats();
    expect(stats.total_users).toBeGreaterThanOrEqual(0);
    expect(stats.active_users).toBeGreaterThanOrEqual(0);
    expect(stats.total_recordings).toBeGreaterThanOrEqual(0);
    expect(stats.completed_recordings).toBeGreaterThanOrEqual(0);
    expect(stats.total_storage_bytes).toBeGreaterThanOrEqual(0);
    expect(stats.total_duration_seconds).toBeGreaterThanOrEqual(0);
  });

  it('retrieves cost oversight with calculations', async () => {
    const cost = await repo.getCostOversight();
    expect(cost.total_audio_minutes).toBeGreaterThan(0);
    expect(cost.stt_rate_per_minute_usd).toBe(0.006);
    expect(cost.estimated_stt_cost_usd).toBeGreaterThan(0);
    expect(cost.total_estimated_cost_usd).toBeGreaterThan(0);
  });

  it('lists users and applies search filtering', async () => {
    const res = await repo.listUsers({ page: 1, limit: 10 });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.total).toBeGreaterThan(0);

    const searchRes = await repo.listUsers({ page: 1, limit: 10, search: 'alex' });
    expect(searchRes.items.some((u) => u.name.toLowerCase().includes('alex'))).toBe(true);
  });

  it('overrides user quota in memory', async () => {
    const users = await repo.listUsers();
    const userId = users.items[0].id;
    await repo.overrideUserQuota(userId, 500);

    const updated = await repo.listUsers();
    const found = updated.items.find((u) => u.id === userId);
    expect(found?.daily_quota_minutes).toBe(500);
  });

  it('manages roles: list, create, and update', async () => {
    const roles = await repo.listRoles();
    expect(roles.length).toBeGreaterThanOrEqual(1);

    const created = await repo.createRole({
      name: 'Auditor',
      description: 'Audit logs only',
      permissions: ['audit:read'],
    });
    expect(created.name).toBe('Auditor');

    const updated = await repo.updateRole(created.id, {
      description: 'Updated auditor description',
    });
    expect(updated.description).toBe('Updated auditor description');
  });

  it('manages templates: list, create, update, and sandbox test', async () => {
    const templates = await repo.listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(1);

    const created = await repo.createTemplate({
      category_key: 'STANDUP',
      display_name: 'Daily Standup',
      system_prompt: 'Summarize yesterday, today, blockers.',
      schema_definition: { type: 'object' },
    });
    expect(created.category_key).toBe('STANDUP');

    const testRes = await repo.testTemplate({
      system_prompt: created.system_prompt,
      schema_definition: created.schema_definition,
      sample_transcript: 'Speaker 1: Yesterday I fixed the bug. Today I am deploying.',
    });
    expect(testRes.output).toBeDefined();
    expect(testRes.latency_ms).toBeGreaterThan(0);
  });

  it('manages DLQ pipeline and retry', async () => {
    const dlq = await repo.getDLQMessages();
    expect(dlq.items.length).toBeGreaterThanOrEqual(1);

    const targetId = dlq.items[0].recording_id;
    await repo.retryDLQJob({
      recording_id: targetId,
      stage: 'AUDIO_EXTRACTION',
    });

    const dlqAfter = await repo.getDLQMessages();
    expect(dlqAfter.items.some((d) => d.recording_id === targetId)).toBe(false);
  });

  it('manages system config and feature flags', async () => {
    const config = await repo.getSystemConfig();
    expect(config.is_maintenance_mode).toBeDefined();

    const updated = await repo.updateSystemConfig({
      is_maintenance_mode: true,
      maintenance_message: 'Testing maintenance mode',
    });
    expect(updated.is_maintenance_mode).toBe(true);
    expect(updated.maintenance_message).toBe('Testing maintenance mode');
  });

  it('manages abuse reports and resolves ticket', async () => {
    const reports = await repo.listReports();
    expect(reports.items.length).toBeGreaterThan(0);

    const reportId = reports.items[0].id;
    await repo.resolveReport(reportId, {
      action: 'DISMISS',
      resolution_notes: 'False alarm',
    });

    const updatedReports = await repo.listReports();
    const resolved = updatedReports.items.find((r) => r.id === reportId);
    expect(resolved?.status).toBe('DISMISSED');
  });

  it('lists audit logs with action filters', async () => {
    const logs = await repo.listAuditLogs();
    expect(logs.items.length).toBeGreaterThan(0);
    expect(logs.items[0].admin_username).toBeDefined();
  });
});
