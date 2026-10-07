import React from 'react';
import { adminService } from '@/server/services';
import { ReportsManager } from './reports-manager';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const result = await adminService.listReports();

  return <ReportsManager initialReports={result.items} />;
}
