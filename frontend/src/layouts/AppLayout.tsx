import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../hooks/useSidebar';
import { Sidebar } from '../components/Sidebar';
import { AIAssistantWidget } from '../components/AIAssistantWidget';
import {
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    isCollapsed,
    toggleCollapse,
    isMobileOpen,
    openMobile,
    closeMobile,
  } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile drawer toggle (visible below lg) */}
          <button
            onClick={openMobile}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo links back to "/" */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 shadow-md group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Veridex
            </span>
          </Link>

          {/* Desktop Sidebar Toggle Button next to logo (visible on lg and up) */}
          <button
            onClick={toggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all duration-300 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 hover:scale-105"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Right side controls: Theme toggle + User info + Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* User's Name / Email / Avatar */}
          {user && (
            <Link
              to="/app/profile"
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
              title="View account profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  user.full_name?.charAt(0) || user.email.charAt(0)
                )}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {user.full_name || 'User'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-end gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.role === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  {user.email}
                </div>
              </div>
            </Link>
          )}

          {/* Log out button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Log out of application"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Main shell layout with sidebar and content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar: full width (288px = w-72) or icon-only (72px = w-[72px]) */}
        <aside
          className={`hidden lg:block fixed left-0 top-16 bottom-0 z-30 transition-all duration-300 ease-in-out motion-reduce:transition-none ${
            isCollapsed ? 'w-[72px]' : 'w-72'
          }`}
        >
          <Sidebar isCollapsed={isCollapsed} />
        </aside>

        {/* Mobile Drawer (visible on < lg) */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={closeMobile}
              aria-hidden="true"
            />

            {/* Drawer container */}
            <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
              <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Veridex</span>
                <button
                  onClick={closeMobile}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Close sidebar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar isCollapsed={false} onItemClick={closeMobile} />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic page content: shifts with sidebar (pl-72 or pl-[72px]) so nothing overlaps */}
        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out motion-reduce:transition-none ${
            isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-72'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* Floating Veridex AI Assistant Co-Pilot Widget */}
      <AIAssistantWidget />
    </div>
  );
};
