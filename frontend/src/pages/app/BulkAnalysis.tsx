import React, { useState, useEffect, useRef, useMemo } from 'react';
import { bulkApi } from '../../api';
import { BulkJobStatus } from '../../types';
import { Pagination } from '../../components/ui/Pagination';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  XCircle,
  RotateCcw,
  History as HistoryIcon,
  ArrowUpDown,
} from 'lucide-react';

interface SavedJobRecord {
  id: string;
  filename: string;
  created_at: string;
  total_rows: number;
  status: string;
}

export const BulkAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeJob, setActiveJob] = useState<BulkJobStatus | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Job History
  const [jobHistory, setJobHistory] = useState<SavedJobRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veridex_bulk_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Table filter, sort, expand and pagination states
  const [filterPrediction, setFilterPrediction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<'confidence' | 'rating' | 'prediction'>('confidence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Job startTime for ETA calculation
  const [startTime, setStartTime] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = async (file: File): Promise<string | null> => {
    if (!file.name.endsWith('.csv')) {
      return 'Please upload a CSV (.csv) file.';
    }
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (file.size > MAX_SIZE) {
      return 'File size exceeds maximum allowed limit (10MB).';
    }

    try {
      const slice = file.slice(0, 4096);
      const text = await slice.text();
      const firstLine = text.split('\n')[0].toLowerCase();
      const hasTextCol = ['review_text', 'text', 'review', 'content', 'body', 'comment'].some(
        (col) => firstLine.includes(col)
      );
      if (!hasTextCol) {
        return 'CSV must contain a review text column (e.g. "review_text", "text", or "review").';
      }
    } catch {
      // In case preview read fails, continue to server validation
    }

    return null;
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const err = await validateFile(file);
      if (err) {
        setValidationError(err);
        setSelectedFile(null);
      } else {
        setValidationError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const err = await validateFile(file);
      if (err) {
        setValidationError(err);
        setSelectedFile(null);
      } else {
        setValidationError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setValidationError(null);
    setUploading(true);
    setStartTime(Date.now());
    setCurrentPage(1);
    setExpandedRows(new Set());
    try {
      const job = await bulkApi.uploadBulkCSV(selectedFile);
      setActiveJob(job);

      // Save to job history
      const newHistory: SavedJobRecord[] = [
        {
          id: job.id,
          filename: job.filename,
          created_at: job.created_at || new Date().toISOString(),
          total_rows: job.total_rows,
          status: job.status,
        },
        ...jobHistory.filter((h) => h.id !== job.id),
      ].slice(0, 10);
      setJobHistory(newHistory);
      try {
        localStorage.setItem('veridex_bulk_history', JSON.stringify(newHistory));
      } catch {}
    } catch (err: any) {
      setValidationError(
        err?.response?.data?.detail || 'Failed to upload CSV file. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  // Poll for background job completion
  useEffect(() => {
    if (!activeJob || activeJob.status !== 'processing') {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const updated = await bulkApi.getJobStatus(activeJob.id);
        setActiveJob(updated);
        if (updated.status !== 'processing') {
          clearInterval(timer);
          // Update status in history
          setJobHistory((prev) => {
            const next = prev.map((h) => (h.id === updated.id ? { ...h, status: updated.status } : h));
            try {
              localStorage.setItem('veridex_bulk_history', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to poll bulk job status:', err);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [activeJob?.id, activeJob?.status]);

  const progressPercent = activeJob
    ? activeJob.total_rows > 0
      ? Math.min(100, Math.round((activeJob.processed_rows / activeJob.total_rows) * 100))
      : activeJob.status === 'completed'
      ? 100
      : 15
    : 0;

  // Calculate ETA
  const etaText = useMemo(() => {
    if (!activeJob || activeJob.status !== 'processing' || !startTime) return null;
    if (activeJob.processed_rows <= 0 || activeJob.total_rows <= 0) return 'Estimating...';

    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const rate = activeJob.processed_rows / elapsedSeconds;
    if (rate <= 0) return 'Estimating...';

    const remainingRows = activeJob.total_rows - activeJob.processed_rows;
    const remainingSeconds = Math.round(remainingRows / rate);

    if (remainingSeconds < 5) return 'A few seconds remaining';
    if (remainingSeconds < 60) return `~${remainingSeconds}s remaining`;
    const mins = Math.ceil(remainingSeconds / 60);
    return `~${mins} min remaining`;
  }, [activeJob?.processed_rows, activeJob?.total_rows, activeJob?.status, startTime]);

  const handleDownloadResults = async () => {
    if (!activeJob) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const blob = await bulkApi.downloadResultsCSV(activeJob.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const downloadName = `veridex_${activeJob.filename.replace('.csv', '')}_analyzed.csv`;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
      setDownloadError('Failed to download results CSV. Please check your network connection.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = `review_text,rating,reviewer_id
"BEST HOTEL IN THE WORLD! The pillows are made of angel feathers! Never seen such divine luxury in my entire lifetime! Perfection 100/10 stars!",5,REV-BOT-BURST-01
"We stayed at the hotel for three nights. The location on Michigan Avenue was ideal for walking to Millennium Park. The room was clean, spacious, and the bed was very comfortable.",4,REV-ORGANIC-USER-42
"DO NOT TRUST ANY GOOD REVIEWS! It is a pure mafia scam front! Rat poison in the soup and rude managers. Criminal enterprise that will steal your money!",1,REV-SMEAR-BOT-09
"The pasta carbonara was rich and creamy, with crispy pancetta. Server Marco was attentive and refilled our waters regularly. A bit noisy during lunchtime rush, but solid food.",4,REV-ORGANIC-USER-42
"The bathroom was filthy, water pressure was terrible, and room smelled of damp smoke. Ruined our entire stay.",5,REV-BOT-BURST-01`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'veridex_sample_reviews.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleRowExpanded = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Filtered and sorted results preview
  const filteredAndSortedRows = useMemo(() => {
    if (!activeJob?.results_preview) return [];

    let rows = [...activeJob.results_preview];

    // Filter by prediction
    if (filterPrediction !== 'all') {
      rows = rows.filter((r) => r.prediction.toLowerCase() === filterPrediction.toLowerCase());
    }

    // Filter by search text
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.review_text.toLowerCase().includes(q) ||
          (r.reviewer_id && r.reviewer_id.toLowerCase().includes(q))
      );
    }

    // Sort
    rows.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === 'rating') {
        valA = a.rating ?? 0;
        valB = b.rating ?? 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [activeJob?.results_preview, filterPrediction, searchTerm, sortField, sortOrder]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          Bulk review dataset batch analysis
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Upload CSV files for background processing, deceptive astroturfing detection, and download enriched results with fraud probabilities.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-800 hover:border-indigo-400 bg-white dark:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedFile ? selectedFile.name : 'Drag and drop your CSV file here'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace`
                : 'Or click to browse from your device (Max size: 10MB)'}
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            Supported columns: <span className="font-semibold text-slate-600 dark:text-slate-300">review_text</span> (required), <span className="text-slate-600 dark:text-slate-300">rating</span> (optional 1-5), <span className="text-indigo-600 dark:text-indigo-400 font-semibold">reviewer_id</span> (optional for burst detection)
          </div>
        </div>
      </div>

      {/* Demo Sample CSV Download Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 text-xs">
        <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium">Need a test dataset? Download our pre-configured demo CSV with 5 diverse sample reviews:</span>
        </div>
        <button
          type="button"
          onClick={handleDownloadSampleCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs transition-all hover:scale-102 cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Download sample CSV</span>
        </button>
      </div>

      {validationError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Upload Action Button */}
      {selectedFile && !activeJob && (
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading & validating CSV...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Start batch analysis</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Job Progress & Results Section */}
      {activeJob && (
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Job: {activeJob.filename}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    activeJob.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      : activeJob.status === 'failed'
                      ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                      : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                  }`}
                >
                  {activeJob.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Started {new Date(activeJob.created_at).toLocaleTimeString()} • Processed{' '}
                {activeJob.processed_rows} of {activeJob.total_rows} rows
                {etaText && activeJob.status === 'processing' && (
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium ml-2">
                    ({etaText})
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Cancel button if processing */}
              {activeJob.status === 'processing' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveJob((prev) => (prev ? { ...prev, status: 'failed', error_message: 'Job cancelled by user' } : null));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cancel job</span>
                </button>
              )}

              {/* Retry button if failed */}
              {activeJob.status === 'failed' && (
                <button
                  type="button"
                  onClick={handleUpload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry analysis</span>
                </button>
              )}

              {/* Download Results Button */}
              {activeJob.status === 'completed' && (
                <button
                  type="button"
                  onClick={handleDownloadResults}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 shadow-sm transition-all cursor-pointer"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download results CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Download Error Banner if request fails */}
          {downloadError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{downloadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setDownloadError(null)}
                className="underline hover:text-red-800 dark:hover:text-red-300 ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Batch progress</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                Total rows
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {activeJob.total_rows.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
              <div className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Genuine
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {activeJob.genuine_count.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
              <div className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Suspicious
              </div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {activeJob.suspicious_count.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
              <div className="text-[10px] font-semibold uppercase text-red-700 dark:text-red-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Likely fake
              </div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400 font-mono mt-0.5">
                {activeJob.fake_count.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Results Table with Sorting, Filtering, Expandable Rows, and Pagination */}
          {activeJob.results_preview && activeJob.results_preview.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Sample processed reviews
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing preview rows with token attribution and fraud indicators
                  </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search text or ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Prediction Filter */}
                  <div className="flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={filterPrediction}
                      onChange={(e) => {
                        setFilterPrediction(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All verdicts</option>
                      <option value="genuine">Genuine</option>
                      <option value="suspicious">Suspicious</option>
                      <option value="likely_fake">Likely Fake</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Review text</th>
                      <th
                        className="p-3 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300"
                        onClick={() => {
                          setSortField('rating');
                          setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Rating</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="p-3">Reviewer ID</th>
                      <th
                        className="p-3 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300"
                        onClick={() => {
                          setSortField('prediction');
                          setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Verdict</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="p-3 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300"
                        onClick={() => {
                          setSortField('confidence');
                          setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Confidence</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="p-3">Top keywords</th>
                      <th className="p-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-sans">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          No reviews match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((item, idx) => {
                        const isExpanded = expandedRows.has(idx);
                        return (
                          <React.Fragment key={idx}>
                            <tr
                              onClick={() => toggleRowExpanded(idx)}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                            >
                              <td className="p-3 max-w-xs font-normal">
                                <div className={isExpanded ? '' : 'truncate'} title={item.review_text}>
                                  {item.review_text}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-medium whitespace-nowrap">
                                {item.rating ? `★${item.rating}` : '-'}
                              </td>
                              <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                                {item.reviewer_id || <span className="text-slate-400 italic">N/A</span>}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                    item.prediction === 'genuine'
                                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : item.prediction === 'likely_fake'
                                      ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                                      : 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  }`}
                                >
                                  {item.prediction.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        item.prediction === 'likely_fake'
                                          ? 'bg-rose-500'
                                          : item.prediction === 'suspicious'
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${item.confidence}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-[11px] font-medium">
                                    {item.confidence.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-[11px] text-slate-500 max-w-[140px] truncate">
                                {item.top_suspicious_words && item.top_suspicious_words.length > 0
                                  ? item.top_suspicious_words.join(', ')
                                  : '-'}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpanded(idx);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Detail Row */}
                            {isExpanded && (
                              <tr className="bg-slate-50/80 dark:bg-slate-900/60">
                                <td colSpan={7} className="p-4 space-y-2 border-b border-slate-200 dark:border-slate-800">
                                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                                    <strong className="text-slate-900 dark:text-white">Full Review Text: </strong>
                                    "{item.review_text}"
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 font-mono">
                                    <span>Reviewer: {item.reviewer_id || 'Anonymous'}</span>
                                    {item.reviewer_activity?.burst_detected && (
                                      <span className="text-rose-600 font-semibold">⚠️ Rapid Burst Posting Detected (≤24h)</span>
                                    )}
                                    {item.top_suspicious_words && item.top_suspicious_words.length > 0 && (
                                      <span>Attributed Tokens: {item.top_suspicious_words.join(' • ')}</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={filteredAndSortedRows.length}
                  pageSize={pageSize}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              )}
            </div>
          )}

          {/* New Upload Button */}
          {activeJob.status === 'completed' && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveJob(null);
                  setSelectedFile(null);
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload another CSV dataset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Past Batch Job History */}
      {jobHistory.length > 0 && !activeJob && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <HistoryIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent batch history
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {jobHistory.map((job) => (
              <div key={job.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{job.filename}</span>
                  <span className="text-[11px] text-slate-400 ml-2">
                    {new Date(job.created_at).toLocaleDateString()} • {job.total_rows} rows
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full capitalize bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {job.status}
                  </span>
                  <a
                    href={bulkApi.getDownloadUrl(job.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
