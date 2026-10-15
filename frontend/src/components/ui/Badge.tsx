import React from 'react';

export type BadgeVariant = 'default' | 'secondary' | 'genuine' | 'suspicious' | 'fake' | 'outline' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variants: Record<BadgeVariant, { bg: string; dotColor: string }> = {
    default: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/20',
      dotColor: 'bg-indigo-500',
    },
    secondary: {
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dotColor: 'bg-slate-400',
    },
    genuine: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/20',
      dotColor: 'bg-emerald-500',
    },
    suspicious: {
      bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/20',
      dotColor: 'bg-amber-500',
    },
    fake: {
      bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-500/20',
      dotColor: 'bg-rose-500',
    },
    outline: {
      bg: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dotColor: 'bg-slate-400',
    },
    neutral: {
      bg: 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800',
      dotColor: 'bg-slate-400',
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const { bg, dotColor } = variants[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-normal ${sizes[size]} ${bg} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />}
      <span>{children}</span>
    </span>
  );
};

