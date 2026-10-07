'use client';

import React, { useState } from 'react';
import { AdminRoleItem } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

const AVAILABLE_PERMISSIONS = [
  { id: 'admin:all', label: 'Full System Superadmin', category: 'System' },
  { id: 'users:read', label: 'View Users & Quotas', category: 'Users' },
  { id: 'users:write', label: 'Override Quotas & Revoke Sessions', category: 'Users' },
  { id: 'roles:manage', label: 'Create & Modify Roles', category: 'Security' },
  { id: 'templates:manage', label: 'Edit & Deploy AI Prompts', category: 'AI Pipelines' },
  { id: 'ops:dlq_retry', label: 'Trigger DLQ Message Replays', category: 'Operations' },
  { id: 'config:write', label: 'Toggle System Flags & Maintenance', category: 'Operations' },
  { id: 'reports:resolve', label: 'Review & Resolve Abuse Tickets', category: 'Moderation' },
  { id: 'audit:read', label: 'Inspect Staff Audit Logs', category: 'Compliance' },
];

interface RolesManagerProps {
  initialRoles: AdminRoleItem[];
}

export function RolesManager({ initialRoles }: RolesManagerProps) {
  const [roles, setRoles] = useState<AdminRoleItem[]>(initialRoles);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRoleItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormPermissions([]);
    setIsCreateOpen(false);
    setEditingRole(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (role: AdminRoleItem) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDesc(role.description || '');
    setFormPermissions([...role.permissions]);
  };

  const togglePermission = (permId: string) => {
    setFormPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Role name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await apiFetchData<AdminRoleItem>('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: formName.trim().toUpperCase(),
          description: formDesc.trim(),
          permissions: formPermissions,
        }),
      });
      toast.success(`Role ${created.name} created successfully`);
      setRoles((prev) => [...prev, created]);
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setIsSubmitting(true);
    try {
      const updated = await apiFetchData<AdminRoleItem>(`/api/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: formDesc.trim(),
          permissions: formPermissions,
        }),
      });
      toast.success(`Role ${updated.name} updated successfully`);
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Role-Based Access Control (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure permission policies and operational scopes for internal operators and tenant users.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>➕ Create Custom Role</span>
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => (
          <div
            key={role.id}
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900">{role.name}</span>
                  {role.is_system && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      System
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {role.permissions.length} Permissions
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4 min-h-[32px] line-clamp-2">
                {role.description || 'No description provided.'}
              </p>

              {/* Permissions list */}
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Assigned Permissions ({role.permissions.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 5).map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {perm}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-500">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {role.id.substring(0, 8)}...
              </span>
              <button
                onClick={() => handleOpenEdit(role)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal Dialog */}
      {(isCreateOpen || editingRole) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {isCreateOpen ? 'Create New Role' : `Edit Role: ${editingRole?.name}`}
              </h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit}
              className="flex-1 overflow-y-auto space-y-4 pr-1"
            >
              {isCreateOpen && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Code / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COMPLIANCE_OFFICER"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe operational responsibilities and access scope..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Permissions Matrix ({formPermissions.length} selected)
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900">{perm.label}</p>
                          <p className="text-[10px] font-mono text-slate-500">{perm.id}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isCreateOpen ? 'Create Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
