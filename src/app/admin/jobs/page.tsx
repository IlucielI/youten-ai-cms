import React from 'react';
import { adminService } from '@/server/services';
import { JobsManager } from './jobs-manager';

export const dynamic = 'force-dynamic';

export default async function AdminJobsPage() {
  const result = await adminService.getJobs({ page: 1, limit: 50 });

  return <JobsManager initialJobs={result.items} initialTotal={result.total} />;
}
