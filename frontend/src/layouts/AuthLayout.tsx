import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const AuthLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isRegister = location.pathname.startsWith('/register');
  const isForgotPassword = location.pathname.startsWith('/forgot-password');

  const heading = isRegister
    ? 'Start verifying reviews today'
    : isForgotPassword
    ? 'Reset your password'
    : 'Pick up where you left off';

  const subtext = isRegister
    ? 'Create a free account to save your analyses, run bulk uploads and track results.'
    : isForgotPassword
    ? 'Enter your account email to receive secure recovery instructions.'
    : 'Your saved analyses, bulk uploads and model benchmarks are waiting.';

  // Sync document title and meta description per route
  useEffect(() => {
    let pageTitle = 'Sign In — Veridex';
    let metaDesc = 'Your saved analyses, bulk uploads and model benchmarks are waiting.';

    if (isRegister) {
      pageTitle = 'Create Account — Veridex';
      metaDesc = 'Create a free account to save your analyses, run bulk uploads and track results.';
    } else if (isForgotPassword) {
      pageTitle = 'Reset Password — Veridex';
      metaDesc = 'Reset your Veridex account password securely.';
    }

    document.title = pageTitle;

    let metaTag = document.querySelector('meta[name="description"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'description');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', metaDesc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', metaDesc);
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', pageTitle);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', metaDesc);
  }, [isRegister, isForgotPassword]);

  return (
    <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ========================================================
          LEFT HERO PANEL (Desktop lg+, hidden on mobile)
         ======================================================== */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between overflow-hidden bg-slate-950 p-10 xl:p-14 min-h-screen select-none">
        {/* Full-bleed background image */}
        <img
          src="/images/login-side.webp"
          alt="Customer Reviews Forensic Analysis"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Indigo-to-Fuchsia Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/90 via-indigo-900/70 to-fuchsia-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

        {/* Top-Left Branding Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group focus:outline-hidden"
            aria-label="Back to Veridex Home"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 shadow-md group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
              Veridex
            </span>
          </Link>
        </div>

        {/* Center/Bottom Copy & Trust Bullets */}
        <div className="relative z-10 max-w-lg space-y-6 pb-6">
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md [text-wrap:balance]">
              {heading}
            </h1>
            <p className="text-sm xl:text-base text-slate-200/90 leading-relaxed font-normal">
              {subtext}
            </p>
          </div>

          {/* 3 Checkmark Bullets */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-100">
                SHAP-based transparent reasoning
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-100">
                Copy-paste syndication detection
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-100">
                Bulk uploads & saved histories
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Bottom Assurance */}
        <div className="relative z-10 text-[11px] text-slate-300/60 font-medium">
          Veridex • Automated review authenticity verification
        </div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: FORM CONTAINER
         ======================================================== */}
      <div className="flex-1 flex flex-col justify-between min-h-screen p-4 sm:p-8 lg:p-12 overflow-y-auto relative">
        {/* Ambient background glow behind right column */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-600/10 blur-3xl pointer-events-none rounded-full select-none" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-fuchsia-500/5 dark:bg-fuchsia-600/10 blur-3xl pointer-events-none rounded-full select-none" />
        {/* Top Header Bar for Theme Toggle & Mobile Logo */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between py-2">
          {/* Mobile Logo (hidden on lg where left panel has it) */}
          <div className="lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 shadow-sm group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Veridex
              </span>
            </Link>
          </div>
          <div className="hidden lg:block" />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle light and dark mode"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>

        {/* Center Content: Outlet for Login / Register Form Card */}
        <div className="flex-1 flex items-center justify-center py-6">
          <Outlet />
        </div>

        {/* Bottom Micro Footer */}
        <div className="w-full max-w-md mx-auto text-center py-2 text-[11px] text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Veridex Security Forensics. All rights reserved.
        </div>
      </div>
    </div>
  );
};

