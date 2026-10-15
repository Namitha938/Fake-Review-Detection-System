import React, { useState, useEffect, useRef } from 'react';
import { bulkApi } from '../../api';
import { BulkJobStatus } from '../../types';
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
} from 'lucide-react';

export const BulkAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeJob, setActiveJob] = useState<BulkJobStatus | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Table filter states
  const [filterPrediction, setFilterPrediction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = async (file: File): Promise<string | null> => {
    if (!file.name.endsWith('.csv')) {
      return 'Please upload a CSV (.csv) file.';
    }
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (file.size > MAX_SIZE) {
      return 'File size exceeds maximum allowed limit (10MB).';
    }

    // Quick client-side header check
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
    try {
      const job = await bulkApi.uploadBulkCSV(selectedFile);
      setActiveJob(job);
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
      const status = err?.response?.status;
      const statusText = err?.response?.statusText || '';
      const detail = err?.response?.data?.detail;
      const msg = status
        ? `Failed to download results CSV (HTTP ${status}${statusText ? ' ' + statusText : ''}${detail ? ': ' + detail : ''}).`
        : 'Failed to download results CSV. Please check your network connection.';
      setDownloadError(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = `review_text,rating,reviewer_id
"BEST HOTEL IN THE WORLD! The pillows are made of angel feathers! Never seen such divine luxury in my entire lifetime! Perfection 100/10 stars!",5,REV-BOT-BURST-01
"We stayed for three nights during our family trip to Chicago. Location near Millennium Park was great. The room was clean, bed was comfortable, and staff helped with luggage quickly.",4,REV-ORGANIC-USER-42
"The bathroom was filthy, water pressure was terrible, and room smelled of damp smoke. Ruined our entire stay.",5,REV-DISSONANT-99
"TOTAL SCAM!! The owner is a criminal and thief who stole our money!! Pure poison and disgusting mafia operation!!",1,REV-SMEAR-BOT-09
"The breakfast buffet was fresh with lots of fruit and hot eggs. Nice quiet room on the 8th floor.",4,REV-ORGANIC-USER-42
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'veridex_demo_sample_reviews.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          Bulk Review Dataset Batch Analysis
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Upload multi-thousand row CSV files for high-throughput background processing, deceptive
          astroturfing detection, and download enriched results with fraud probabilities.
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
            Supported columns: <span className="font-semibold text-slate-600 dark:text-slate-300">review_text</span> (required), <span className="text-slate-600 dark:text-slate-300">rating</span> (optional 1-5), <span className="text-indigo-600 dark:text-indigo-400 font-semibold">reviewer_id</span> (optional for burst detection), <span className="text-slate-600 dark:text-slate-300">date</span> (optional)
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
          <span>Download Sample CSV</span>
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading & Validating CSV...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Start Background Batch Analysis
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
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
              </p>
            </div>

            {/* Download Results Button */}
            {activeJob.status === 'completed' && (
              <button
                type="button"
                onClick={handleDownloadResults}
                disabled={isDownloading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download Results CSV
              </button>
            )}
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
              <span>Batch Progress</span>
              <span>{progressPercent}%</span>
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
                Total Rows
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {activeJob.total_rows.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
              <div className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Genuine
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {activeJob.genuine_count.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
              <div className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Suspicious
              </div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {activeJob.suspicious_count.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
              <div className="text-[10px] font-semibold uppercase text-red-700 dark:text-red-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Likely Fake
              </div>
              <div className="text-xl font-black text-red-600 dark:text-red-400 font-mono mt-0.5">
                {activeJob.fake_count.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Batch Preview Table with Reviewer Forensics */}
          {activeJob.results_preview && activeJob.results_preview.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Sample Processed Reviews ({activeJob.results_preview.length} rows preview)
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Full dataset available in CSV download
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Review Text</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Reviewer ID</th>
                      <th className="p-3">Burst Status</th>
                      <th className="p-3">Prediction</th>
                      <th className="p-3">Confidence</th>
                      <th className="p-3">Top Attributions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-sans">
                    {activeJob.results_preview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 max-w-xs truncate" title={item.review_text}>
                          {item.review_text}
                        </td>
                        <td className="p-3 font-mono">
                          {item.rating ? `★${item.rating}` : '-'}
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {item.reviewer_id || <span className="text-slate-400 italic">N/A</span>}
                        </td>
                        <td className="p-3">
                          {item.reviewer_activity?.burst_detected ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                              BURST (≤24h)
                            </span>
                          ) : item.reviewer_id ? (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Normal
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
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
                        <td className="p-3 font-mono font-semibold">
                          {(item.confidence).toFixed(1)}%
                        </td>
                        <td className="p-3 text-[11px] text-slate-500 max-w-[150px] truncate">
                          {item.top_suspicious_words && item.top_suspicious_words.length > 0
                            ? item.top_suspicious_words.join(', ')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* New Upload Button */}
          {activeJob.status === 'completed' && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setActiveJob(null);
                  setSelectedFile(null);
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload Another CSV Dataset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

