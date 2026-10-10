'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { YoutenLogo } from '@/components/atoms/youten-logo';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
}

export interface SidebarProps {
  brandName?: string;
  brandSubtitle?: string;
  items?: SidebarNavItem[];
  currentPath?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  systemStatusText?: string;
  className?: string;
}

const defaultSidebarItems: SidebarNavItem[] = [
  { label: 'Overview', href: '/admin', icon: '📊' },
  { label: 'Pipeline Jobs', href: '/admin/jobs', icon: '🎬', badge: 'Live' },
  { label: 'Users & Quotas', href: '/admin/users', icon: '👥' },
  { label: 'Roles & RBAC', href: '/admin/roles', icon: '🛡️' },
  { label: 'Prompt Templates', href: '/admin/templates', icon: '📝' },
  { label: 'Ops DLQ Monitor', href: '/admin/pipeline/dlq', icon: '⚡', badge: 'Ops' },
  { label: 'System Config', href: '/admin/config', icon: '⚙️' },
  { label: 'Abuse Reports', href: '/admin/reports', icon: '🚨' },
  { label: 'Staff Audit Logs', href: '/admin/audit-logs', icon: '📜' },
  { label: 'System Health', href: '/health', icon: '🩺', badge: 'Live' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  brandName = 'Youten AI Admin',
  brandSubtitle = 'Operational CMS',
  items = defaultSidebarItems,
  currentPath,
  userName = 'Super Admin',
  userRole = 'System Operator',
  userInitials = 'SA',
  systemStatusText = 'Core API • Online',
  className = '',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const effectivePath = currentPath ?? pathname ?? '/admin';
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionUser, setSessionUser] = useState<{
    name?: string;
    role?: string;
    initials?: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const match = document.cookie.match(/(?:^|; )admin_user_info=([^;]*)/);
        if (match && match[1]) {
          const decoded = decodeURIComponent(match[1]);
          const data = JSON.parse(decoded);
          const name = data.full_name || data.name || data.username || userName;
          const initials =
            name
              .split(' ')
              .map((n: string) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || userInitials;
          setSessionUser({
            name,
            role: data.role_name || data.role || userRole,
            initials,
          });
        }
      } catch {
        // ignore cookie parse error
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [userName, userRole, userInitials]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to logout');
      }
    } catch {
      // fallback to redirect even if network glitch occurs
    } finally {
      try {
        document.cookie = 'admin_user_info=; Max-Age=0; path=/';
      } catch {
        // ignore
      }
      router.push('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  const activeName = sessionUser?.name || userName;
  const activeRole = sessionUser?.role || userRole;
  const activeInitials = sessionUser?.initials || userInitials;

  return (
    <aside
      className={`w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none ${className}`}
    >
      {/* Top Section */}
      <div className="p-5 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shadow-md">
            <YoutenLogo size="sm" className="[&_rect]:fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white tracking-tight">{brandName}</span>
            <span className="text-[11px] text-slate-400 font-medium">{brandSubtitle}</span>
          </div>
        </div>

        {/* Telemetry Badge */}
        {systemStatusText && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
            <span className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {systemStatusText}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2 mb-1">
            Menu Navigation
          </span>
          {items.map((item) => {
            const isActive =
              typeof item.active === 'boolean'
                ? item.active
                : effectivePath === item.href ||
                  (item.href !== '/admin' && effectivePath.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="text-sm">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-blue-600' : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-700 shrink-0">
              {activeInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{activeName}</span>
              <span className="text-[10px] font-medium text-slate-400 truncate">{activeRole}</span>
            </div>
          </div>
          <button
            type="button"
            id="sidebar-logout-button"
            title="Sign Out"
            aria-label="Sign Out of Console"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <svg
              className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
