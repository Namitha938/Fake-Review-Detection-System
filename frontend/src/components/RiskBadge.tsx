import React from 'react';
import { ShieldCheck, ShieldAlert, Copy, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  prediction: 'genuine' | 'suspicious' | 'likely_fake' | 'potentially_fake' | string;
  confidence: number;
  isDuplicate?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ prediction, confidence, isDuplicate }) => {
  const normPrediction = prediction.toLowerCase();
  const isLikelyFake = normPrediction === 'likely_fake' || normPrediction === 'potentially_fake';
  const isSuspicious = normPrediction === 'suspicious';
  const isGenuine = normPrediction === 'genuine';

  let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  let label = 'Genuine Review';
  let Icon = ShieldCheck;

  if (isLikelyFake) {
    badgeColor = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
    label = 'Likely Fake';
    Icon = ShieldAlert;
  } else if (isSuspicious) {
    badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    label = 'Suspicious Review';
    Icon = AlertTriangle;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all ${badgeColor}`}
      >
        <Icon className="w-4 h-4" />
        {label} ({confidence.toFixed(1)}%)
      </span>

      {isDuplicate && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <Copy className="w-3.5 h-3.5" /> Duplicate / Repetition Flag
        </span>
      )}
    </div>
  );
};
