import React from 'react';
import { adminService } from '@/server/services';
import { RolesManager } from './roles-manager';

export const dynamic = 'force-dynamic';

export default async function AdminRolesPage() {
  const roles = await adminService.listRoles();

  return <RolesManager initialRoles={roles} />;
}
