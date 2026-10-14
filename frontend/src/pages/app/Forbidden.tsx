import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Forbidden: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Access Restricted
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This module (Datasets, Model Training & System Administration) is restricted to users with the{' '}
            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">admin</span> role.
            If you need access, please contact your workspace administrator.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/app/single"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Single Review Analysis
          </Link>
        </div>
      </div>
    </div>
  );
};

