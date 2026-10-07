'use client';

import React, { useState } from 'react';
import { AdminReportItem } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

interface ReportsManagerProps {
  initialReports: AdminReportItem[];
}

export function ReportsManager({ initialReports }: ReportsManagerProps) {
  const [reports, setReports] = useState<AdminReportItem[]>(initialReports);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [resolvingReport, setResolvingReport] = useState<AdminReportItem | null>(null);

  // Form State
  const [resolutionAction, setResolutionAction] = useState<'DISMISS' | 'SUSPEND_RECORDING'>('DISMISS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenResolve = (r: AdminReportItem) => {
    setResolvingReport(r);
    setResolutionAction('DISMISS');
    setResolutionNotes('');
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReport) return;
    setIsSubmitting(true);
    try {
      await apiFetchData(`/api/admin/reports/${resolvingReport.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          action: resolutionAction,
          resolution_notes: resolutionNotes.trim(),
        }),
      });

      toast.success(`Report #${resolvingReport.id.substring(0, 8)} successfully resolved`);
      setReports((prev) =>
        prev.map((r) =>
          r.id === resolvingReport.id
            ? {
                ...r,
                status: resolutionAction === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
                resolution_notes: resolutionNotes.trim(),
              }
            : r
        )
      );
      setResolvingReport(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports =
    statusFilter === 'ALL'
      ? reports
      : reports.filter((r) => r.status.toUpperCase() === statusFilter.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Abuse &amp; Moderation Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review flagged recordings, offensive transcripts, and user terms-of-service violations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Pending Review: {reports.filter((r) => r.status === 'PENDING').length}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['ALL', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Report ID</th>
                <th className="py-3.5 px-4">Recording Target</th>
                <th className="py-3.5 px-4">Reporter Reference</th>
                <th className="py-3.5 px-4">Reason &amp; Details</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No reports found for selected status.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">
                          #{report.id.substring(0, 8)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {report.recording_id.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">{report.reporter_ref || 'Anonymous'}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-900">{report.reason}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{report.details || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          report.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : report.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {report.status === 'PENDING' ? (
                        <button
                          onClick={() => handleOpenResolve(report)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          Take Action
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {report.resolution_notes || 'Resolved'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Report Modal Dialog */}
      {resolvingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Resolve Abuse Report #{resolvingReport.id.substring(0, 8)}
              </h3>
              <button
                onClick={() => setResolvingReport(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p>
                  <strong>Reason:</strong> {resolvingReport.reason}
                </p>
                <p>
                  <strong>Target Recording:</strong> {resolvingReport.recording_id}
                </p>
                <p className="text-slate-500">{resolvingReport.details}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enforcement Action
                </label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as 'DISMISS' | 'SUSPEND_RECORDING')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="DISMISS">Dismiss Report (No Violation Found)</option>
                  <option value="SUSPEND_RECORDING">Suspend Recording (Take Down Audio &amp; Transcript)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Audit Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this action was taken for audit trail compliance..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingReport(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Enforcing...' : 'Enforce Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
