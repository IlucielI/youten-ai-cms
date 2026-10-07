'use client';

import React, { useState } from 'react';
import { AdminDLQItem } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

interface DLQManagerProps {
  initialItems: AdminDLQItem[];
}

export function DLQManager({ initialItems }: DLQManagerProps) {
  const [items, setItems] = useState<AdminDLQItem[]>(initialItems);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [inspectItem, setInspectItem] = useState<AdminDLQItem | null>(null);

  const handleRetrySingle = async (
    item: AdminDLQItem,
    stage: 'AUDIO_EXTRACTION' | 'TRANSCRIBING' | 'SUMMARIZING' | 'EMBEDDING' | 'COMPLETED' = 'TRANSCRIBING'
  ) => {
    setRetryingId(item.recording_id);
    try {
      await apiFetchData('/api/admin/pipeline/dlq/retry', {
        method: 'POST',
        body: JSON.stringify({
          recording_id: item.recording_id,
          stage,
        }),
      });
      toast.success(`Recording ${item.recording_id.substring(0, 8)} re-queued at ${stage}`);
      setItems((prev) => prev.filter((i) => i.recording_id !== item.recording_id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to retry DLQ job');
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    if (items.length === 0) return;
    if (!confirm(`Are you sure you want to replay all ${items.length} DLQ jobs into the pipeline?`)) return;

    setRetryingAll(true);
    let successCount = 0;
    let failCount = 0;
    const successfulIds = new Set<string>();

    try {
      for (const item of items) {
        try {
          await apiFetchData('/api/admin/pipeline/dlq/retry', {
            method: 'POST',
            body: JSON.stringify({
              recording_id: item.recording_id,
              stage: 'TRANSCRIBING',
            }),
          });
          successfulIds.add(item.recording_id);
          successCount++;
        } catch {
          failCount++;
        }
      }

      setItems((prev) => prev.filter((item) => !successfulIds.has(item.recording_id)));

      if (failCount === 0) {
        toast.success(`Successfully replayed all ${successCount} DLQ jobs!`);
      } else {
        toast.warning(`Replayed ${successCount} jobs, ${failCount} failed to replay`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error occurred while replaying jobs');
    } finally {
      setRetryingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚡</span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Pipeline Dead-Letter Queue (DLQ)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Inspect failed transcription or audio slicing jobs trapped in RabbitMQ DLX queues and replay into pipeline workers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetryAll}
            disabled={items.length === 0 || retryingAll}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            <span>🔄 {retryingAll ? 'Replaying Jobs...' : `Replay All DLQ (${items.length})`}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pending DLQ Jobs
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{items.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            🚨
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Target Exchange
            </span>
            <div className="text-base font-bold font-mono text-slate-900 mt-1">dlx.audio.pipeline</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            🔀
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Worker Queue Consumer
            </span>
            <div className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active (Prefetch: 10)
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🛡️
          </div>
        </div>
      </div>

      {/* DLQ Messages Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Recording ID &amp; Title</th>
                <th className="py-3.5 px-4">Pipeline Status</th>
                <th className="py-3.5 px-4">Failure Reason</th>
                <th className="py-3.5 px-4">Retries</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🎉</span>
                      <p className="font-semibold text-slate-700">Dead-letter queue is completely empty!</p>
                      <p className="text-xs text-slate-400">All audio and transcription pipelines healthy.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.recording_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 block truncate max-w-xs">
                          {item.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {item.recording_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-rose-600 font-medium line-clamp-2" title={item.error_reason}>
                        {item.error_reason}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {item.retry_count} Attempts
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectItem(item)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Diagnostics
                        </button>
                        <button
                          onClick={() => handleRetrySingle(item, 'TRANSCRIBING')}
                          disabled={retryingId === item.recording_id}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                        >
                          {retryingId === item.recording_id ? 'Replaying...' : 'Replay'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostics Modal Dialog */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                Job Diagnostics: {inspectItem.title}
              </h3>
              <button
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Recording UUID
                </span>
                <p className="text-xs font-mono text-slate-800 bg-slate-100 p-2 rounded-lg">
                  {inspectItem.recording_id}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Root Cause Error
                </span>
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-mono">
                  {inspectItem.error_reason}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Re-queue Target Stage
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['AUDIO_EXTRACTION', 'TRANSCRIBING', 'SUMMARIZING', 'EMBEDDING'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        handleRetrySingle(inspectItem, st);
                        setInspectItem(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-mono font-semibold"
                    >
                      Replay at {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
