'use client';

import React, { useState, useRef } from 'react';
import { AdminAuditLogItem } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

interface AuditLogsManagerProps {
  initialLogs: AdminAuditLogItem[];
  initialTotal: number;
}

export function AuditLogsManager({ initialLogs, initialTotal }: AuditLogsManagerProps) {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>(initialLogs);
  const [total, setTotal] = useState<number>(initialTotal);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const fetchRequestIdRef = useRef(0);

  // Inspector Modal
  const [inspectLog, setInspectLog] = useState<AdminAuditLogItem | null>(null);

  const fetchLogs = async (actionVal: string, entityVal: string) => {
    setLoading(true);
    const currentReq = ++fetchRequestIdRef.current;
    try {
      const q = new URLSearchParams();
      if (actionVal.trim()) q.set('action', actionVal.trim());
      if (entityVal.trim()) q.set('entity_type', entityVal.trim());

      const data = await apiFetchData<AdminAuditLogItem[]>(
        `/api/admin/audit-logs${q.toString() ? `?${q.toString()}` : ''}`
      );
      if (currentReq !== fetchRequestIdRef.current) return;
      setLogs(data);
      setTotal(data.length);
    } catch {
      if (currentReq === fetchRequestIdRef.current) {
        toast.error('Failed to load audit logs');
      }
    } finally {
      if (currentReq === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (newAction: string, newEntity: string) => {
    setActionFilter(newAction);
    setEntityFilter(newEntity);
    fetchLogs(newAction, newEntity);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Audit Trail & Compliance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable chronicle of all staff administrative actions, quota overrides, and security policy modifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Total Entries: {total}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/3">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => handleFilterChange(e.target.value, entityFilter)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Actions</option>
            <option value="OVERRIDE_QUOTA">OVERRIDE_QUOTA</option>
            <option value="REVOKE_SESSIONS">REVOKE_SESSIONS</option>
            <option value="CREATE_ROLE">CREATE_ROLE</option>
            <option value="UPDATE_ROLE">UPDATE_ROLE</option>
            <option value="CREATE_TEMPLATE">CREATE_TEMPLATE</option>
            <option value="RETRY_DLQ">RETRY_DLQ</option>
            <option value="UPDATE_CONFIG">UPDATE_CONFIG</option>
            <option value="RESOLVE_REPORT">RESOLVE_REPORT</option>
          </select>
        </div>

        <div className="w-full md:w-1/3">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Entity Type
          </label>
          <select
            value={entityFilter}
            onChange={(e) => handleFilterChange(actionFilter, e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Entities</option>
            <option value="USER">USER</option>
            <option value="ROLE">ROLE</option>
            <option value="TEMPLATE">TEMPLATE</option>
            <option value="DLQ">DLQ</option>
            <option value="SYSTEM_CONFIG">SYSTEM_CONFIG</option>
            <option value="REPORT">REPORT</option>
          </select>
        </div>

        <div className="w-full md:w-1/3 flex items-end">
          <button
            onClick={() => handleFilterChange('', '')}
            className="w-full py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Admin Operator</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity Type &amp; Target</th>
                <th className="py-3.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                          {log.admin_username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{log.admin_username}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-mono text-[11px]">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 8)}...)` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Payload Modal Dialog */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                Audit Payload: {inspectLog.action}
              </h3>
              <button
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p>
                  <strong>Admin:</strong> {inspectLog.admin_username}
                </p>
                <p>
                  <strong>Action:</strong> {inspectLog.action}
                </p>
                <p>
                  <strong>Entity:</strong> {inspectLog.entity_type} {inspectLog.entity_id || 'N/A'}
                </p>
                <p className="text-slate-500 font-mono text-[10px]">
                  <strong>Timestamp:</strong> {new Date(inspectLog.created_at).toISOString()}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  JSON Mutation Payload
                </span>
                <pre className="p-3 bg-slate-950 text-emerald-400 text-[11px] font-mono rounded-xl overflow-x-auto max-h-60">
                  {JSON.stringify(inspectLog.payload || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
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
