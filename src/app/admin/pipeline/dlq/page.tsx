import React from 'react';
import { adminService } from '@/server/services';
import { DLQManager } from './dlq-manager';

export const dynamic = 'force-dynamic';

export default async function AdminDLQPage() {
  const result = await adminService.getDLQMessages();

  return <DLQManager initialItems={result.items} />;
}
