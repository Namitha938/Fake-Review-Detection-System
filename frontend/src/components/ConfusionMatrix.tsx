import React from 'react';
import { ConfusionMatrix as ConfusionMatrixType } from '../types';

interface ConfusionMatrixProps {
  matrix?: ConfusionMatrixType;
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ matrix }) => {
  if (!matrix) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        Confusion matrix not computed for this run.
      </div>
    );
  }

  const { tp = 0, fp = 0, fn = 0, tn = 0 } = matrix;
  const total = tp + fp + fn + tn || 1;

  const pct = (val: number) => ((val / total) * 100).toFixed(1);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Confusion Matrix (Test Evaluation)
        </h5>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          N = {total.toLocaleString()} samples
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        {/* True Positive (Predicted Fake, Actually Fake) */}
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
          <div className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
            True Positive (TP)
          </div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono my-0.5">
            {tp.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70">
            {pct(tp)}% (Correctly Fake)
          </div>
        </div>

        {/* False Positive (Predicted Fake, Actually Genuine) */}
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60">
          <div className="text-[10px] font-semibold text-red-800 dark:text-red-300 uppercase">
            False Positive (FP)
          </div>
          <div className="text-lg font-black text-red-700 dark:text-red-400 font-mono my-0.5">
            {fp.toLocaleString()}
          </div>
          <div className="text-[10px] text-red-600/80 dark:text-red-400/70">
            {pct(fp)}% (False Alarm)
          </div>
        </div>

        {/* False Negative (Predicted Genuine, Actually Fake) */}
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
          <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase">
            False Negative (FN)
          </div>
          <div className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono my-0.5">
            {fn.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/70">
            {pct(fn)}% (Missed Fake)
          </div>
        </div>

        {/* True Negative (Predicted Genuine, Actually Genuine) */}
        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
          <div className="text-[10px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase">
            True Negative (TN)
          </div>
          <div className="text-lg font-black text-indigo-700 dark:text-indigo-400 font-mono my-0.5">
            {tn.toLocaleString()}
          </div>
          <div className="text-[10px] text-indigo-600/80 dark:text-indigo-400/70">
            {pct(tn)}% (Correctly Genuine)
          </div>
        </div>
      </div>
    </div>
  );
};
