import React from 'react';
import { adminService } from '@/server/services';
import { UsersManager } from './users-manager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [result, userRoles] = await Promise.all([
    adminService.listUsers({ page: 1, limit: 50 }),
    adminService.listUserRoles(),
  ]);

  return (
    <UsersManager
      initialUsers={result.items}
      initialTotal={result.total}
      initialUserRoles={userRoles}
    />
  );
}
