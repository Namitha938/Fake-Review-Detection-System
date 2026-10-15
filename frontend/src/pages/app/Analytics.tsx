import React, { useEffect, useState, useMemo } from 'react';
import { analyticsApi } from '../../api';
import { AnalyticsSummary } from '../../types';
import { StatCard } from '../../components/StatCard';
import { DonutChart } from '../../components/charts/DonutChart';
import { KeywordsBarChart } from '../../components/charts/KeywordsBarChart';
import { useTheme } from '../../context/ThemeContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  ShieldAlert,
  Percent,
  RefreshCw,
  Copy,
  Activity,
  Calendar,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days'>('all');
  const { theme } = useTheme();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await analyticsApi.getSummary();
      setData(summary);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load telemetry analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const isDark = theme === 'dark';
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

  const flaggedPercent =
    data && data.total_reviews_analyzed > 0
      ? ((data.fake_count / data.total_reviews_analyzed) * 100).toFixed(1)
      : '0.0';

  const avgConfidence = data ? data.average_confidence.toFixed(1) : '0.0';

  // Filter timeline based on date range
  const filteredTimeline = useMemo(() => {
    if (!data?.timeline) return [];
    if (dateRange === 'all') return data.timeline;
    if (dateRange === '7days') return data.timeline.slice(-7);
    if (dateRange === '30days') return data.timeline.slice(-30);
    return data.timeline;
  }, [data?.timeline, dateRange]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <BarChart2 className="w-6 h-6" />
            </div>
            <span>Fraud & deception analytics</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Real-time visual telemetry, genuine vs. suspicious breakdowns, recurring keyword attributions, and volume trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All time</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <>
          {/* Neutral KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total reviews analyzed"
              value={(data?.total_reviews_analyzed || 0).toLocaleString()}
              subtitle="Processed through pipeline"
              color="indigo"
              icon={<Activity className="w-4 h-4" />}
            />
            <StatCard
              title="Deception rate"
              value={`${flaggedPercent}%`}
              subtitle={`${data?.fake_count || 0} reviews flagged as suspicious`}
              color="rose"
              icon={<ShieldAlert className="w-4 h-4" />}
            />
            <StatCard
              title="Mean model confidence"
              value={`${avgConfidence}%`}
              subtitle="Prediction certainty index"
              color="violet"
              icon={<Percent className="w-4 h-4" />}
            />
            <StatCard
              title="Syndicated copies detected"
              value={(data?.duplicate_count || 0).toLocaleString()}
              subtitle="Fuzzy matched review texts"
              color="amber"
              icon={<Copy className="w-4 h-4" />}
            />
          </div>

          {/* Charts Row 1: Donut Distribution & Top Suspicious Keywords */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Authentic vs. deceptive distribution
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Total: {data?.total_reviews_analyzed || 0}
                </span>
              </div>

              <DonutChart
                genuineCount={data?.genuine_count || 0}
                suspiciousCount={data?.fake_count || 0}
                totalCount={data?.total_reviews_analyzed || 0}
                isDark={isDark}
              />
            </div>

            {/* Horizontal Bar Chart: Top Recurring Keywords */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Top recurring suspicious keywords
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  SHAP feature contributions
                </span>
              </div>

              <KeywordsBarChart
                data={data?.top_suspicious_keywords || []}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Charts Row 2: Straight Line Timeline Chart */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Analysis volume over time
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Daily submission trend
              </span>
            </div>

            <div className="h-72">
              {filteredTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredTimeline}
                    margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="date" stroke={axisStroke} fontSize={11} />
                    <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line
                      type="linear"
                      dataKey="genuine"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Genuine reviews"
                    />
                    <Line
                      type="linear"
                      dataKey="fake"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Suspicious reviews"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  No timeline telemetry recorded for the selected range.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
