import React from 'react';
import { adminService } from '@/server/services';
import { ConfigManager } from './config-manager';

export const dynamic = 'force-dynamic';

export default async function AdminConfigPage() {
  const config = await adminService.getSystemConfig();

  return <ConfigManager initialConfig={config} />;
}
