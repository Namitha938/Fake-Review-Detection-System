import React from 'react';

export type StatCardColor = 'indigo' | 'rose' | 'violet' | 'amber' | 'emerald';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: StatCardColor;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'indigo',
}) => {
  const dotColorClass = {
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  }[color];

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColorClass} flex-shrink-0`} />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title}
          </span>
        </div>
        {icon && (
          <div className="text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans tabular-nums">
          {value}
        </h4>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
