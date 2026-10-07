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
});
