import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DonutChartProps {
  genuineCount: number;
  suspiciousCount: number;
  totalCount: number;
  isDark?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  genuineCount,
  suspiciousCount,
  totalCount,
  isDark = false,
}) => {
  const data = [
    { name: 'Genuine', value: genuineCount, color: 'var(--color-emerald)' },
    { name: 'Potentially Fake', value: suspiciousCount, color: 'var(--color-rose)' },
  ];

  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    borderRadius: '12px',
    color: isDark ? '#ffffff' : '#0f172a',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '12px',
  };

  return (
    <div className="relative h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="46%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`donut-cell-${index}`}
                fill={entry.color}
                stroke={isDark ? '#0f172a' : '#ffffff'}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Total Overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-9">
        <span className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
          {totalCount.toLocaleString()}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Total
        </span>
      </div>
    </div>
  );
};

