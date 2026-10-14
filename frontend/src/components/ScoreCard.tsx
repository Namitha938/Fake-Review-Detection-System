import React from 'react';

export interface ScoreCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trendColor?: 'emerald' | 'red' | 'blue' | 'amber' | 'purple' | 'success' | 'danger' | 'warning' | 'default';
  variant?: 'emerald' | 'red' | 'blue' | 'amber' | 'purple' | 'success' | 'danger' | 'warning' | 'default';
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trendColor = 'blue',
  variant,
}) => {
  const chosen = variant || trendColor;
  let colorKey = 'blue';

  if (chosen === 'danger' || chosen === 'red') {
    colorKey = 'red';
  } else if (chosen === 'success' || chosen === 'emerald') {
    colorKey = 'emerald';
  } else if (chosen === 'warning' || chosen === 'amber') {
    colorKey = 'amber';
  } else if (chosen === 'purple') {
    colorKey = 'purple';
  }

  const colorMap: Record<string, string> = {
    emerald:
      'border-emerald-500/30 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
    red: 'border-red-500/30 dark:border-red-500/30 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
    blue: 'border-blue-500/30 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    amber:
      'border-amber-500/30 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
    purple:
      'border-purple-500/30 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div
      className={`relative p-5 rounded-2xl border ${
        colorMap[colorKey] || colorMap.blue
      } backdrop-blur-sm shadow-xs transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h4>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
