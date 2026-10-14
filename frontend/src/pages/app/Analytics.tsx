import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    borderRadius: '12px',
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      {/* Very soft indigo radial wash behind the header */}
      <div
        className="pointer-events-none absolute -top-8 -left-8 w-96 h-96 rounded-full opacity-15 dark:opacity-20 blur-3xl -z-10"
        style={{
          background: 'radial-gradient(circle, var(--color-indigo) 0%, transparent 70%)',
        }}
      />

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            {/* Title icon tile with a 135-degree indigo-to-violet gradient */}
            <div
              className="p-2.5 rounded-2xl text-white shadow-md flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-indigo) 0%, var(--color-violet) 100%)',
              }}
            >
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <span>Visual Fraud & NLP Analytics</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Real-time visual telemetry, genuine vs. suspicious breakdowns, recurring keyword attributions, and volume trends.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Stat Cards with strict color coding */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Analyzed"
              value={(data?.total_reviews_analyzed || 0).toLocaleString()}
              subtitle="Processed through NLP engine"
              color="indigo"
              icon={<Activity className="w-5 h-5 text-white" />}
            />
            <StatCard
              title="% Flagged Suspicious"
              value={`${flaggedPercent}%`}
              subtitle={`${data?.fake_count || 0} reviews flagged`}
              color="rose"
              icon={<ShieldAlert className="w-5 h-5 text-white" />}
            />
            <StatCard
              title="Average Confidence"
              value={`${avgConfidence}%`}
              subtitle="Classifier prediction certainty"
              color="violet"
              icon={<Percent className="w-5 h-5 text-white" />}
            />
            <StatCard
              title="Duplicate Patterns"
              value={(data?.duplicate_count || 0).toLocaleString()}
              subtitle="RapidFuzz fuzzy matches"
              color="amber"
              icon={<Copy className="w-5 h-5 text-white" />}
            />
          </div>

          {/* Charts Row 1: Donut Distribution & Top Suspicious Keywords */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart: Genuine vs Suspicious */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Genuine vs. Suspicious Distribution
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
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

            {/* Bar Chart: Top Suspicious Keywords */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Top Recurring Suspicious Keywords
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  SHAP Attributions
                </span>
              </div>

              <KeywordsBarChart
                data={data?.top_suspicious_keywords || []}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Charts Row 2: Line Chart of Reviews Over Time */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Reviews Analyzed Over Time (Timeline Trend)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Timeline Telemetry
              </span>
            </div>

            <div className="h-72">
              {data?.timeline && data.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.timeline}
                    margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="date" stroke={axisStroke} fontSize={11} />
                    <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="genuine"
                      stroke="var(--color-emerald)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      name="Genuine Reviews"
                    />
                    <Line
                      type="monotone"
                      dataKey="fake"
                      stroke="var(--color-rose)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      name="Suspicious / Fake Reviews"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No timeline telemetry recorded yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
