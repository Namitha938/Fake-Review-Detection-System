import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize = 10,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1 && !totalRecords) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = totalRecords ? Math.min(currentPage * pageSize, totalRecords) : currentPage * pageSize;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 py-3 ${className}`}>
      {totalRecords !== undefined ? (
        <div>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startRecord}</span> to{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{endRecord}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{totalRecords}</span> entries
        </div>
      ) : (
        <div>
          Page <span className="font-semibold text-slate-700 dark:text-slate-200">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            const showEllipsis = prev && p - prev > 1;
            return (
              <React.Fragment key={p}>
                {showEllipsis && <span className="px-1 text-slate-400">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    p === currentPage
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

