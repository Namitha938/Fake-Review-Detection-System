import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { reviewsApi, modelsApi } from '../../api';
import { ReviewAnalysisResult, ModelRecord } from '../../types';
import {
  ShieldAlert,
  Search,
  UploadCloud,
  Cpu,
  BarChart2,
  CheckCircle2,
  Sparkles,
  Layers,
  Zap,
  ArrowRight,
  Smile,
  Frown,
  Meh,
  Copy,
  Database,
  Lock,
  Compass,
  FileText,
  HelpCircle,
  ShieldCheck,
  Activity,
  SlidersHorizontal,
  Check,
  TrendingUp,
  Star,
  RefreshCw,
  AlertTriangle,
  Play,
  Megaphone,
  Scale,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // Helper to generate authenticated or login-redirect link
  const getAppPath = (targetAppPath: string) => {
    if (user) return targetAppPath;
    return `/login?next=${encodeURIComponent(targetAppPath)}`;
  };

  const [activeModel, setActiveModel] = useState<ModelRecord | null>(null);
  const [sandboxText, setSandboxText] = useState(
    'BEST HOTEL IN THE WORLD! The pillows are made of angel feathers! Never seen such divine luxury in my entire lifetime! Perfection 100/10 stars!'
  );
  const [sandboxRating, setSandboxRating] = useState<number | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<ReviewAnalysisResult | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number | null>(null);

  // Sync document title and meta tags for landing page
  useEffect(() => {
    document.title = 'Veridex — Every verdict backed by evidence';
    const desc = 'Explainable fake-review detection with word-level reasoning for every result.';
    let metaTag = document.querySelector('meta[name="description"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'description');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', desc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Veridex — Every verdict backed by evidence');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', 'Veridex — Every verdict backed by evidence');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', desc);
  }, []);

  // Fetch active model from the modelsApi endpoint (/models/runs)
  useEffect(() => {
    let isMounted = true;
    modelsApi
      .getModels()
      .then((models) => {
        if (!isMounted || !models || !Array.isArray(models)) return;
        const active = models.find((m) => m.is_active);
        if (active) {
          setActiveModel(active);
        }
      })
      .catch(() => {
        // If endpoint is unavailable or unauthorized, hide the cards
        if (isMounted) setActiveModel(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const presets = [
    {
      label: 'Astroturf spam',
      icon: Megaphone,
      rating: 5,
      text: 'BEST HOTEL IN THE WORLD! The pillows are made of angel feathers! Never seen such divine luxury in my entire lifetime! Perfection 100/10 stars!',
    },
    {
      label: 'Genuine stay',
      icon: CheckCircle2,
      rating: 4,
      text: 'We stayed for three nights during our family trip to Chicago. Location near Millennium Park was great. The room was clean, bed was comfortable, and staff helped with luggage quickly.',
    },
    {
      label: 'Rating dissonance',
      icon: Scale,
      rating: 5,
      text: 'The bathroom was filthy, water pressure was terrible, and room smelled of damp smoke. Ruined our entire stay.',
    },
    {
      label: 'Smear attack',
      icon: AlertTriangle,
      rating: 1,
      text: 'TOTAL SCAM!! The owner is a criminal and thief who stole our money!! Pure poison and disgusting mafia operation!!',
    },
  ];

  const handleTestSandbox = async (textToTest?: string, ratingToTest?: number | null) => {
    const text = textToTest !== undefined ? textToTest : sandboxText;
    const r = ratingToTest !== undefined ? ratingToTest : sandboxRating;
    if (!text.trim()) return;
    setSandboxLoading(true);
    setSandboxError(null);
    const startTime = performance.now();
    try {
      const res = await reviewsApi.analyzePublicSandbox(text, r);
      setSandboxResult(res);
      setInferenceTimeMs(Math.round(performance.now() - startTime));
    } catch (err: any) {
      setSandboxError(err?.response?.data?.detail || 'Failed to analyze review in sandbox.');
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* ========================================================
          1. HOME / HERO SECTION (#home)
         ======================================================== */}
      <section
        id="home"
        className="relative overflow-hidden pt-4 pb-8 sm:pt-6 sm:pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950"
      >
        {/* Soft Blurred Ambient Gradient Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[44rem] h-[26rem] bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-fuchsia-500/15 blur-3xl rounded-full animate-pulse-glow" />
          <div className="absolute top-1/4 -left-24 w-80 h-80 bg-indigo-600/15 dark:bg-indigo-600/20 blur-3xl rounded-full" />
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-fuchsia-500/15 dark:bg-fuchsia-500/15 blur-3xl rounded-full" />
        </div>

        <div className="relative max-w-5xl mx-auto space-y-4 sm:space-y-5">
          {/* Headline & Subtitle */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Review authenticity verification</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight max-w-3xl mx-auto [text-wrap:balance]">
              Every verdict{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                backed by evidence
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Explainable fake-review detection with word-level reasoning for every result.
            </p>
          </div>

          {/* Active Model Stat Cards (2 compact cards - rendered only if active model is fetched) */}
          {activeModel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-0.5">
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs text-left flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Cpu className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active model</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 truncate">
                    {activeModel.model_name}
                  </div>
                  <span className="text-[10px] text-slate-400">Held-out test evaluation</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex-shrink-0">
                  Active
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs text-left flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Test accuracy</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                    {(activeModel.accuracy * 100).toFixed(1)}% accuracy · {(activeModel.f1_score * 100).toFixed(1)}% F1
                  </div>
                  <span className="text-[10px] text-slate-400">Evaluated on test set</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              LIVE INTERACTIVE SANDBOX CARD (Direct in Hero)
             ======================================================== */}
          <div className="p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-md space-y-4 text-left transition-all">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Live Forensic Sandbox
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                      Free, no sign-in needed
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test any review or select a sample to see real-time classification with word-level SHAP explainability.
                  </p>
                </div>
              </div>

              {/* Star Rating Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-medium">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSandboxRating(sandboxRating === star ? null : star)}
                    aria-label={`Select ${star} star rating`}
                    className="p-0.5 focus:outline-hidden transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        sandboxRating !== null && star <= sandboxRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                {sandboxRating !== null && (
                  <button
                    type="button"
                    onClick={() => setSandboxRating(null)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Samples Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Samples</span>
              {presets.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSandboxText(p.text);
                      setSandboxRating(p.rating);
                      handleTestSandbox(p.text, p.rating);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all hover:scale-102 cursor-pointer active:scale-95"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Textarea with Character Counter & Shortcut */}
            <div className="relative">
              <textarea
                value={sandboxText}
                onChange={(e) => setSandboxText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!sandboxLoading && sandboxText.trim()) {
                      handleTestSandbox();
                    }
                  }
                }}
                maxLength={1000}
                rows={3}
                placeholder="Paste or type customer review text here to test..."
                className="w-full p-3.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-900 dark:text-white resize-y transition-all outline-none"
              />
              <div className="flex items-center justify-between text-[11px] px-1 pt-1">
                <span
                  className={`transition-colors ${
                    sandboxText.length >= 1000
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : sandboxText.length >= 800
                      ? 'text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  {sandboxText.length} / 1000 characters •{' '}
                  {sandboxText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  {sandboxText.length >= 800 ? 'Approaching character limit' : 'Ctrl + Enter to analyze'}
                </span>
              </div>
            </div>

            {/* Analyze Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestSandbox()}
                  disabled={sandboxLoading || !sandboxText.trim()}
                  className="sticky bottom-2 z-10 sm:static inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all hover:scale-102 active:scale-[.99] cursor-pointer"
                >
                  {sandboxLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Analyze review
                    </>
                  )}
                </button>
                {sandboxResult && (
                  <button
                    type="button"
                    onClick={() => {
                      setSandboxResult(null);
                      setSandboxError(null);
                      setInferenceTimeMs(null);
                    }}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Clear results
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Cpu className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span>{activeModel?.model_name || 'Active production classifier'}</span>
                {inferenceTimeMs !== null && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                      Analyzed in {inferenceTimeMs} ms
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {sandboxError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{sandboxError}</span>
              </div>
            )}

            {/* Skeleton Loader while inference runs */}
            {sandboxLoading && (
              <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 animate-pulse" role="status" aria-label="Analyzing review...">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden" />
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-16" />
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-16" />
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-16" />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
              </div>
            )}

            {/* Sandbox Result Card */}
            {sandboxResult && !sandboxLoading && (
              <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
                {/* Header Verdict & Probabilities */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Color-Coded Verdict Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border uppercase ${
                        sandboxResult.prediction.toLowerCase().includes('fake')
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          : sandboxResult.prediction.toLowerCase().includes('suspicious')
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {sandboxResult.prediction.toLowerCase().includes('fake') ? (
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                      ) : sandboxResult.prediction.toLowerCase().includes('suspicious') ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      )}
                      {sandboxResult.prediction.toUpperCase()} ({sandboxResult.confidence.toFixed(1)}% Confidence)
                    </span>

                    {sandboxRating !== null &&
                      ((sandboxRating >= 4 && sandboxResult.sentiment_label === 'negative') ||
                        (sandboxRating <= 2 && sandboxResult.sentiment_label === 'positive')) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> Rating Dissonance
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Deception Risk:{' '}
                    <span
                      className={
                        sandboxResult.fake_probability > 0.65
                          ? 'text-rose-600 dark:text-rose-400'
                          : sandboxResult.fake_probability > 0.35
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }
                    >
                      {(sandboxResult.fake_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Animated Confidence Progress Meter */}
                <div className="space-y-1">
                  <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${
                        sandboxResult.fake_probability > 0.65
                          ? 'bg-rose-500'
                          : sandboxResult.fake_probability > 0.35
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, sandboxResult.fake_probability * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0% (Genuine)</span>
                    <span>35% (Suspicious Threshold)</span>
                    <span>65% (Likely Fake)</span>
                    <span>100% (High Risk)</span>
                  </div>
                </div>

                {/* Signals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">VADER Sentiment</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1.5 mt-0.5">
                      {sandboxResult.sentiment_label === 'positive' ? (
                        <Smile className="w-4 h-4 text-emerald-500" />
                      ) : sandboxResult.sentiment_label === 'negative' ? (
                        <Frown className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Meh className="w-4 h-4 text-amber-500" />
                      )}
                      {sandboxResult.sentiment_label} ({sandboxResult.sentiment_score > 0 ? `+${sandboxResult.sentiment_score}` : sandboxResult.sentiment_score})
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Lexical Diversity (TTR)</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {sandboxResult.features?.lexical_diversity ? `${(sandboxResult.features.lexical_diversity * 100).toFixed(0)}%` : 'N/A'}
                      <span className="text-xs font-normal text-slate-400 ml-1">Type-Token Ratio</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Shouting & Exclamations</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {sandboxResult.features?.exclamation_count ?? 0} ! marks • {((sandboxResult.features?.uppercase_ratio ?? 0) * 100).toFixed(0)}% CAPS
                    </div>
                  </div>
                </div>

                {/* SHAP Attributions (Red = pushes fake, Green = pushes genuine) */}
                {sandboxResult.suspicious_keywords && sandboxResult.suspicious_keywords.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-slate-500 font-semibold uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Top SHAP Keyword Attributions:
                      </span>
                      <span className="text-[10px] text-slate-400 normal-case">
                        <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />Pushes Fake
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-2 mr-1" />Pushes Genuine
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sandboxResult.suspicious_keywords.slice(0, 8).map((kw, i) => {
                        const pushesFake = kw.is_suspicious || kw.score > 0.05;
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              pushesFake
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            }`}
                          >
                            <span className="font-semibold">{kw.word}</span>
                            <span className="text-[10px] opacity-75 font-mono">
                              {kw.score > 0 ? `+${kw.score.toFixed(3)}` : kw.score.toFixed(3)}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Limitations & Responsible Use Note */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="font-semibold text-slate-700 dark:text-slate-300">Limitations & responsible use:</strong> Scores are probabilistic estimates based on linguistic signatures and statistical patterns, not definitive proof of fraud. Use as an assistive signal alongside human judgment.
                  </p>
                </div>

                {/* Model Footer & Unlock CTA */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Active Model: <strong>Logistic Regression v1.0</strong> (TF-IDF 5k n-grams)</span>
                  </div>
                  <Link
                    to={getAppPath('/app/single')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open in Single Analysis <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Navigation Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all hover:scale-102"
            >
              Explore how it works
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link
              to={getAppPath('/app/bulk')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all hover:scale-102"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
              Bulk CSV analysis
            </Link>
            <Link
              to={getAppPath('/app/models')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
            >
              <Cpu className="w-3.5 h-3.5" />
              Model benchmarks
            </Link>
          </div>

          {/* Credibility & Architecture Strip */}
          <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Multi-feature</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Stylistic & sentiment signals</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Explainable</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Token-level contributions</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Calibrated</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Continuous risk probability</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Syndicate check</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Duplicate review screening</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. FEATURES SECTION (#features) with ANIMATION
         ======================================================== */}
      <section
        id="features"
        className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-slate-800/80"
      >
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Comprehensive Review Verification Engine
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            A synchronized multi-layer architecture engineered to identify deceptive promotional astroturfing,
            malicious competitor slander, and coordinated review syndicate networks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-indigo-500/60 transition-all duration-300 group">
            <div className="p-3 w-fit rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Multi-Layer Classification
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Trained on extensive consumer feedback datasets and verified commercial reviews.
              Applies rigorous statistical modeling to distinguish authentic customer opinions from coordinated deception.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-purple-500/60 transition-all duration-300 group">
            <div className="p-3 w-fit rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Keyword Impact Attribution
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete transparency behind every verdict. Identifies and highlights the specific words,
              promotional phrases, and unusual patterns that contributed to the deception rating.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-rose-500/60 transition-all duration-300 group">
            <div className="p-3 w-fit rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Copy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Duplicate & Pattern Matching
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Detects copied review campaigns and cross-product template reuse. Advanced string comparison
              flags slight rewordings and copy-pasted promotional messages across platforms.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-emerald-500/60 transition-all duration-300 group">
            <div className="p-3 w-fit rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Smile className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Sentiment & Rating Consistency
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Examines text tone against assigned star ratings. Uncovers conflicting feedback—such as 5-star ratings
              paired with complaints, or excessive negative rants aimed at damaging reputations.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-amber-500/60 transition-all duration-300 group">
            <div className="p-3 w-fit rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Writing Style Forensics
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Measures vocabulary variety, excessive capitalization, punctuation density, and sentence complexity
              to uncover automated generator templates and scripted endorsements.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-cyan-500/60 transition-all duration-300 group">
            <div className="p-3 w-fit rounded-xl bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              Review Analytics & Trends
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Provides real-time visibility into overall review authenticity, frequent suspicious phrases,
              and historical submission trends for compliance and auditing.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
      {/* ========================================================
          3. HOW IT WORKS SECTION (#how-it-works)
         ======================================================== */}
      <section
        id="how-it-works"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-slate-800/80"
      >
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            The 4-stage verification process
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            Every submitted review undergoes a structured, step-by-step examination designed for speed,
            clarity, and reliable evidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
          {/* Subtle connecting track line on desktop */}
          <div className="hidden md:block absolute top-9 left-10 right-10 h-px bg-slate-200 dark:bg-slate-800 pointer-events-none" />

          {/* Step 1 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center mb-3">
              1
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
              Text ingestion & normalization
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Standardizes raw review text, normalizes character encoding, and structures content while preserving key capitalization and punctuation patterns.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center mb-3">
              2
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
              Tone & structure profiling
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluates vocabulary diversity (TTR) and emotional intensity via VADER, verifying whether the review's tone aligns with its submitted rating.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
              Scoring & syndication check
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Computes deception probability using trained statistical classifiers while screening existing records for syndicated copies or repeated submissions.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center mb-3">
              4
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
              Explanation & verdict
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Highlights key contributing terms via SHAP, provides clear confidence indicators, and records the verdict for immediate review and auditing.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. METHODOLOGY & LIMITATIONS SECTION
         ======================================================== */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Compass className="w-3.5 h-3.5" /> Methodology & limitations
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Transparent, probabilistic evaluation
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Veridex does not claim infallible judgment. It produces continuous probability estimates and token-level explanations so fraud analysts can make informed decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                What the system does
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
                <li>Extracts unigram & bigram TF-IDF features across standardized text.</li>
                <li>Calculates VADER sentiment polarity to detect rating-sentiment mismatch.</li>
                <li>Uses logistic regression coefficients and SHAP values to explain word impacts.</li>
                <li>Performs exact and fuzzy matching to detect syndicated reviews across sources.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Limitations & responsible use
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
                <li>Short reviews (&lt; 15 words) have lower statistical signal and wider variance.</li>
                <li>Sarcasm or cultural colloquialisms may trigger false-positive warnings.</li>
                <li>Model outputs should be used as assistive screening tools, not final legal proof.</li>
                <li>Adversarial attacks that mimic authentic syntax may evade baseline classifiers.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. FAQ SECTION
         ======================================================== */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Frequently asked questions
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Common questions about model evaluation, transparency, and data handling.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does Veridex determine whether a review is suspicious?',
                a: 'The engine combines statistical n-gram weights from calibrated models with behavioral signals including lexical diversity (TTR), excessive capitalization, exclamation patterns, and sentiment-rating discordance.',
              },
              {
                q: 'Can an authentic customer review be flagged?',
                a: 'Yes. Highly emotional or unusually brief genuine reviews can sometimes exhibit patterns common in promotional copy. Veridex provides token-level SHAP attributions so reviewers can see the exact terms that influenced the score before taking moderation action.',
              },
              {
                q: 'What benchmark datasets were used for training?',
                a: 'Models are evaluated on balanced cross-domain consumer review datasets (including Deceptive Opinion Spam corpus and annotated Yelp/Amazon reviews) achieving 85.6% to 91.3% test accuracy.',
              },
              {
                q: 'Is customer data retained or shared?',
                a: 'Veridex processes review text for classification and stores audit history strictly within your authenticated workspace. No personal identifiable information (PII) is sold or shared with external parties.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  {item.q}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. CALL TO ACTION BAND
         ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-xs">
            <Lock className="w-3.5 h-3.5 text-indigo-300" />
            Assistive review verification
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to verify your product reviews?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
            Test single reviews with transparent SHAP attributions or upload bulk datasets for automated batch screening.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={getAppPath('/app/single')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-indigo-950 hover:bg-slate-100 shadow-md transition-all hover:scale-102"
            >
              <Search className="w-4 h-4 text-indigo-600" />
              Start single analysis
            </Link>
            <Link
              to={getAppPath('/app/bulk')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 shadow-md transition-all hover:scale-102"
            >
              <UploadCloud className="w-4 h-4" />
              Upload bulk CSV
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FOOTER
         ======================================================== */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-500 shadow-xs">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Veridex
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Automated review authenticity verification with transparent token attribution and behavioral forensics.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="font-semibold text-slate-900 dark:text-white text-xs">Platform</p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to={getAppPath('/app/single')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Single Analysis
                </Link>
              </li>
              <li>
                <Link to={getAppPath('/app/bulk')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Bulk CSV Analysis
                </Link>
              </li>
              <li>
                <Link to={getAppPath('/app/history')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Audit History
                </Link>
              </li>
              <li>
                <Link to={getAppPath('/app/analytics')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Analytics & Trends
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="font-semibold text-slate-900 dark:text-white text-xs">Methodology</p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to={getAppPath('/app/models')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Model Benchmarks
                </Link>
              </li>
              <li>
                <Link to={getAppPath('/app/datasets')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Datasets & Training
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  4-Stage Process
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="font-semibold text-slate-900 dark:text-white text-xs">Trust & Legal</p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <span>© {new Date().getFullYear()} Veridex. All rights reserved.</span>
          <span>Assistive deception intelligence platform.</span>
        </div>
      </footer>
    </div>
  );
};
