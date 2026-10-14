import React from 'react';
import { KeywordContribution } from '../types';

interface KeywordPillsProps {
  keywords: KeywordContribution[];
  showReasons?: boolean;
}

export const KeywordPills: React.FC<KeywordPillsProps> = ({ keywords, showReasons = false }) => {
  if (!keywords || keywords.length === 0) {
    return <span className="text-xs text-slate-400 italic">No specific deceptive keywords detected.</span>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, idx) => (
          <span
            key={idx}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 transition-all ${
              kw.is_suspicious
                ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/40 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title={kw.reason || `Impact score: ${kw.score > 0 ? '+' : ''}${kw.score.toFixed(4)}`}
          >
            <span className="font-semibold">{kw.word}</span>
            <span
              className={`text-[10px] px-1 py-0.5 rounded font-mono ${
                kw.score > 0
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {kw.score > 0 ? `+${kw.score.toFixed(3)}` : kw.score.toFixed(3)}
            </span>
          </span>
        ))}
      </div>

      {showReasons && (
        <div className="space-y-1.5 pt-1">
          {keywords
            .filter((kw) => kw.is_suspicious && kw.reason)
            .map((kw, idx) => (
              <div
                key={idx}
                className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800"
              >
                <span className="font-bold font-mono text-red-600 dark:text-red-400">"{kw.word}"</span>
                <span className="text-slate-500 dark:text-slate-400">:</span>
                <span>{kw.reason}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
