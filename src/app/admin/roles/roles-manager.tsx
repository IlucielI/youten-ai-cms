'use client';

import React, { useState } from 'react';
import { AdminRoleItem, AdminUserRoleItem } from '@/server/schemas/admin.schema';
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

const AVAILABLE_USER_PERMISSIONS = [
  { id: 'recordings:create', label: 'Create Audio Recordings', category: 'Recordings' },
  { id: 'recordings:read', label: 'View Own Recordings & Transcripts', category: 'Recordings' },
  { id: 'recordings:delete', label: 'Delete Recordings', category: 'Recordings' },
  { id: 'recordings:export', label: 'Export Audio & Documents (PDF/Docx)', category: 'Recordings' },
  { id: 'ai:transcribe', label: 'Standard AI Speech-to-Text Transcription', category: 'AI Services' },
  { id: 'ai:summarize', label: 'AI Meeting Summarization & Highlights', category: 'AI Services' },
  { id: 'ai:unlimited_transcribe', label: 'Priority / Unlimited AI Processing', category: 'AI Services' },
  { id: 'templates:apply', label: 'Custom Note Templates & Prompt Presets', category: 'Productivity' },
  { id: 'team:collaborate', label: 'Workspace Multi-User Sharing', category: 'Collaboration' },
];

interface RolesManagerProps {
  initialRoles: AdminRoleItem[];
  initialUserRoles?: AdminUserRoleItem[];
}

export function RolesManager({ initialRoles, initialUserRoles = [] }: RolesManagerProps) {
  const [activeTab, setActiveTab] = useState<'staff' | 'customer'>('staff');
  const [roles, setRoles] = useState<AdminRoleItem[]>(initialRoles);
  const [userRoles, setUserRoles] = useState<AdminUserRoleItem[]>(initialUserRoles);

  // Staff Role Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRoleItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer User Role Form State
  const [isUserRoleCreateOpen, setIsUserRoleCreateOpen] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState<AdminUserRoleItem | null>(null);
  const [userRoleCode, setUserRoleCode] = useState('');
  const [userRoleName, setUserRoleName] = useState('');
  const [userRoleDesc, setUserRoleDesc] = useState('');
  const [userRoleIsDefault, setUserRoleIsDefault] = useState(false);
  const [userRolePermissions, setUserRolePermissions] = useState<string[]>([]);
  const [isUserRoleSubmitting, setIsUserRoleSubmitting] = useState(false);

  // Staff Modal Helpers
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

  // Customer User Role Modal Helpers
  const resetUserRoleForm = () => {
    setUserRoleCode('');
    setUserRoleName('');
    setUserRoleDesc('');
    setUserRoleIsDefault(false);
    setUserRolePermissions([]);
    setIsUserRoleCreateOpen(false);
    setEditingUserRole(null);
  };

  const handleOpenCreateUserRole = () => {
    resetUserRoleForm();
    setIsUserRoleCreateOpen(true);
  };

  const handleOpenEditUserRole = (ur: AdminUserRoleItem) => {
    setEditingUserRole(ur);
    setUserRoleCode(ur.code);
    setUserRoleName(ur.name);
    setUserRoleDesc(ur.description || '');
    setUserRoleIsDefault(Boolean(ur.is_default));
    setUserRolePermissions([...ur.permissions]);
  };

  const toggleUserRolePermission = (permId: string) => {
    setUserRolePermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleCreateUserRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRoleCode.trim() || !userRoleName.trim()) {
      toast.error('Code and Name are required');
      return;
    }
    setIsUserRoleSubmitting(true);
    try {
      const created = await apiFetchData<AdminUserRoleItem>('/api/admin/user-roles', {
        method: 'POST',
        body: JSON.stringify({
          code: userRoleCode.trim().toLowerCase(),
          name: userRoleName.trim(),
          description: userRoleDesc.trim(),
          is_default: userRoleIsDefault,
          permissions: userRolePermissions,
        }),
      });
      toast.success(`User role ${created.name} (${created.code}) created successfully`);
      setUserRoles((prev) => [...prev, created]);
      resetUserRoleForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user role');
    } finally {
      setIsUserRoleSubmitting(false);
    }
  };

  const handleEditUserRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserRole) return;
    if (!userRoleName.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsUserRoleSubmitting(true);
    try {
      const updated = await apiFetchData<AdminUserRoleItem>(`/api/admin/user-roles/${editingUserRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: userRoleName.trim(),
          description: userRoleDesc.trim(),
          is_default: userRoleIsDefault,
          permissions: userRolePermissions,
        }),
      });
      toast.success(`User role ${updated.name} updated successfully`);
      setUserRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      resetUserRoleForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setIsUserRoleSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Role-Based Access Control (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure permission policies and operational scopes for internal operators and customer user tiers.
          </p>
        </div>
        <div>
          {activeTab === 'staff' ? (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>➕ Create Staff Role</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateUserRole}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>➕ Create Customer User Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'staff'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>🛡️ Staff Admin Roles</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">
            {roles.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'customer'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>👥 Customer User Roles</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800">
            {userRoles.length}
          </span>
        </button>
      </div>

      {/* Staff Roles View */}
      {activeTab === 'staff' && (
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
      )}

      {/* Customer User Roles View */}
      {activeTab === 'customer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {userRoles.map((ur) => (
            <div
              key={ur.id}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900">{ur.name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {ur.code}
                    </span>
                    {ur.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {ur.permissions.length} Perms
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4 min-h-[32px] line-clamp-2">
                  {ur.description || 'No description provided.'}
                </p>

                {/* Permissions list */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    User Feature Capabilities ({ur.permissions.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ur.permissions.slice(0, 5).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {perm}
                      </span>
                    ))}
                    {ur.permissions.length > 5 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-500">
                        +{ur.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: {ur.id.substring(0, 8)}...
                </span>
                <button
                  onClick={() => handleOpenEditUserRole(ur)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Create / Edit Modal Dialog */}
      {(isCreateOpen || editingRole) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {isCreateOpen ? 'Create New Staff Role' : `Edit Role: ${editingRole?.name}`}
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

      {/* Customer User Role Create / Edit Modal Dialog */}
      {(isUserRoleCreateOpen || editingUserRole) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {isUserRoleCreateOpen ? 'Create Customer User Role' : `Edit User Role: ${editingUserRole?.name}`}
              </h3>
              <button
                onClick={resetUserRoleForm}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={isUserRoleCreateOpen ? handleCreateUserRoleSubmit : handleEditUserRoleSubmit}
              className="flex-1 overflow-y-auto space-y-4 pr-1"
            >
              {isUserRoleCreateOpen && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Code (Identifier)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pro, enterprise, student"
                    value={userRoleCode}
                    onChange={(e) => setUserRoleCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Unique lowercase alphanumeric code used in authentication tokens and authorization checks.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pro Tier Subscription"
                  value={userRoleName}
                  onChange={(e) => setUserRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe tier privileges, recording quotas, and AI limits..."
                  value={userRoleDesc}
                  onChange={(e) => setUserRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="user-role-default"
                  checked={userRoleIsDefault}
                  onChange={(e) => setUserRoleIsDefault(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="user-role-default" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Default Role for New User Registrations
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Customer Permissions Matrix ({userRolePermissions.length} selected)
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {AVAILABLE_USER_PERMISSIONS.map((perm) => {
                    const isChecked = userRolePermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/80 border border-indigo-200' : 'hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUserRolePermission(perm.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
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
                  onClick={resetUserRoleForm}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUserRoleSubmitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {isUserRoleSubmitting ? 'Saving...' : isUserRoleCreateOpen ? 'Create User Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
