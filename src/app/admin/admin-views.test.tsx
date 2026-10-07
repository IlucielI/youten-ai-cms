import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UsersManager } from './users/users-manager';
import { RolesManager } from './roles/roles-manager';
import { TemplatesManager } from './templates/templates-manager';
import { DLQManager } from './pipeline/dlq/dlq-manager';
import { ConfigManager } from './config/config-manager';
import { ReportsManager } from './reports/reports-manager';
import { AuditLogsManager } from './audit-logs/audit-logs-manager';

describe('Admin CMS UI Components', () => {
  it('renders UsersManager with users table and quota indicators', () => {
    const mockUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Sarah Connor',
        email: 'sarah@skynet.ai',
        status: 'ACTIVE',
        daily_quota_minutes: 120,
        created_at: new Date().toISOString(),
      },
    ];

    render(<UsersManager initialUsers={mockUsers} initialTotal={1} />);

    expect(screen.getByText('Users & Quota Governance')).toBeDefined();
    expect(screen.getByText('Sarah Connor')).toBeDefined();
    expect(screen.getByText('sarah@skynet.ai')).toBeDefined();
    expect(screen.getByText('120 min/day')).toBeDefined();
  });

  it('renders RolesManager with permissions and custom roles list', () => {
    const mockRoles = [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'OPERATIONS_LEAD',
        description: 'Manages worker queues and audio transcription pipeline',
        permissions: ['ops:dlq_retry', 'recordings:read'],
        is_system: false,
      },
    ];

    render(<RolesManager initialRoles={mockRoles} />);

    expect(screen.getByText('Role-Based Access Control (RBAC)')).toBeDefined();
    expect(screen.getByText('OPERATIONS_LEAD')).toBeDefined();
    expect(screen.getByText('2 Permissions')).toBeDefined();
  });

  it('renders TemplatesManager with categories and prompt cards', () => {
    const mockTemplates = [
      {
        id: '33333333-3333-3333-3333-333333333333',
        category_key: 'MOM',
        display_name: 'Executive Board Meeting MOM',
        system_prompt: 'Generate formal meeting minutes with action items and owners.',
        schema_definition: { title: 'string', decisions: ['string'] },
        version: 1,
        is_default: true,
      },
    ];

    render(<TemplatesManager initialTemplates={mockTemplates} />);

    expect(screen.getByText('AI Prompt Templates & Sandbox')).toBeDefined();
    expect(screen.getByText('Executive Board Meeting MOM')).toBeDefined();
    expect(screen.getByText('v1')).toBeDefined();
    expect(screen.getByText('Default')).toBeDefined();
  });

  it('renders DLQManager with job diagnostics and replay buttons', () => {
    const mockDLQ = [
      {
        recording_id: '44444444-4444-4444-4444-444444444444',
        title: 'Q3 Financial Review Recording',
        status: 'FAILED',
        error_reason: 'Deepgram transcription timed out after 3 retries',
        retry_count: 3,
        created_at: new Date().toISOString(),
      },
    ];

    render(<DLQManager initialItems={mockDLQ} />);

    expect(screen.getByText('Pipeline Dead-Letter Queue (DLQ)')).toBeDefined();
    expect(screen.getByText('Q3 Financial Review Recording')).toBeDefined();
    expect(screen.getByText('3 Attempts')).toBeDefined();
    expect(screen.getByText('Deepgram transcription timed out after 3 retries')).toBeDefined();
  });

  it('renders ConfigManager with emergency maintenance mode and flags', () => {
    const mockConfig = {
      is_maintenance_mode: true,
      maintenance_message: 'Core database cluster upgrade in progress.',
      feature_flags: {
        enable_whisper_fallback: true,
        enable_live_streaming: false,
      },
    };

    render(<ConfigManager initialConfig={mockConfig} />);

    expect(screen.getByText('System Configuration & Feature Flags')).toBeDefined();
    expect(screen.getByText('Emergency Maintenance Mode')).toBeDefined();
    expect(screen.getAllByText('Core database cluster upgrade in progress.').length).toBeGreaterThan(0);
    expect(screen.getByText('Whisper Local STT Fallback')).toBeDefined();
  });

  it('renders ReportsManager with abuse queue and resolution controls', () => {
    const mockReports = [
      {
        id: '55555555-5555-5555-5555-555555555555',
        recording_id: '66666666-6666-6666-6666-666666666666',
        reporter_ref: 'auditor@company.com',
        reason: 'CONFIDENTIAL_LEAK',
        details: 'Meeting contains proprietary source code credentials',
        status: 'PENDING' as const,
      },
    ];

    render(<ReportsManager initialReports={mockReports} />);

    expect(screen.getByText('Abuse & Moderation Console')).toBeDefined();
    expect(screen.getByText('#55555555')).toBeDefined();
    expect(screen.getByText('CONFIDENTIAL_LEAK')).toBeDefined();
    expect(screen.getByText('Take Action')).toBeDefined();
  });

  it('renders AuditLogsManager with immutable chronicle entries', () => {
    const mockLogs = [
      {
        id: '77777777-7777-7777-7777-777777777777',
        action: 'OVERRIDE_QUOTA',
        entity_type: 'USER',
        entity_id: '11111111-1111-1111-1111-111111111111',
        admin_username: 'superadmin',
        payload: { previous_quota: 60, new_quota: 300 },
        created_at: new Date().toISOString(),
      },
    ];

    render(<AuditLogsManager initialLogs={mockLogs} initialTotal={1} />);

    expect(screen.getByText('Staff Audit Trail & Compliance')).toBeDefined();
    expect(screen.getByText('superadmin')).toBeDefined();
    expect(screen.getAllByText('OVERRIDE_QUOTA').length).toBeGreaterThan(0);
    expect(screen.getByText('Inspect Payload')).toBeDefined();
  });
});
