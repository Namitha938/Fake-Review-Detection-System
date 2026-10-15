import React from 'react';
import { KeywordContribution } from '../types';

interface TextHighlighterProps {
  text: string;
  keywords?: KeywordContribution[];
}

const COMMON_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'my', 'made', 'of', 'on', 'that', 'the', 'to', 'was',
  'were', 'will', 'with', 'such', 'this', 'we', 'i', 'our', 'had', 'have'
]);

export const TextHighlighter: React.FC<TextHighlighterProps> = ({ text, keywords = [] }) => {
  if (!keywords || keywords.length === 0) {
    return <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">{text}</p>;
  }

  // Filter out low significance keywords and stop words without high weight
  const significantKeywords = keywords.filter((kw) => {
    const wordLower = kw.word.toLowerCase();
    const absScore = Math.abs(kw.score);
    if (COMMON_STOP_WORDS.has(wordLower)) {
      return absScore >= 0.12; // Stopwords must have high weight to highlight
    }
    return absScore >= 0.035; // Significance threshold
  });

  // Build a lookup map of lowercase words to keyword objects
  const keywordMap = new Map<string, KeywordContribution>();
  significantKeywords.forEach((kw) => {
    keywordMap.set(kw.word.toLowerCase(), kw);
  });

  // Tokenize preserving spaces and punctuation
  const tokens = text.split(/(\s+|[.,!?;:"]+)/);

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/80 inline-block" />
            Pushes toward fake (positive SHAP weight)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/80 inline-block" />
            Pushes toward genuine (negative SHAP weight)
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          Showing tokens above significance threshold (≥0.035)
        </span>
      </div>
      <p className="text-slate-800 dark:text-slate-200 leading-loose">
        {tokens.map((token, idx) => {
          const cleanToken = token.trim().toLowerCase();
          const match = keywordMap.get(cleanToken);

          if (match) {
            const isSuspicious = match.is_suspicious || match.score > 0.02;
            const absScore = Math.abs(match.score);

            // Scale opacity intensity by weight
            let style = {};
            let borderClass = '';
            let textClass = '';
            if (isSuspicious) {
              const bgOpacity = Math.min(0.45, Math.max(0.12, absScore * 1.2));
              style = { backgroundColor: `rgba(244, 63, 94, ${bgOpacity})` };
              borderClass = 'border-rose-400/40 dark:border-rose-500/40';
              textClass = 'text-rose-900 dark:text-rose-200';
            } else {
              const bgOpacity = Math.min(0.45, Math.max(0.12, absScore * 1.2));
              style = { backgroundColor: `rgba(16, 185, 129, ${bgOpacity})` };
              borderClass = 'border-emerald-400/40 dark:border-emerald-500/40';
              textClass = 'text-emerald-900 dark:text-emerald-200';
            }

            return (
              <span
                key={idx}
                style={style}
                className={`group relative inline-block px-1 py-0.2 mx-0.5 rounded border ${borderClass} ${textClass} font-semibold cursor-help transition-all`}
              >
                {token}
                {/* Tooltip on hover */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-56 p-2 rounded-lg bg-slate-900 text-white text-[11px] leading-tight shadow-xl border border-slate-700 pointer-events-none text-center">
                  <span className="font-semibold block mb-0.5 text-slate-200">
                    {isSuspicious ? 'Pushes toward deceptive' : 'Supports authentic rating'}
                  </span>
                  <span className="text-slate-300 text-[10px] block">{match.reason || 'Statistical feature weight'}</span>
                  <span className="block mt-1 text-[10px] text-slate-400 font-mono">
                    Weight: {match.score > 0 ? `+${match.score.toFixed(4)}` : match.score.toFixed(4)}
                  </span>
                </span>
              </span>
            );
          }

          return <span key={idx}>{token}</span>;
        })}
      </p>
    </div>
  );
};
