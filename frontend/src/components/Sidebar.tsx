import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { NavItem, NavAccentColor } from './NavItem';
import {
  Search,
  UploadCloud,
  History,
  BarChart2,
  Database,
  Cpu,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onItemClick }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const isAdminPage =
    location.pathname.startsWith('/app/admin') ||
    location.pathname.startsWith('/app/datasets') ||
    location.pathname.startsWith('/app/models');

  // Analysis Tools with designated color coding
  // Single Analysis = indigo, Bulk Analysis = violet, History = amber, Analytics = emerald
  const primaryItems: Array<{
    to: string;
    label: string;
    icon: React.ReactNode;
    color: NavAccentColor;
  }> = [
    { to: '/app/single', label: 'Single Analysis', icon: <Search className="w-4 h-4" />, color: 'indigo' },
    { to: '/app/bulk', label: 'Bulk Analysis', icon: <UploadCloud className="w-4 h-4" />, color: 'violet' },
    { to: '/app/history', label: 'History', icon: <History className="w-4 h-4" />, color: 'amber' },
    { to: '/app/analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" />, color: 'emerald' },
  ];

  const adminItems: Array<{
    to: string;
    label: string;
    icon: React.ReactNode;
    color: NavAccentColor;
  }> = [
    { to: '/app/datasets', label: 'Datasets', icon: <Database className="w-4 h-4" />, color: 'amber' },
    { to: '/app/models', label: 'Models & Training', icon: <Cpu className="w-4 h-4" />, color: 'violet' },
    { to: '/app/admin', label: 'Admin Dashboard', icon: <UserCheck className="w-4 h-4" />, color: 'indigo' },
  ];

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none transition-all duration-300 ease-in-out motion-reduce:transition-none ${
        isCollapsed ? 'w-[72px]' : 'w-72'
      }`}
    >
      {/* Section Heading: Analysis Tools (Hidden when collapsed) */}
      {!isAdminPage && !isCollapsed && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Analysis Tools
          </span>
        </div>
      )}

      {/* Navigation items */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3'} py-3 space-y-1.5 overflow-y-auto overflow-x-hidden`}>
        {!isAdminPage &&
          primaryItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              color={item.color}
              isCollapsed={isCollapsed}
              onClick={onItemClick}
            />
          ))}

        {isAdmin && (
          <>
            {/* Section Heading: Admin Controls (Hidden when collapsed) */}
            {!isCollapsed && (
              <div className="pt-5 pb-2 px-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Controls
                </span>
              </div>
            )}

            {adminItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                color={item.color}
                isCollapsed={isCollapsed}
                onClick={onItemClick}
              />
            ))}
          </>
        )}
      </nav>

      {/* User profile footer badge */}
      {user && (
        <Link
          to="/app/profile"
          onClick={onItemClick}
          className={`${
            isCollapsed ? 'p-3 flex justify-center' : 'p-3.5'
          } border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors block group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
          title={isCollapsed ? `${user.full_name || 'User'} (${user.email})` : 'View and edit profile'}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user.full_name?.charAt(0) || user.email.charAt(0)
              )}
            </div>

            {/* User card text: Hidden when collapsed */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {user.full_name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        </Link>
      )}
    </div>
  );
};
