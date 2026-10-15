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
    borderRadius: '10px',
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

  // Display top 8 horizontal bars sorted descending
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
          <XAxis type="number" stroke={axisStroke} fontSize={11} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="keyword"
            stroke={axisStroke}
            fontSize={11}
            tickLine={false}
            width={75}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} occurrences`, 'Frequency']} />
          <Bar
            dataKey="count"
            fill="#6366f1"
            radius={[0, 6, 6, 0]}
            name="Occurrences"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
