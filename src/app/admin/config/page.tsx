import React from 'react';
import { adminService } from '@/server/services';
import { ConfigManager } from './config-manager';

export const dynamic = 'force-dynamic';

export default async function AdminConfigPage() {
  const config = await adminService.getSystemConfig().catch(() => ({
    maintenance_mode: false,
    is_maintenance_mode: false,
    allow_guest_uploads: true,
    bot_waitlist_enabled: true,
    maintenance_message: 'The system is undergoing scheduled infrastructure maintenance.',
    feature_flags: {
      enable_whisper_fallback: true,
      enable_live_streaming: false,
      enable_public_registration: true,
      enable_debug_logging: false,
    },
  }));

  return <ConfigManager initialConfig={config} />;
}
