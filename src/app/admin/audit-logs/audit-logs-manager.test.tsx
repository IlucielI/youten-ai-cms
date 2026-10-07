import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuditLogsManager } from './audit-logs-manager';

describe('AuditLogsManager', () => {
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
