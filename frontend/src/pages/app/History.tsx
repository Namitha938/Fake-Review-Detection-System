import React, { useState, useEffect, useMemo } from 'react';
import { reviewsApi } from '../../api';
import { ReviewAnalysisResult } from '../../types';
import { RiskBadge } from '../../components/RiskBadge';
import { ShapDivergingChart } from '../../components/ShapDivergingChart';
import { LinguisticFeaturesTable } from '../../components/LinguisticFeaturesTable';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { generateCertificate } from '../../utils/generateCertificate';
import { useAuth } from '../../auth/AuthContext';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  Eye,
  X,
  Star,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  Copy,
  Calendar,
  Download,
  CheckCircle2,
  FileText,
  Check,
  RotateCcw,
} from 'lucide-react';

export const History: React.FC = () => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<ReviewAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterPrediction, setFilterPrediction] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Right-side detail drawer
  const [selectedRecord, setSelectedRecord] = useState<ReviewAnalysisResult | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewsApi.getHistory({
        prediction: filterPrediction !== 'all' ? filterPrediction : undefined,
        sentiment: filterSentiment !== 'all' ? filterSentiment : undefined,
        search: search.trim() ? search.trim() : undefined,
        limit: 100, // Fetch up to 100 to support client-side date filter & pagination
        offset: 0,
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
  }, [filterPrediction, filterSentiment]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  // Date filtering
  const filteredByDate = useMemo(() => {
    if (dateFilter === 'all') return historyItems;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return historyItems.filter((item) => {
      const itemTime = new Date(item.created_at).getTime();
      if (dateFilter === 'today') {
        return now - itemTime <= dayMs;
      }
      if (dateFilter === '7days') {
        return now - itemTime <= 7 * dayMs;
      }
      if (dateFilter === '30days') {
        return now - itemTime <= 30 * dayMs;
      }
      return true;
    });
  }, [historyItems, dateFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredByDate.length / limit));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredByDate.slice(start, start + limit);
  }, [filteredByDate, page, limit]);

  // Toggle select single item
  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle select all on current page
  const toggleSelectAll = () => {
    const pageIds = paginatedItems.map((item) => item.id).filter(Boolean) as number[];
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Bulk delete execution
  const executeBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      for (const id of idsToDelete) {
        try {
          await reviewsApi.deleteHistoryRecord(id);
        } catch {}
      }
      setHistoryItems((prev) => prev.filter((item) => !item.id || !selectedIds.has(item.id)));
      if (selectedRecord && selectedRecord.id && selectedIds.has(selectedRecord.id)) {
        setSelectedRecord(null);
      }
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
    } catch (err: any) {
      alert('Failed to delete selected records.');
    } finally {
      setIsDeleting(false);
    }
  };

  const sentimentIcon = (label: string) => {
    if (label === 'positive') return <Smile className="w-3.5 h-3.5 text-emerald-500" />;
    if (label === 'negative') return <Frown className="w-3.5 h-3.5 text-rose-500" />;
    return <Meh className="w-3.5 h-3.5 text-amber-500" />;
  };

  const handleExportHistoryCSV = () => {
    if (!historyItems || historyItems.length === 0) return;
    const headers = ['id', 'created_at', 'prediction', 'fake_probability', 'confidence', 'rating', 'reviewer_id', 'sentiment_label', 'review_text'];
    const rows = historyItems.map(item => [
      item.id,
      `"${item.created_at}"`,
      `"${item.prediction}"`,
      (item.fake_probability * 100).toFixed(1) + '%',
      item.confidence.toFixed(1) + '%',
      item.rating ?? '',
      `"${item.reviewer_id ?? ''}"`,
      `"${item.sentiment_label}"`,
      `"${item.review_text.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `veridex_audit_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = (item: ReviewAnalysisResult) => {
    const summary = `--- VERIDEX AUDIT REPORT VRX-${item.id} ---
Date: ${new Date(item.created_at).toLocaleString()}
Verdict: ${item.prediction.toUpperCase()}
Deception Probability: ${(item.fake_probability * 100).toFixed(1)}%
Sentiment: ${item.sentiment_label.toUpperCase()} (${item.sentiment_score})
Review: "${item.review_text}"`;
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <HistoryIcon className="w-6 h-6" />
            </div>
            Review analysis history
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Search, filter, and inspect past review evaluations with full attribution records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete selected ({selectedIds.size})</span>
            </button>
          )}

          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={handleExportHistoryCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors"
              title="Download records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search review text or reviewer ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7days">Past 7 days</option>
              <option value="30days">Past 30 days</option>
            </select>

            {/* Verdict filter */}
            <select
              value={filterPrediction}
              onChange={(e) => {
                setFilterPrediction(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All verdicts</option>
              <option value="genuine">Genuine only</option>
              <option value="suspicious">Suspicious only</option>
              <option value="likely_fake">Likely fake only</option>
            </select>

            {/* Sentiment filter */}
            <select
              value={filterSentiment}
              onChange={(e) => {
                setFilterSentiment(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All sentiments</option>
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

      {/* Table Card View */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading historical analysis records...</span>
          </div>
        ) : filteredByDate.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No matching review analyses found.
            </p>
            <p>Try clearing your search query or analyze a new review from the Single Analysis page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        paginatedItems.length > 0 &&
                        paginatedItems.every((item) => !!item.id && selectedIds.has(item.id))
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3">Rating</th>
                  <th className="py-3.5 px-4">Review excerpt</th>
                  <th className="py-3.5 px-3">Verdict</th>
                  <th className="py-3.5 px-3">Deception risk</th>
                  <th className="py-3.5 px-3">Sentiment</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {paginatedItems.map((item) => {
                  const isSelected = !!item.id && selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRecord(item)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => item.id && toggleSelectId(item.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.rating ? (
                          <span className="font-semibold text-amber-500 flex items-center gap-0.5">
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
                      <td className="py-3 px-3 whitespace-nowrap">
                        <RiskBadge
                          prediction={item.prediction}
                          confidence={item.confidence}
                          isDuplicate={item.is_duplicate}
                        />
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${
                                item.fake_probability > 0.6
                                  ? 'bg-rose-500'
                                  : item.fake_probability > 0.4
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(4, item.fake_probability * 100)}%` }}
                            />
                          </div>
                          <span
                            className={`font-semibold ${
                              item.fake_probability > 0.6
                                ? 'text-rose-600 dark:text-rose-400'
                                : item.fake_probability > 0.4
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {(item.fake_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-medium capitalize text-[11px]">
                          {sentimentIcon(item.sentiment_label)}
                          {item.sentiment_label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(item)}
                          className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
                          title="Inspect details"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={filteredByDate.length}
              pageSize={limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* RIGHT-SIDE DETAIL DRAWER */}
      {selectedRecord && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setSelectedRecord(null)}
            aria-hidden="true"
          />

          <aside
            aria-label="Review detail drawer"
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <RiskBadge
                  prediction={selectedRecord.prediction}
                  confidence={selectedRecord.confidence}
                  isDuplicate={selectedRecord.is_duplicate}
                />
                <span className="font-mono text-xs text-slate-400">
                  VRX-{selectedRecord.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
              {/* Full Review Text */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Review text
                </span>
                <p className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
                  "{selectedRecord.review_text}"
                </p>
              </div>

              {/* Core Score Indicators */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] font-medium uppercase">
                    Deception probability
                  </span>
                  <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                    {(selectedRecord.fake_probability * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] font-medium uppercase">
                    Classifier confidence
                  </span>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {selectedRecord.confidence.toFixed(1)}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] font-medium uppercase">
                    Sentiment polarity
                  </span>
                  <div className="text-sm font-semibold capitalize text-slate-900 dark:text-white flex items-center gap-1.5">
                    {sentimentIcon(selectedRecord.sentiment_label)}
                    {selectedRecord.sentiment_label} ({selectedRecord.sentiment_score})
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] font-medium uppercase">
                    Reviewer identity
                  </span>
                  <div className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate">
                    {selectedRecord.reviewer_id || 'Anonymous'}
                  </div>
                </div>
              </div>

              {/* SHAP Diverging Weights Chart */}
              {selectedRecord.suspicious_keywords && selectedRecord.suspicious_keywords.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">
                    Token feature weights (SHAP)
                  </span>
                  <ShapDivergingChart keywords={selectedRecord.suspicious_keywords} />
                </div>
              )}

              {/* Reviewer Behavioral Anomaly flags */}
              {selectedRecord.reviewer_activity && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Reviewer activity check
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {selectedRecord.reviewer_activity.burst_detected
                      ? '⚠️ High frequency posting burst flagged within 24h window'
                      : '✓ Normal cadence, no abnormal burst activity'}
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleCopySummary(selectedRecord)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Copied' : 'Copy report'}</span>
              </button>

              <button
                type="button"
                onClick={() => generateCertificate(selectedRecord, user)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download certificate</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        title="Confirm record deletion"
        description={`Are you sure you want to delete ${selectedIds.size} selected evaluation record(s)? This action cannot be undone.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setBulkDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              loadingText="Deleting..."
              onClick={executeBulkDelete}
            >
              Delete records
            </Button>
          </div>
        }
      >
        <div className="text-xs text-slate-600 dark:text-slate-400">
          The selected records will be permanently removed from your historical database and analytics summaries.
        </div>
      </Modal>
    </div>
  );
};
