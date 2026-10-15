import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
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
  ChevronDown,
  User,
  Settings,
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
  const location = useLocation();

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Close avatar menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    if (avatarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarMenuOpen]);

  const handleLogout = () => {
    setAvatarMenuOpen(false);
    logout();
    navigate('/login');
  };

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/app/single')) return 'Single Analysis';
    if (pathname.startsWith('/app/bulk')) return 'Bulk Analysis';
    if (pathname.startsWith('/app/history')) return 'History';
    if (pathname.startsWith('/app/analytics')) return 'Analytics';
    if (pathname.startsWith('/app/datasets')) return 'Datasets';
    if (pathname.startsWith('/app/models')) return 'Models & Training';
    if (pathname.startsWith('/app/admin')) return 'Admin Dashboard';
    if (pathname.startsWith('/app/profile')) return 'Account Profile';
    return 'Dashboard';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
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
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 shadow-xs group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Veridex
            </span>
          </Link>

          {/* Desktop Sidebar Toggle Button next to logo (visible on lg and up) */}
          <button
            onClick={toggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 hover:text-slate-700 dark:hover:text-slate-200"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Subtle separator and Page Title / Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400 dark:text-slate-500">Platform</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{currentTitle}</span>
          </div>
        </div>

        {/* Right side controls: Theme toggle + Avatar Menu Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* User Avatar Menu Dropdown */}
          {user && (
            <div className="relative" ref={avatarMenuRef}>
              <button
                type="button"
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                aria-expanded={avatarMenuOpen}
                aria-haspopup="menu"
                aria-label="User account menu"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold uppercase shadow-xs overflow-hidden flex-shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0) || user.email.charAt(0)
                  )}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden md:inline max-w-[120px] truncate">
                  {user.full_name || 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {avatarMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                    <div className="mt-1.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        user.role === 'admin'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {user.role === 'admin' ? 'Administrator' : 'Standard User'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/app/profile"
                      onClick={() => setAvatarMenuOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Profile & Security
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
          className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 transition-all duration-300 ease-in-out motion-reduce:transition-none ${
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
