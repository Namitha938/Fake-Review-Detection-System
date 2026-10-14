import React from 'react';
import { KeywordContribution } from '../types';

interface TextHighlighterProps {
  text: string;
  keywords?: KeywordContribution[];
}

export const TextHighlighter: React.FC<TextHighlighterProps> = ({ text, keywords = [] }) => {
  if (!keywords || keywords.length === 0) {
    return <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">{text}</p>;
  }

  // Build a lookup map of lowercase keyword words to keyword object
  const keywordMap = new Map<string, KeywordContribution>();
  keywords.forEach((kw) => {
    keywordMap.set(kw.word.toLowerCase(), kw);
  });

  // Tokenize preserving spaces and punctuation
  const tokens = text.split(/(\s+|[.,!?;:"]+)/);

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed font-sans">
      <div className="flex items-center gap-3 mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/60 inline-block" />
          Suspicious / Astroturf Token
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/60 inline-block" />
          Grounding / Authentic Token
        </span>
      </div>
      <p className="text-slate-800 dark:text-slate-200">
        {tokens.map((token, idx) => {
          const cleanToken = token.trim().toLowerCase();
          const match = keywordMap.get(cleanToken);

          if (match) {
            const isSuspicious = match.is_suspicious || match.score > 0.02;
            const bgClass = isSuspicious
              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';

            return (
              <span
                key={idx}
                className={`group relative inline-block px-1 py-0.5 mx-0.5 rounded border ${bgClass} font-medium cursor-help transition-all hover:scale-105`}
              >
                {token}
                {/* Tooltip on hover */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-52 p-2 rounded-lg bg-slate-900 text-white text-[10px] leading-tight shadow-xl border border-slate-700 pointer-events-none text-center">
                  <span className="font-bold block mb-0.5">
                    {isSuspicious ? '⚠️ Suspicious Anomaly' : '✓ Authentic Anchor'}
                  </span>
                  <span>{match.reason}</span>
                  <span className="block mt-1 text-[9px] text-slate-400 font-mono">
                    Impact: {match.score > 0 ? `+${match.score.toFixed(3)}` : match.score.toFixed(3)}
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
