import React from 'react';
import { KeywordContribution } from '../types';

interface ShapDivergingChartProps {
  keywords?: KeywordContribution[];
}

export const ShapDivergingChart: React.FC<ShapDivergingChartProps> = ({ keywords = [] }) => {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 italic text-center">
        No significant feature attributions identified for this review.
      </div>
    );
  }

  // Sort by absolute score descending and take top 10 for clean presentation
  const sorted = [...keywords]
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 10);

  const maxAbsScore = Math.max(0.1, ...sorted.map((k) => Math.abs(k.score)));

  return (
    <div className="space-y-4">
      {/* Legend & Subtitle */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
          <span>Supports genuine review (&minus; weight)</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
          <span>Pushes toward deceptive (+ weight)</span>
        </div>
      </div>

      {/* Diverging Bar Chart */}
      <div className="space-y-2.5">
        {sorted.map((item, idx) => {
          const isPositive = item.score > 0;
          const percentage = Math.min(100, (Math.abs(item.score) / maxAbsScore) * 100);

          return (
            <div key={idx} className="group relative grid grid-cols-12 items-center gap-2 text-xs">
              {/* Left label: Word / Token */}
              <div className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300 truncate pr-2 font-mono" title={item.word}>
                {item.word}
              </div>

              {/* Bar area (Diverging around center 50%) */}
              <div className="col-span-7 h-5 bg-slate-100 dark:bg-slate-800/80 rounded-md relative flex items-center overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                {/* Center axis line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600 z-10" />

                {/* Left bar (Negative weight = Genuine = Green) */}
                {!isPositive && (
                  <div
                    className="absolute right-1/2 top-0.5 bottom-0.5 bg-emerald-500/80 hover:bg-emerald-500 rounded-l transition-all duration-500 flex items-center justify-start pl-1 text-[10px] text-white font-mono"
                    style={{ width: `${percentage / 2}%` }}
                  />
                )}

                {/* Right bar (Positive weight = Fake = Red) */}
                {isPositive && (
                  <div
                    className="absolute left-1/2 top-0.5 bottom-0.5 bg-rose-500/80 hover:bg-rose-500 rounded-r transition-all duration-500 flex items-center justify-end pr-1 text-[10px] text-white font-mono"
                    style={{ width: `${percentage / 2}%` }}
                  />
                )}
              </div>

              {/* Right label: Numeric weight */}
              <div className="col-span-2 text-left font-mono text-[11px] font-semibold">
                <span className={isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {item.score > 0 ? `+${item.score.toFixed(3)}` : item.score.toFixed(3)}
                </span>
              </div>

              {/* Hover Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block z-30 w-64 p-2 rounded-lg bg-slate-900 text-white text-[11px] shadow-xl border border-slate-700 pointer-events-none text-center">
                <p className="font-semibold text-slate-100 mb-0.5">"{item.word}"</p>
                <p className="text-slate-300 text-[10px]">{item.reason || (isPositive ? 'Pushes toward deceptive review' : 'Consistent with authentic consumer experience')}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  SHAP Contribution: {item.score > 0 ? `+${item.score.toFixed(4)}` : item.score.toFixed(4)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <span>&larr; Strong authentic signal</span>
        <span>0.0 Baseline</span>
        <span>Strong deceptive signal &rarr;</span>
      </div>
    </div>
  );
};

