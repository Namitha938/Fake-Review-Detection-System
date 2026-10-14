import React from 'react';
import { ReviewFeatures } from '../types';

interface LinguisticFeaturesTableProps {
  features: ReviewFeatures;
}

export const LinguisticFeaturesTable: React.FC<LinguisticFeaturesTableProps> = ({ features }) => {
  if (!features) return null;

  const rows = [
    { label: 'Word Count', value: features.word_count, desc: 'Total words analyzed' },
    { label: 'Character Count', value: features.char_count, desc: 'Length of input review' },
    { label: 'Avg Word Length', value: `${features.avg_word_length} chars`, desc: 'Linguistic complexity metric' },
    { label: 'Lexical Diversity', value: `${(features.lexical_diversity * 100).toFixed(1)}%`, desc: 'Type-Token ratio (vocabulary richness)' },
    {
      label: 'Exclamation Frequency',
      value: `${features.exclamation_count} (${(features.exclamation_ratio * 100).toFixed(1)}%)`,
      desc: 'Emotional punctuation intensity',
      alert: features.exclamation_ratio > 0.15,
    },
    {
      label: 'Uppercase Shouting Ratio',
      value: `${(features.uppercase_ratio * 100).toFixed(1)}%`,
      desc: 'All-caps word frequency',
      alert: features.uppercase_ratio > 0.15,
    },
    {
      label: 'Suspicious Pattern Score',
      value: `${(features.suspicious_patterns_score * 100).toFixed(1)}%`,
      desc: 'Heuristic exaggeration rating',
      alert: features.suspicious_patterns_score > 0.4,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">NLP Metric</th>
            <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Value</th>
            <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden sm:table-cell">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-2 text-xs font-medium">{r.label}</td>
              <td className="px-4 py-2 font-mono text-xs">
                <span className={r.alert ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-slate-800 dark:text-slate-200'}>
                  {r.value}
                </span>
              </td>
              <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
