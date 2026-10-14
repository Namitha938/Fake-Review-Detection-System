import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface KeywordsBarChartProps {
  data: Array<{ keyword: string; count: number }>;
  isDark?: boolean;
}

export const KeywordsBarChart: React.FC<KeywordsBarChartProps> = ({
  data,
  isDark = false,
}) => {
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    borderRadius: '12px',
    color: isDark ? '#ffffff' : '#0f172a',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '12px',
  };
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const axisStroke = isDark ? '#94a3b8' : '#64748b';

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No suspicious keywords accumulated yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
        >
          {/* Vertical rose-to-violet gradient */}
          <defs>
            <linearGradient id="roseToVioletGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-rose)" />
              <stop offset="100%" stopColor="var(--color-violet)" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="keyword"
            stroke={axisStroke}
            fontSize={11}
            interval={0}
            angle={-25}
            textAnchor="end"
          />
          <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="count"
            fill="url(#roseToVioletGradient)"
            radius={[6, 6, 0, 0]}
            name="Occurrences"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

