import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variants = {
    text: 'rounded-md h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const inlineStyles: React.CSSProperties = {
    width,
    height,
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 ${variants[variant]} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
};

