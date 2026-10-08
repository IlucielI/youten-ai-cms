import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UsersManager } from './users-manager';

describe('UsersManager', () => {
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

  it('renders role tier badges and opens role assignment modal', async () => {
    const mockUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Sarah Connor',
        email: 'sarah@skynet.ai',
        status: 'ACTIVE',
        daily_quota_minutes: 120,
        role_id: 'ur-1',
        role_code: 'pro',
        role_name: 'Pro Tier',
        created_at: new Date().toISOString(),
      },
    ];

    const mockUserRoles = [
      {
        id: 'ur-1',
        code: 'pro',
        name: 'Pro Tier',
        description: 'Pro privileges',
        daily_quota: 25,
        is_default: false,
        permissions: ['recordings:create'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { fireEvent } = await import('@testing-library/react');
    render(
      <UsersManager
        initialUsers={mockUsers}
        initialTotal={1}
        initialUserRoles={mockUserRoles}
      />
    );

    expect(screen.getByRole('columnheader', { name: 'Role Tier' })).toBeDefined();
    expect(screen.getByText('Pro Tier')).toBeDefined();

    const roleBtn = screen.getByRole('button', { name: 'Role Tier' });
    fireEvent.click(roleBtn);

    expect(screen.getByText('Assign Customer User Role')).toBeDefined();
    expect(screen.getByText('Pro privileges')).toBeDefined();
  });
});
