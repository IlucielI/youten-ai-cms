import React from 'react';
import { adminService } from '@/server/services';
import { TemplatesManager } from './templates-manager';

export const dynamic = 'force-dynamic';

export default async function AdminTemplatesPage() {
  const templates = await adminService.listTemplates().catch(() => []);

  return <TemplatesManager initialTemplates={templates} />;
}
