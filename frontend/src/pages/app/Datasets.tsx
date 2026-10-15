import React, { useState, useEffect } from 'react';
import { datasetsApi } from '../../api';
import { Dataset, DatasetPreview } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Database,
  Upload,
  Trash2,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  X,
  Calendar,
  CheckCircle2,
  Tag,
  RefreshCw,
} from 'lucide-react';

export const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview state
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Delete modal state
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await datasetsApi.getDatasets();
      setDatasets(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a valid CSV dataset file.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      await datasetsApi.uploadDataset(uploadName, uploadDesc, uploadFile);
      setShowUploadModal(false);
      setUploadName('');
      setUploadDesc('');
      setUploadFile(null);
      fetchDatasets();
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (id: number) => {
    setPreviewLoading(true);
    try {
      const preview = await datasetsApi.getPreview(id);
      setPreviewData(preview);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load dataset preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!datasetToDelete) return;
    setDeleting(true);
    try {
      await datasetsApi.deleteDataset(datasetToDelete.id);
      setDatasets((prev) => prev.filter((d) => d.id !== datasetToDelete.id));
      if (previewData?.dataset.id === datasetToDelete.id) {
        setPreviewData(null);
      }
      setDatasetToDelete(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete dataset.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <Database className="w-6 h-6" />
            </div>
            Dataset management
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Upload, preview, audit label balances, and manage training corpora for custom model fine-tuning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDatasets}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Upload dataset
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Datasets Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading dataset corpora...</span>
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState
          title="No training datasets available"
          description="Upload a CSV dataset with review text and labels to train custom models."
          actionText="Upload dataset"
          onAction={() => setShowUploadModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((dataset) => {
            const hasLabels = dataset.label_balance && Object.keys(dataset.label_balance).length > 0;
            const entries = hasLabels ? Object.entries(dataset.label_balance!) : [];
            const totalLabels = entries.reduce((acc, [, cnt]) => acc + cnt, 0);

            return (
              <div
                key={dataset.id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {dataset.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">{dataset.filename}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {dataset.row_count.toLocaleString()} rows
                    </span>
                  </div>

                  {dataset.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {dataset.description}
                    </p>
                  )}

                  {/* Label Balance Progress Bar & Badges */}
                  {hasLabels && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Label distribution
                        </span>
                        <span className="font-mono text-slate-400">{totalLabels} annotated</span>
                      </div>

                      {/* Visual stacked bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                        {entries.map(([lbl, cnt]) => {
                          const pct = totalLabels > 0 ? (cnt / totalLabels) * 100 : 0;
                          const isGenuine = lbl === 'genuine' || lbl === '0';
                          return (
                            <div
                              key={lbl}
                              className={`h-full ${isGenuine ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${pct}%` }}
                              title={`${lbl}: ${cnt} (${pct.toFixed(1)}%)`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {entries.map(([lbl, cnt]) => {
                          const isGenuine = lbl === 'genuine' || lbl === '0';
                          const pct = totalLabels > 0 ? ((cnt / totalLabels) * 100).toFixed(0) : '0';
                          return (
                            <span
                              key={lbl}
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold ${
                                isGenuine
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {lbl}: {cnt.toLocaleString()} ({pct}%)
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePreview(dataset.id)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Preview first 10 rows"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDatasetToDelete(dataset)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete dataset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload new dataset corpus"
        description="Provide a CSV file with review text and labels for custom classifier training."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={uploading}
              loadingText="Uploading & profiling..."
              onClick={handleUploadSubmit}
            >
              Upload dataset
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Dataset name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Yelp NYC Restaurants Corpus"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Provide context on origins, review domain, and labelling schema..."
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              CSV file
            </label>
            <input
              type="file"
              required
              accept=".csv"
              onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Required columns: <span className="font-mono font-bold">text</span> or <span className="font-mono font-bold">review_text</span>, plus <span className="font-mono font-bold">label</span> or <span className="font-mono font-bold">deceptive</span>.
            </p>
          </div>
        </form>
      </Modal>

      {/* Dataset Preview Modal */}
      <Modal
        isOpen={!!previewData}
        onClose={() => setPreviewData(null)}
        title={previewData ? `Preview: ${previewData.dataset.name}` : 'Dataset preview'}
        description={
          previewData
            ? `Showing first ${previewData.preview_rows.length} rows of ${previewData.dataset.row_count.toLocaleString()} total`
            : ''
        }
        maxWidth="xl"
        footer={
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setPreviewData(null)}>
              Close
            </Button>
          </div>
        }
      >
        {previewData && (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500">
                <tr>
                  {previewData.columns.map((col) => (
                    <th key={col} className="p-2.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-sans">
                {previewData.preview_rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    {previewData.columns.map((col) => (
                      <td key={col} className="p-2.5 max-w-xs truncate font-mono text-[11px]">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!datasetToDelete}
        onClose={() => setDatasetToDelete(null)}
        title="Delete dataset corpus"
        description={`Are you sure you want to delete "${datasetToDelete?.name}"? Any trained models referencing this dataset will remain, but the raw corpus file will be permanently removed.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDatasetToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              loadingText="Deleting..."
              onClick={handleConfirmDelete}
            >
              Delete dataset
            </Button>
          </div>
        }
      >
        <div className="text-xs text-slate-600 dark:text-slate-400">
          This operation cannot be undone.
        </div>
      </Modal>
    </div>
  );
};
