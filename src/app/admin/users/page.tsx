import React from 'react';
import { adminService } from '@/server/services';
import { UsersManager } from './users-manager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const result = await adminService.listUsers({ page: 1, limit: 50 }).catch(() => ({
    items: [],
    total: 0,
  }));

  return <UsersManager initialUsers={result.items} initialTotal={result.total} />;
}
