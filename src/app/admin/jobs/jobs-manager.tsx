'use client';

import React, { useState, useRef } from 'react';
import { AdminJobItem } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

interface JobsManagerProps {
  initialJobs: AdminJobItem[];
  initialTotal: number;
}

export function JobsManager({ initialJobs, initialTotal }: JobsManagerProps) {
  const [jobs, setJobs] = useState<AdminJobItem[]>(initialJobs);
  const [total, setTotal] = useState<number>(initialTotal);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [inspectJob, setInspectJob] = useState<AdminJobItem | null>(null);
  const fetchRequestIdRef = useRef(0);

  const fetchJobs = async (searchVal: string, statusVal: string) => {
    setLoading(true);
    const currentReq = ++fetchRequestIdRef.current;
    try {
      const q = new URLSearchParams();
      if (searchVal.trim()) q.set('search', searchVal.trim());
      if (statusVal !== 'ALL') q.set('status', statusVal);

      const endpoint = `/api/admin/jobs${q.toString() ? `?${q.toString()}` : ''}`;
      const data = await apiFetchData<AdminJobItem[]>(endpoint);
      if (currentReq !== fetchRequestIdRef.current) return;
      setJobs(data);
      setTotal(data.length);
    } catch {
      if (currentReq === fetchRequestIdRef.current) {
        toast.error('Failed to load pipeline jobs');
      }
    } finally {
      if (currentReq === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(search, statusFilter);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchJobs(search, newStatus);
  };

  const handleRefresh = () => {
    fetchJobs(search, statusFilter);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            PROCESSING
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            QUEUED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Metrics summary
  const completedCount = jobs.filter((j) => j.status.toUpperCase() === 'COMPLETED').length;
  const processingCount = jobs.filter((j) => j.status.toUpperCase() === 'PROCESSING').length;
  const queuedCount = jobs.filter((j) => j.status.toUpperCase() === 'QUEUED').length;
  const failedCount = jobs.filter((j) => j.status.toUpperCase() === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Pipeline & Generations Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline monitoring for audio transcription, speaker diarization, AI summarization, and export jobs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? '↻ Refreshing...' : '↻ Refresh'}
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Total Jobs: {total}
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
          <span className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Processing</span>
          <span className="text-2xl font-black text-blue-600 mt-1">{processingCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Queued</span>
          <span className="text-2xl font-black text-amber-600 mt-1">{queuedCount}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failed</span>
          <span className="text-2xl font-black text-rose-600 mt-1">{failedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, filename, or user email..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'COMPLETED', 'PROCESSING', 'QUEUED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Title & Filename</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Duration & Size</th>
                <th className="py-3 px-4">Template & Lang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? 'Loading pipeline jobs...' : 'No pipeline jobs found matching the filters.'}
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-xs">{job.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                        {job.original_filename}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {job.is_guest ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Guest User
                        </span>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-800">{job.user_name || 'Anonymous'}</div>
                          <div className="text-[11px] text-slate-400">{job.user_email || '—'}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{formatDuration(job.duration_seconds)}</div>
                      <div className="text-[11px] text-slate-400">{formatFileSize(job.file_size_bytes)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {job.selected_template}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">
                        Lang: {job.output_language || 'id'}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(job.status)}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectJob(job)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {inspectJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pipeline Job Details</h3>
                <span className="text-[11px] text-slate-400 font-mono">{inspectJob.id}</span>
              </div>
              <button
                onClick={() => setInspectJob(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Title & Status
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">{inspectJob.title}</span>
                  {getStatusBadge(inspectJob.status)}
                </div>
              </div>

              {inspectJob.status.toUpperCase() === 'FAILED' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <span className="block font-bold text-rose-800">
                    Failure Cause: {inspectJob.error_code || 'PIPELINE_ERROR'}
                  </span>
                  <p className="text-rose-700 font-mono text-[11px]">
                    {inspectJob.error_message || 'Unknown pipeline execution failure.'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Original File
                  </span>
                  <span className="font-semibold text-slate-800 truncate block mt-0.5">
                    {inspectJob.original_filename}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {formatFileSize(inspectJob.file_size_bytes)} • {inspectJob.source_type}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Audio Duration
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {formatDuration(inspectJob.duration_seconds)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {inspectJob.duration_seconds.toFixed(1)}s total
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    AI Prompt Template
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {inspectJob.selected_template}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Detected: {inspectJob.detected_language || 'auto'} → Target: {inspectJob.output_language}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Owner Account
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {inspectJob.is_guest ? 'Guest Session' : inspectJob.user_name || 'Member'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                    {inspectJob.user_email || 'No email attached'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-slate-600 font-mono">{new Date(inspectJob.created_at).toISOString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="text-slate-600 font-mono">{new Date(inspectJob.updated_at).toISOString()}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectJob(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
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
