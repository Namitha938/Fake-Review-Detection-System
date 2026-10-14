import React, { useState } from 'react';
import { reviewsApi } from '../api';
import { ReviewAnalysisResult } from '../types';
import { RiskBadge } from './RiskBadge';
import { KeywordPills } from './KeywordPills';
import {
  Scale,
  Sparkles,
  Star,
  Activity,
  AlertTriangle,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const ReviewComparer: React.FC = () => {
  const [textA, setTextA] = useState(
    'BEST ITEM EVER MADE IN HISTORY! LIFE CHANGING MIRACLE 100/10 STARS BUY NOW IMMEDIATELY!!!'
  );
  const [ratingA, setRatingA] = useState<number | null>(5);

  const [textB, setTextB] = useState(
    'I purchased this unit two weeks ago. Build quality is solid with aluminum chassis. Battery lasts around 8 hours under normal office workloads. The trackpad click is slightly stiff, but overall pleased with performance.'
  );
  const [ratingB, setRatingB] = useState<number | null>(4);

  const [loading, setLoading] = useState(false);
  const [resultA, setResultA] = useState<ReviewAnalysisResult | null>(null);
  const [resultB, setResultB] = useState<ReviewAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const comparisonPresets = [
    {
      title: 'Astroturf vs Verified Buyer',
      desc: 'High-pressure shilling vs organic measured review',
      textA: 'BEST ITEM EVER MADE IN HISTORY! LIFE CHANGING MIRACLE 100/10 STARS BUY NOW IMMEDIATELY!!!',
      ratingA: 5,
      textB: 'I purchased this unit two weeks ago. Build quality is solid with aluminum chassis. Battery lasts around 8 hours under normal office workloads. The trackpad click is slightly stiff, but overall pleased with performance.',
      ratingB: 4,
    },
    {
      title: 'Competitor Smear vs Balanced Critical',
      desc: '1-star fake attack vs constructive critique',
      textA: 'DO NOT TRUST THIS SCAM COMPANY! Complete garbage fraud illegal company buy from brand X instead!',
      ratingA: 1,
      textB: 'While the design is modern, the zipper on the outer pocket jammed on day 3. Customer support answered my ticket within 24 hours and shipped a replacement. Respectable service.',
      ratingB: 3,
    },
    {
      title: '5-Star Dissonance vs Real 5-Star',
      desc: 'Defective product disguised with 5 stars vs genuine praise',
      textA: 'Worst purchase of my life. Arrived broken in half, customer care was rude and refused my refund. Totally useless product.',
      ratingA: 5,
      textB: 'The wireless earbuds connected instantly to both my phone and laptop. Noise cancellation cuts out subway rumble effectively. Comfortable for long flights.',
      ratingB: 5,
    },
  ];

  const handleCompare = async () => {
    if (!textA.trim() || !textB.trim()) {
      setError('Please provide text for both Review A and Review B.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        reviewsApi.analyzeSingle(textA, ratingA),
        reviewsApi.analyzeSingle(textB, ratingB),
      ]);
      setResultA(resA);
      setResultB(resB);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Comparison analysis failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const delta =
    resultA && resultB
      ? Math.abs((resultA.fake_probability - resultB.fake_probability) * 100).toFixed(1)
      : null;

  const moreCredible =
    resultA && resultB
      ? resultA.fake_probability < resultB.fake_probability
        ? 'A'
        : resultB.fake_probability < resultA.fake_probability
        ? 'B'
        : 'TIE'
      : null;

  return (
    <div className="space-y-6">
      {/* Comparison Presets */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs backdrop-blur-sm">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2.5">
          Select a Benchmark Comparison Preset:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {comparisonPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTextA(preset.textA);
                setRatingA(preset.ratingA);
                setTextB(preset.textB);
                setRatingB(preset.ratingB);
              }}
              className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {preset.title}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {preset.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Dual Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review A Panel */}
        <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Review A
            </span>
            {/* Rating Selector */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingA(ratingA === star ? null : star)}
                  className={`p-0.5 ${ratingA && star <= ratingA ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              ))}
              {ratingA && <span className="text-[11px] font-bold text-amber-500 ml-1">★{ratingA}</span>}
            </div>
          </div>
          <textarea
            rows={5}
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Enter review A text..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Review B Panel */}
        <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider">
              Review B
            </span>
            {/* Rating Selector */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingB(ratingB === star ? null : star)}
                  className={`p-0.5 ${ratingB && star <= ratingB ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              ))}
              {ratingB && <span className="text-[11px] font-bold text-amber-500 ml-1">★{ratingB}</span>}
            </div>
          </div>
          <textarea
            rows={5}
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Enter review B text..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Compare Action Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCompare}
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all hover:scale-102"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Executing Dual Forensic Analysis...
            </>
          ) : (
            <>
              <Scale className="w-4 h-4" />
              Compare Reviews Side-by-Side
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* COMPARISON RESULTS */}
      {resultA && resultB && (
        <div className="space-y-6 animate-fade-in pt-4">
          {/* Winner Banner */}
          <div className="p-6 rounded-3xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/80 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/30 shadow-md text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Authenticity Duel Winner: Review {moreCredible}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {moreCredible === 'A'
                ? `Review A is ${delta}% more authentic and credible than Review B`
                : moreCredible === 'B'
                ? `Review B is ${delta}% more authentic and credible than Review A`
                : 'Both reviews demonstrate equivalent deception probability'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Evaluation synthesized across machine learning classifiers, sentiment rating concordance, and
              linguistic hyperbole heuristics.
            </p>
          </div>

          {/* Side-by-Side Cards Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card A Verdict */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">Review A Verdict</span>
                <RiskBadge
                  prediction={resultA.prediction}
                  confidence={resultA.confidence}
                  isDuplicate={resultA.is_duplicate}
                />
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-slate-500">Deception Probability</span>
                  <span className={resultA.fake_probability > 0.5 ? 'text-red-500' : 'text-emerald-500'}>
                    {(resultA.fake_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div className="bg-emerald-500" style={{ width: `${(1 - resultA.fake_probability) * 100}%` }} />
                  <div className="bg-red-500" style={{ width: `${resultA.fake_probability * 100}%` }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Sentiment</span>
                  <span className="font-bold">{resultA.sentiment_label}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Words</span>
                  <span className="font-bold">{resultA.features?.word_count || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Lexical Div.</span>
                  <span className="font-bold">{((resultA.features?.lexical_diversity || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Keywords */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Keywords Identified
                </span>
                <KeywordPills keywords={resultA.suspicious_keywords} showReasons={false} />
              </div>
            </div>

            {/* Card B Verdict */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-violet-600 dark:text-violet-400">Review B Verdict</span>
                <RiskBadge
                  prediction={resultB.prediction}
                  confidence={resultB.confidence}
                  isDuplicate={resultB.is_duplicate}
                />
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-slate-500">Deception Probability</span>
                  <span className={resultB.fake_probability > 0.5 ? 'text-red-500' : 'text-emerald-500'}>
                    {(resultB.fake_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div className="bg-emerald-500" style={{ width: `${(1 - resultB.fake_probability) * 100}%` }} />
                  <div className="bg-red-500" style={{ width: `${resultB.fake_probability * 100}%` }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Sentiment</span>
                  <span className="font-bold">{resultB.sentiment_label}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Words</span>
                  <span className="font-bold">{resultB.features?.word_count || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Lexical Div.</span>
                  <span className="font-bold">{((resultB.features?.lexical_diversity || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Keywords */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Keywords Identified
                </span>
                <KeywordPills keywords={resultB.suspicious_keywords} showReasons={false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

