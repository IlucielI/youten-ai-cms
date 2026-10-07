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
});
