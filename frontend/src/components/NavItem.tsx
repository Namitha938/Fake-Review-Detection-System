import React from 'react';
import { NavLink } from 'react-router-dom';

export type NavAccentColor = 'indigo' | 'violet' | 'amber' | 'emerald';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  color?: NavAccentColor;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  to,
  label,
  icon,
  color = 'indigo',
  isCollapsed = false,
  onClick,
}) => {
  // Accent configurations using defined theme tokens
  const colorMap: Record<
    NavAccentColor,
    {
      activeBorder: string;
      activeBg: string;
      activeText: string;
      activeIconTile: string;
      hoverBg: string;
      hoverText: string;
      iconTile: string;
    }
  > = {
    indigo: {
      activeBorder: 'border-l-[3px] border-l-[#4F46E5] dark:border-l-[#818CF8]',
      activeBg: 'bg-[color-mix(in_srgb,var(--color-indigo)_12%,transparent)]',
      activeText: 'text-[#4F46E5] dark:text-[#818CF8]',
      activeIconTile: 'bg-[#4F46E5] dark:bg-[#818CF8] text-white',
      hoverBg: 'hover:bg-[color-mix(in_srgb,var(--color-indigo)_7%,transparent)]',
      hoverText: 'hover:text-[#4F46E5] dark:hover:text-[#818CF8]',
      iconTile: 'bg-[color-mix(in_srgb,var(--color-indigo)_10%,transparent)] text-[#4F46E5] dark:text-[#818CF8]',
    },
    violet: {
      activeBorder: 'border-l-[3px] border-l-[#7C3AED] dark:border-l-[#A78BFA]',
      activeBg: 'bg-[color-mix(in_srgb,var(--color-violet)_12%,transparent)]',
      activeText: 'text-[#7C3AED] dark:text-[#A78BFA]',
      activeIconTile: 'bg-[#7C3AED] dark:bg-[#A78BFA] text-white',
      hoverBg: 'hover:bg-[color-mix(in_srgb,var(--color-violet)_7%,transparent)]',
      hoverText: 'hover:text-[#7C3AED] dark:hover:text-[#A78BFA]',
      iconTile: 'bg-[color-mix(in_srgb,var(--color-violet)_10%,transparent)] text-[#7C3AED] dark:text-[#A78BFA]',
    },
    amber: {
      activeBorder: 'border-l-[3px] border-l-[#D97706] dark:border-l-[#FBBF24]',
      activeBg: 'bg-[color-mix(in_srgb,var(--color-amber)_12%,transparent)]',
      activeText: 'text-[#D97706] dark:text-[#FBBF24]',
      activeIconTile: 'bg-[#D97706] dark:bg-[#FBBF24] text-white',
      hoverBg: 'hover:bg-[color-mix(in_srgb,var(--color-amber)_7%,transparent)]',
      hoverText: 'hover:text-[#D97706] dark:hover:text-[#FBBF24]',
      iconTile: 'bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] text-[#D97706] dark:text-[#FBBF24]',
    },
    emerald: {
      activeBorder: 'border-l-[3px] border-l-[#10B981] dark:border-l-[#34D399]',
      activeBg: 'bg-[color-mix(in_srgb,var(--color-emerald)_12%,transparent)]',
      activeText: 'text-[#10B981] dark:text-[#34D399]',
      activeIconTile: 'bg-[#10B981] dark:bg-[#34D399] text-white',
      hoverBg: 'hover:bg-[color-mix(in_srgb,var(--color-emerald)_7%,transparent)]',
      hoverText: 'hover:text-[#10B981] dark:hover:text-[#34D399]',
      iconTile: 'bg-[color-mix(in_srgb,var(--color-emerald)_10%,transparent)] text-[#10B981] dark:text-[#34D399]',
    },
  };

  const style = colorMap[color];

  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl text-xs font-medium transition-all duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          isCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'px-3 py-2.5'
        } ${
          isActive
            ? `${style.activeBorder} ${style.activeBg} ${style.activeText} font-semibold shadow-xs`
            : `border-l-[3px] border-l-transparent text-slate-600 dark:text-slate-300 ${style.hoverBg} ${style.hoverText}`
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`p-1.5 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
              isActive ? style.activeIconTile : style.iconTile
            }`}
          >
            {icon}
          </div>
          <span className={isCollapsed ? 'sr-only' : 'truncate'}>{label}</span>
        </>
      )}
    </NavLink>
  );
};

