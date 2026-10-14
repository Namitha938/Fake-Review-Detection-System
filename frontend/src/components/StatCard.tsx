import React from 'react';

export type StatCardColor = 'indigo' | 'rose' | 'violet' | 'amber' | 'emerald';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: StatCardColor;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
}) => {
  const cssVar = `var(--color-${color})`;

  return (
    <div
      className="relative p-5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xs transition-all hover:scale-[1.01] duration-200 motion-reduce:transition-none"
      style={{
        backgroundColor: `color-mix(in srgb, ${cssVar} 8%, var(--card-bg, #ffffff))`,
        borderColor: `color-mix(in srgb, ${cssVar} 30%, transparent)`,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      {/* 4px top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: cssVar }}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {title}
        </span>
        {/* Solid colored icon tile with a white icon */}
        <div
          className="p-2.5 rounded-xl text-white shadow-xs flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cssVar }}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3">
        {/* Big number in the card's color */}
        <h4
          className="text-3xl font-extrabold tracking-tight font-mono"
          style={{ color: cssVar }}
        >
          {value}
        </h4>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

