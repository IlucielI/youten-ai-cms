import React from 'react';
import { adminService } from '@/server/services';
import { AuditLogsManager } from './audit-logs-manager';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const result = await adminService.listAuditLogs().catch(() => ({
    items: [],
    total: 0,
  }));

  return <AuditLogsManager initialLogs={result.items} initialTotal={result.total} />;
}
