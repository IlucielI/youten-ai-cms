import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RolesManager } from './roles-manager';

describe('RolesManager', () => {
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

  it('renders Customer User Roles tab and role items', async () => {
    const mockRoles = [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'OPERATIONS_LEAD',
        description: 'Manages worker queues',
        permissions: ['ops:dlq_retry'],
        is_system: false,
      },
    ];

    const mockUserRoles = [
      {
        id: '33333333-3333-3333-3333-333333333333',
        code: 'pro',
        name: 'Pro Subscription',
        description: 'Full audio transcription access',
        daily_quota: 25,
        is_default: true,
        permissions: ['recordings:create', 'recordings:read', 'ai:transcribe'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { fireEvent } = await import('@testing-library/react');
    render(<RolesManager initialRoles={mockRoles} initialUserRoles={mockUserRoles} />);

    // Switch to Customer User Roles tab
    const userRoleTabBtn = screen.getByRole('button', { name: /customer user roles/i });
    fireEvent.click(userRoleTabBtn);

    expect(screen.getByText('Pro Subscription')).toBeDefined();
    expect(screen.getByText('pro')).toBeDefined();
    expect(screen.getByText('Default')).toBeDefined();
    expect(screen.getByText('3 Perms')).toBeDefined();
  });
});
