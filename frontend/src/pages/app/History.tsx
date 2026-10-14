import React, { useState, useEffect } from 'react';
import { reviewsApi } from '../../api';
import { ReviewAnalysisResult } from '../../types';
import { RiskBadge } from '../../components/RiskBadge';
import { KeywordPills } from '../../components/KeywordPills';
import { LinguisticFeaturesTable } from '../../components/LinguisticFeaturesTable';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Star,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  Copy,
  Calendar,
} from 'lucide-react';

export const History: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<ReviewAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterPrediction, setFilterPrediction] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected item modal detail
  const [selectedRecord, setSelectedRecord] = useState<ReviewAnalysisResult | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewsApi.getHistory({
        prediction: filterPrediction !== 'all' ? filterPrediction : undefined,
        sentiment: filterSentiment !== 'all' ? filterSentiment : undefined,
        search: search.trim() ? search.trim() : undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setHistoryItems(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, filterPrediction, filterSentiment]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this analysis record?')) {
      return;
    }
    setDeletingId(id);
    try {
      await reviewsApi.deleteHistoryRecord(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const sentimentIcon = (label: string) => {
    if (label === 'positive') return <Smile className="w-3.5 h-3.5 text-emerald-500" />;
    if (label === 'negative') return <Frown className="w-3.5 h-3.5 text-red-500" />;
    return <Meh className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <HistoryIcon className="w-6 h-6" />
          </div>
          Saved Review Analysis History
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Search, filter, inspect, and manage all your historical review evaluations and explainability audit logs.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by keywords in review text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={filterPrediction}
              onChange={(e) => {
                setFilterPrediction(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Predictions</option>
              <option value="genuine">Genuine Only</option>
              <option value="suspicious">Suspicious Only</option>
              <option value="likely_fake">Likely Fake Only</option>
            </select>

            <select
              value={filterSentiment}
              onChange={(e) => {
                setFilterSentiment(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table & List View */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading historical analysis records...
          </div>
        ) : historyItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No matching review analyses found.
            </p>
            <p>Try clearing your search query or analyze a new review from the Single Analysis page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Review Excerpt</th>
                  <th className="py-3.5 px-4">Classification</th>
                  <th className="py-3.5 px-4">Sentiment</th>
                  <th className="py-3.5 px-4">Fake Prob</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {historyItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedRecord(item)}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.rating ? (
                        <span className="font-bold text-amber-500 flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {item.rating}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-normal text-slate-900 dark:text-slate-200">
                      {item.review_text}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RiskBadge
                        prediction={item.prediction}
                        confidence={item.confidence}
                        isDuplicate={item.is_duplicate}
                      />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium capitalize">
                        {sentimentIcon(item.sentiment_label)}
                        {item.sentiment_label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                      <span
                        className={
                          item.fake_probability > 0.6
                            ? 'text-red-600 dark:text-red-400'
                            : item.fake_probability > 0.4
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {(item.fake_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.id && (
                          <button
                            onClick={() => handleDelete(item.id!)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} • Showing up to {limit} records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={historyItems.length < limit}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RiskBadge
                  prediction={selectedRecord.prediction}
                  confidence={selectedRecord.confidence}
                  isDuplicate={selectedRecord.is_duplicate}
                />
                {selectedRecord.rating && (
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {selectedRecord.rating} Stars
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Full Review Text:
                </span>
                <p className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm leading-relaxed">
                  {selectedRecord.review_text}
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Fake Probability
                  </span>
                  <span className="text-base font-bold text-red-500 font-mono">
                    {(selectedRecord.fake_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Confidence
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {selectedRecord.confidence.toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Sentiment
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1">
                    {sentimentIcon(selectedRecord.sentiment_label)}
                    {selectedRecord.sentiment_label}
                  </span>
                </div>
              </div>

              {/* SHAP Keywords */}
              {selectedRecord.suspicious_keywords && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Contributing Keywords & Explanations:
                  </span>
                  <KeywordPills keywords={selectedRecord.suspicious_keywords} showReasons={true} />
                </div>
              )}

              {/* Linguistic features */}
              {selectedRecord.features && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Linguistic Forensic Metrics:
                  </span>
                  <LinguisticFeaturesTable features={selectedRecord.features} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

