'use client';

import React, { useState } from 'react';
import { AdminUserItem } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

interface UsersManagerProps {
  initialUsers: AdminUserItem[];
  initialTotal: number;
}

export function UsersManager({ initialUsers, initialTotal }: UsersManagerProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [total, setTotal] = useState<number>(initialTotal);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Quota Override Modal State
  const [selectedUserForQuota, setSelectedUserForQuota] = useState<AdminUserItem | null>(null);
  const [quotaMinutes, setQuotaMinutes] = useState<number>(60);
  const [isQuotaSubmitting, setIsQuotaSubmitting] = useState(false);

  // Revoke Session State
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  const fetchUsers = async (searchQuery: string, statusVal: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
      if (statusVal !== 'ALL') queryParams.set('status', statusVal);

      const endpoint = `/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await apiFetchData<AdminUserItem[]>(endpoint);
      setUsers(data);
      setTotal(data.length);
    } catch {
      toast.error('Failed to reload users list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search, statusFilter);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchUsers(search, newStatus);
  };

  const handleOpenQuotaModal = (user: AdminUserItem) => {
    setSelectedUserForQuota(user);
    setQuotaMinutes(user.daily_quota_minutes);
  };

  const handleSaveQuota = async () => {
    if (!selectedUserForQuota) return;
    setIsQuotaSubmitting(true);
    try {
      await apiFetchData(`/api/admin/users/${selectedUserForQuota.id}/quota`, {
        method: 'PATCH',
        body: JSON.stringify({ daily_quota_minutes: Number(quotaMinutes) }),
      });
      toast.success(`Updated daily quota for ${selectedUserForQuota.name} to ${quotaMinutes} mins`);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserForQuota.id ? { ...u, daily_quota_minutes: Number(quotaMinutes) } : u))
      );
      setSelectedUserForQuota(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update quota');
    } finally {
      setIsQuotaSubmitting(false);
    }
  };

  const handleRevokeSessions = async (user: AdminUserItem) => {
    if (!confirm(`Are you sure you want to revoke all active sessions for ${user.email}? The user will be immediately logged out.`)) {
      return;
    }
    setRevokingUserId(user.id);
    try {
      await apiFetchData(`/api/admin/users/${user.id}/revoke-sessions`, {
        method: 'POST',
      });
      toast.success(`All sessions successfully revoked for ${user.email}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke sessions');
    } finally {
      setRevokingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Users & Quota Governance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Oversee registered users, assign recording allowances, and enforce security session revocation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Total Users: {total}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          {(['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Daily Quota</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : user.status === 'SUSPENDED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-slate-800">
                        {user.daily_quota_minutes} min/day
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenQuotaModal(user)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Override Quota
                        </button>
                        <button
                          onClick={() => handleRevokeSessions(user)}
                          disabled={revokingUserId === user.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                        >
                          {revokingUserId === user.id ? 'Revoking...' : 'Revoke Session'}
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

      {/* Quota Override Modal Dialog */}
      {selectedUserForQuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Override Daily Quota</h3>
              <button
                onClick={() => setSelectedUserForQuota(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Configure daily allowed recording duration for{' '}
              <strong className="text-slate-900">{selectedUserForQuota.name}</strong> ({selectedUserForQuota.email}).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Quota (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={quotaMinutes}
                  onChange={(e) => setQuotaMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard tier: 60 mins. Premium: 300 mins. Unlimited/Admin: 1440 mins.
                </p>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-2">
                {[30, 60, 120, 300, 1440].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuotaMinutes(preset)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserForQuota(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuota}
                disabled={isQuotaSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
              >
                {isQuotaSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
