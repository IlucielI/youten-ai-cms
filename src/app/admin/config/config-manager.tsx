'use client';

import React, { useState } from 'react';
import { AdminSystemConfig } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

interface ConfigManagerProps {
  initialConfig: AdminSystemConfig;
}

export function ConfigManager({ initialConfig }: ConfigManagerProps) {
  const [, setConfig] = useState<AdminSystemConfig>(initialConfig);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(initialConfig.is_maintenance_mode);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string>(initialConfig.maintenance_message);
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    enable_whisper_fallback: true,
    enable_live_streaming: false,
    enable_public_registration: true,
    enable_debug_logging: false,
    ...initialConfig.feature_flags,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFlag = (flagKey: string) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [flagKey]: !prev[flagKey],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await apiFetchData<AdminSystemConfig>('/api/admin/config', {
        method: 'PATCH',
        body: JSON.stringify({
          is_maintenance_mode: isMaintenanceMode,
          maintenance_message: maintenanceMsg,
          feature_flags: featureFlags,
        }),
      });

      setConfig(updated);
      toast.success('System configuration updated successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Configuration &amp; Feature Flags</h1>
        <p className="text-xs text-slate-500 mt-1">
          Control platform-wide maintenance windows and dynamic feature toggles in real-time.
        </p>
      </div>

      {/* Live Maintenance Preview Banner (if active) */}
      {isMaintenanceMode && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Maintenance Window Simulation Banner
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">{maintenanceMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Maintenance Controls */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Emergency Maintenance Mode</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                When enabled, non-admin users will receive an HTTP 503 Service Unavailable response with custom banner.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMaintenanceMode}
                onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Maintenance Notice Message
            </label>
            <textarea
              rows={3}
              value={maintenanceMsg}
              onChange={(e) => setMaintenanceMsg(e.target.value)}
              placeholder="We are upgrading the core audio processing engine. Service will return shortly."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dynamic Feature Flags */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Dynamic Feature Flags</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle operational features without rebuilding or restarting container services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Flag 1 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Whisper Local STT Fallback</p>
                <p className="text-[11px] text-slate-500">
                  Fallback to local Whisper worker when Deepgram API returns rate limits.
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!featureFlags.enable_whisper_fallback}
                onChange={() => toggleFlag('enable_whisper_fallback')}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Flag 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Real-Time Audio Streaming (WS)</p>
                <p className="text-[11px] text-slate-500">
                  Allow browser clients to stream live binary audio packets via WebSocket.
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!featureFlags.enable_live_streaming}
                onChange={() => toggleFlag('enable_live_streaming')}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Flag 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Public Self-Registration</p>
                <p className="text-[11px] text-slate-500">
                  Allow external users to sign up without explicit admin invitation.
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!featureFlags.enable_public_registration}
                onChange={() => toggleFlag('enable_public_registration')}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Flag 4 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Verbose Telemetry &amp; Tracing</p>
                <p className="text-[11px] text-slate-500">
                  Log complete payload bodies into Pino and Grafana Loki instances.
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!featureFlags.enable_debug_logging}
                onChange={() => toggleFlag('enable_debug_logging')}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <span>{isSubmitting ? 'Applying Configuration...' : '💾 Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
