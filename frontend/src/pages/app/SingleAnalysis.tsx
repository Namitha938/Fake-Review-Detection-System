import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { reviewsApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { ReviewAnalysisResult } from '../../types';
import { generateCertificate } from '../../utils/generateCertificate';
import { RiskBadge } from '../../components/RiskBadge';
import { ScoreCard } from '../../components/ScoreCard';
import { ShapDivergingChart } from '../../components/ShapDivergingChart';
import { LinguisticFeaturesTable } from '../../components/LinguisticFeaturesTable';
import { TextHighlighter } from '../../components/TextHighlighter';
import { ForensicCertificateModal } from '../../components/ForensicCertificateModal';
import { UrlExtractorModal } from '../../components/UrlExtractorModal';
import { ReviewComparer } from '../../components/ReviewComparer';
import {
  Sparkles,
  Search,
  Star,
  Smile,
  Frown,
  Meh,
  Activity,
  Layers,
  Copy,
  CheckCircle,
  AlertTriangle,
  FileText,
  Globe,
  Scale,
  Eye,
  EyeOff,
  Bot,
  UserCheck,
  Zap,
  Clock,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Download,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  RefreshCw,
  Cpu,
  HelpCircle,
} from 'lucide-react';

export const SingleAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('single');
  const [reviewText, setReviewText] = useState(
    'BEST HOTEL IN THE WORLD! The pillows are made of angel feathers! Never seen such divine luxury in my entire lifetime! Perfection 100/10 stars!'
  );
  const [rating, setRating] = useState<number | null>(5);
  const [reviewerId, setReviewerId] = useState<string>('REV-BOT-BURST-01');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Accordion states
  const [reviewerOpen, setReviewerOpen] = useState(false);
  const [linguisticsOpen, setLinguisticsOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Interactive feature modals & toggles
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [showHighlighter, setShowHighlighter] = useState(true);

  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    if (overflowOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [overflowOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleCopySummary = () => {
    if (!result) return;
    const summary = `--- VERIDEX FORENSIC AUDIT REPORT ---
Review ID: VRX-${result.id || 'LIVE'}
Date: ${new Date(result.created_at || Date.now()).toLocaleString()}
Verdict: ${result.prediction.toUpperCase()} (${result.confidence.toFixed(1)}% Confidence)
Deception Probability: ${(result.fake_probability * 100).toFixed(1)}%
VADER Sentiment: ${result.sentiment_label.toUpperCase()} (${result.sentiment_score})
Star Rating: ${result.rating ? `${result.rating} / 5 stars` : 'Not provided'}
Duplicate Status: ${result.is_duplicate ? `DUPLICATE DETECTED (${result.duplicate_similarity}% match)` : 'Original'}
Top Attributions: ${result.suspicious_keywords?.slice(0, 5).map(k => `${k.word} (${k.score > 0 ? '+' : ''}${k.score.toFixed(3)})`).join(', ') || 'None'}
Review Text: "${result.review_text}"
-------------------------------------`;
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
    setToast({ message: 'Audit summary copied to clipboard', type: 'success' });
    setTimeout(() => setToast(null), 3500);
  };

  const handleExportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Veridex_Audit_VRX-${result.id || 'result'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: 'JSON audit payload exported', type: 'success' });
    setTimeout(() => setToast(null), 3500);
  };

  const handleExportCertificate = () => {
    if (!result || isExporting) return;
    setIsExporting(true);
    try {
      generateCertificate(result, user);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
      setToast({ message: 'Certificate downloaded', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (err: any) {
      console.error('Error generating certificate:', err);
      setToast({
        message: err?.message || 'Failed to download certificate',
        type: 'error',
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const sampleReviews = [
    {
      title: 'Promotional Astroturf Spam',
      rating: 5,
      reviewerId: 'REV-BOT-BURST-01',
      text: 'BEST HOTEL IN THE WORLD! The pillows are made of angel feathers! Never seen such divine luxury in my entire lifetime! Perfection 100/10 stars!',
    },
    {
      title: 'Genuine Hotel Stay',
      rating: 4,
      reviewerId: 'REV-ORGANIC-USER-42',
      text: 'We stayed at the hotel for three nights. The location on Michigan Avenue was ideal for walking to Millennium Park. The room was clean, spacious, and the bed was very comfortable. The check-in process was smooth, and the concierge gave great dining tips.',
    },
    {
      title: 'Defamatory Scam Claim',
      rating: 1,
      reviewerId: 'REV-SMEAR-BOT-09',
      text: 'DO NOT TRUST ANY GOOD REVIEWS! It is a pure mafia scam front! Rat poison in the soup and rude managers. Criminal enterprise that will steal your money!',
    },
    {
      title: 'Balanced Dining Feedback',
      rating: 4,
      reviewerId: 'REV-ORGANIC-USER-42',
      text: 'The pasta carbonara was rich and creamy, with crispy pancetta. Server Marco was attentive and refilled our waters regularly. A bit noisy during lunchtime rush, but solid food.',
    },
  ];

  const handleAnalyze = async (
    overrideText?: string,
    overrideRating?: number | null,
    overrideReviewerId?: string
  ) => {
    const textToAnalyze = overrideText !== undefined ? overrideText : reviewText;
    const ratingToAnalyze = overrideRating !== undefined ? overrideRating : rating;
    const reviewerIdToAnalyze = overrideReviewerId !== undefined ? overrideReviewerId : reviewerId;

    if (!textToAnalyze.trim()) {
      setError('Please enter a review text or pick a sample preset.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await reviewsApi.analyzeSingle(
        textToAnalyze,
        ratingToAnalyze,
        reviewerIdToAnalyze ? reviewerIdToAnalyze.trim() : null
      );
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Analysis failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const sentimentIcon = (label: string) => {
    if (label === 'positive') return <Smile className="w-5 h-5 text-emerald-500" />;
    if (label === 'negative') return <Frown className="w-5 h-5 text-red-500" />;
    return <Meh className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Search className="w-6 h-6" />
            </div>
            Review Forensics & Credibility Lab
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Advanced NLP deception probability detection, sentiment dissonance checks, and side-by-side authenticity duels.
          </p>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'single'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Single Inspection</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'compare'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-violet-500" />
            <span>Review Duel Comparer</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[9px] font-extrabold uppercase">
              New
            </span>
          </button>
        </div>
      </div>

      {/* RENDER COMPARER OR SINGLE INSPECTION */}
      {activeTab === 'compare' ? (
        <ReviewComparer />
      ) : (
        <>
          {/* 1. INPUT CARD */}
          <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Review text input
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste raw customer feedback or pick a benchmark preset
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUrlModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Import from URL</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium">
                Benchmark presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleReviews.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReviewText(sample.text);
                      setRating(sample.rating);
                      setReviewerId(sample.reviewerId || '');
                      handleAnalyze(sample.text, sample.rating, sample.reviewerId || '');
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{sample.title}</span>
                    <span className="text-[10px] text-amber-500 font-semibold">★{sample.rating}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Star Rating & Reviewer ID Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
              {/* Star Rating Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Star rating:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? null : star)}
                      className={`p-1 rounded-md transition-all ${
                        rating && star <= rating
                          ? 'text-amber-400'
                          : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'
                      }`}
                      title={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                </div>
                {rating && (
                  <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
                    ({rating}/5)
                  </span>
                )}
                {rating && (
                  <button
                    type="button"
                    onClick={() => setRating(null)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Reviewer ID Input */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Reviewer ID (optional):</span>
                </div>
                <input
                  type="text"
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  placeholder="e.g. REV-BOT-BURST-01"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Input Textarea */}
            <div>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste customer review text to evaluate... (Press Ctrl+Enter to analyze)"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all font-sans"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {reviewText.trim().split(/\s+/).filter(Boolean).length} words • {reviewText.length} characters
                </span>
                <span className="text-[11px] opacity-75 hidden sm:inline">
                  (Ctrl+Enter to run)
                </span>
                {reviewText && (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewText('');
                      setResult(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear text
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={loading || !reviewText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm disabled:opacity-50 transition-all hover:scale-101 active:scale-[.99] cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing review...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Analyze review</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Banner with Retry */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* SKELETON LOADER STATE DURING INFERENCE */}
          {loading && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
              </div>
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              </div>
            </div>
          )}

          {/* 2. VERDICT SUMMARY & EVIDENCE */}
          {result && !loading && (
            <div className="space-y-6 animate-fade-in">
              {/* Verdict Summary Card */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
                {/* Top Row: Verdict Badge & Compact Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <RiskBadge
                      prediction={result.prediction}
                      confidence={result.confidence}
                      isDuplicate={result.is_duplicate}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                      ID: VRX-{result.id || 'LIVE'}
                    </span>
                  </div>

                  {/* Compact Action Toolbar with Overflow Menu */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('veridex:open-assistant', {
                            detail: result,
                          })
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                      title="Ask AI Co-Pilot about this review"
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Ask Co-Pilot</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCertificate}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                      title="Download PDF audit certificate"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>Export certificate</span>
                        </>
                      )}
                    </button>

                    {/* Overflow dropdown for Copy Summary & JSON */}
                    <div className="relative" ref={overflowRef}>
                      <button
                        type="button"
                        onClick={() => setOverflowOpen((prev) => !prev)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="More export actions"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {overflowOpen && (
                        <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              handleCopySummary();
                              setOverflowOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy summary</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleExportJSON();
                              setOverflowOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>Export JSON</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plain-English Verdict Explanation */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="font-semibold text-slate-900 dark:text-white mr-1.5">Assessment:</strong>
                  {result.fake_probability > 0.65
                    ? 'Statistical signals indicate elevated promotional hyperbole, unusual punctuation density, or rating-sentiment dissonance consistent with opinion spam.'
                    : result.fake_probability > 0.35
                    ? 'Mixed stylistic indicators or moderate sentiment discordance detected; secondary human review is advised before taking moderation action.'
                    : 'Linguistic tokens, lexical diversity, and syntactic cadence align closely with verified, authentic consumer feedback.'}
                </div>

                {/* Unified Probability Gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Deception risk estimate:
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {(result.fake_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.fake_probability > 0.65
                          ? 'bg-rose-500'
                          : result.fake_probability > 0.35
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(4, result.fake_probability * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0% (Genuine)</span>
                    <span>35% (Suspicious threshold)</span>
                    <span>65% (Likely deceptive)</span>
                    <span>100% (High risk)</span>
                  </div>
                </div>

                {/* 4 Neutral Metric KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  <ScoreCard
                    title="Deception probability"
                    value={`${(result.fake_probability * 100).toFixed(1)}%`}
                    subtitle={
                      result.fake_probability > 0.65
                        ? 'High likelihood of fraud'
                        : result.fake_probability > 0.35
                        ? 'Moderate / ambiguous flags'
                        : 'Low likelihood of fraud'
                    }
                    variant={result.fake_probability > 0.5 ? 'danger' : 'success'}
                  />
                  <ScoreCard
                    title="Confidence certainty"
                    value={`${result.confidence.toFixed(1)}%`}
                    subtitle="Calibrated classifier certainty"
                    variant="default"
                  />
                  <ScoreCard
                    title="Sentiment tone"
                    value={`${result.sentiment_label.toUpperCase()} (${result.sentiment_score > 0 ? '+' : ''}${result.sentiment_score})`}
                    subtitle="VADER compound polarity metric"
                    variant={
                      result.sentiment_label === 'positive'
                        ? 'success'
                        : result.sentiment_label === 'negative'
                        ? 'danger'
                        : 'default'
                    }
                    icon={sentimentIcon(result.sentiment_label)}
                  />
                  <ScoreCard
                    title="Syndication status"
                    value={result.is_duplicate ? 'Flagged copy' : 'Unique text'}
                    subtitle={
                      result.is_duplicate
                        ? `${result.duplicate_similarity}% match with corpus`
                        : 'No syndicated matches found'
                    }
                    variant={result.is_duplicate ? 'warning' : 'success'}
                    icon={<Copy className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* 3. EVIDENCE SECTION (Open by default) */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Evidence & feature attribution
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transparent statistical feature weights explaining the model's prediction
                  </p>
                </div>

                {/* Diverging SHAP Weights Bar Chart */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Token feature weights (SHAP values):
                  </span>
                  <ShapDivergingChart keywords={result.suspicious_keywords} />
                </div>

                {/* Token Overlay Highlighter */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Token attribution overlay:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowHighlighter(!showHighlighter)}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      {showHighlighter ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Hide overlay
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Show overlay
                        </>
                      )}
                    </button>
                  </div>

                  {showHighlighter ? (
                    <TextHighlighter text={result.review_text} keywords={result.suspicious_keywords} />
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-sans">
                      {result.review_text}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. COLLAPSIBLE ACCORDIONS FOR SECONDARY SIGNALS */}
              {/* Accordion 1: Reviewer Behavioral Activity */}
              {result.reviewer_activity && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setReviewerOpen(!reviewerOpen)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          Reviewer behavioral activity
                          {result.reviewer_id && (
                            <span className="font-mono text-[11px] font-normal px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {result.reviewer_id}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Posting cadence, velocity, and rating distribution
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        result.reviewer_activity.burst_detected
                          ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {result.reviewer_activity.burst_detected ? 'Rapid burst detected' : 'Normal cadence'}
                      </span>
                      {reviewerOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {reviewerOpen && (
                    <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in-50 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-xs text-slate-500 font-medium">Posting frequency</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {result.reviewer_activity.posting_frequency}
                          </p>
                          <span className="text-[11px] text-slate-400 block">
                            {result.reviewer_activity.total_reviews} total indexed submissions
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-xs text-slate-500 font-medium">Rating pattern</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {result.reviewer_activity.pattern_label}
                          </p>
                          <span className="text-[11px] text-slate-400 block">
                            Mean: {result.reviewer_activity.rating_mean ?? 'N/A'}★ • Extreme ratio: {((result.reviewer_activity.extreme_rating_ratio ?? 0) * 100).toFixed(0)}%
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-xs text-slate-500 font-medium">Author risk index</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                            {(result.reviewer_activity.reviewer_risk_score * 100).toFixed(0)}%
                          </p>
                          <span className="text-[11px] text-slate-400 block">
                            {result.reviewer_activity.risk_flags && result.reviewer_activity.risk_flags.length > 0
                              ? result.reviewer_activity.risk_flags.join(' • ')
                              : 'No behavioral risk flags'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 2: Linguistic & NLP Metrics */}
              {result.features && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLinguisticsOpen(!linguisticsOpen)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-purple-500" />
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          Linguistic & NLP metrics
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Lexical diversity, syntax patterns, readability, and part-of-speech distributions
                        </p>
                      </div>
                    </div>
                    {linguisticsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {linguisticsOpen && (
                    <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 animate-in fade-in-50 duration-200">
                      <div className="pt-4">
                        <LinguisticFeaturesTable features={result.features} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Active Model Footer & Limitations Note */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>
                    Active model: <strong>Logistic Regression v1.0</strong> (TF-IDF 5k n-grams) • Benchmark accuracy: <strong>88.5%</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Probabilistic estimate, not proof of fraud.</span>
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          {result && (
            <ForensicCertificateModal
              isOpen={certModalOpen}
              onClose={() => setCertModalOpen(false)}
              result={result}
            />
          )}

          <UrlExtractorModal
            isOpen={urlModalOpen}
            onClose={() => setUrlModalOpen(false)}
            onExtracted={(extractedText, extractedRating) => {
              setReviewText(extractedText);
              setRating(extractedRating);
              handleAnalyze(extractedText, extractedRating);
            }}
          />
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold border backdrop-blur-md transition-all animate-bounce-subtle ${
            toast.type === 'success'
              ? 'bg-emerald-600/95 text-white border-emerald-400 shadow-emerald-500/25'
              : 'bg-rose-600/95 text-white border-rose-400 shadow-rose-500/25'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-100 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-100 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
