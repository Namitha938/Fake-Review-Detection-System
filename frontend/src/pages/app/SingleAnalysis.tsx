import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { reviewsApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { ReviewAnalysisResult } from '../../types';
import { generateCertificate } from '../../utils/generateCertificate';
import { RiskBadge } from '../../components/RiskBadge';
import { ScoreCard } from '../../components/ScoreCard';
import { KeywordPills } from '../../components/KeywordPills';
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

  // New interactive feature modals & toggles
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [showHighlighter, setShowHighlighter] = useState(true);

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
          {/* LIVE REAL-TIME DETECTOR SANDBOX CARD */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-xl dark:shadow-2xl backdrop-blur-md space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Real-Time Detector Sandbox
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUrlModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all hover:scale-102"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Import from URL</span>
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                  TF-IDF + VADER Ensemble
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Click a Preset to Test Real-Time Classification:
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleReviews.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setReviewText(sample.text);
                      setRating(sample.rating);
                      setReviewerId(sample.reviewerId || '');
                      handleAnalyze(sample.text, sample.rating, sample.reviewerId || '');
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>{sample.title}</span>
                    <span className="text-[10px] text-amber-500 font-bold">★{sample.rating}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Star Rating & Reviewer ID Forensics Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800/80">
              {/* Star Rating Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Star Rating:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? null : star)}
                      className={`p-1 rounded-md transition-all ${
                        rating && star <= rating
                          ? 'text-amber-400 scale-110'
                          : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'
                      }`}
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
                {rating && (
                  <span className="text-xs font-medium text-amber-500 dark:text-amber-400">
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
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  <UserCheck className="w-4 h-4 text-indigo-500" />
                  <span>Reviewer ID:</span>
                </div>
                <input
                  type="text"
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  placeholder="e.g. REV-BOT-BURST-01 (optional)"
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Input Textarea */}
            <div className="relative">
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Type or paste any customer review here to analyze live..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {reviewText.trim().split(/\s+/).filter(Boolean).length} words • {reviewText.length} characters
              </span>
              <button
                onClick={() => handleAnalyze()}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all hover:scale-102"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing NLP Features...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Run Real-Time Detection
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ANALYSIS RESULT DISPLAY */}
          {result && (
            <div className="space-y-6 animate-fade-in">
              {/* Main Decision Banner */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <RiskBadge
                      prediction={result.prediction}
                      confidence={result.confidence}
                      isDuplicate={result.is_duplicate}
                    />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Saved to History
                    </span>
                  </div>
                  {/* Certificate Export & AI Assistant Buttons */}
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 text-xs font-semibold shadow-xs transition-all hover:scale-102"
                      title="Ask AI Assistant about this review"
                    >
                      <Bot className="w-3.5 h-3.5 text-violet-500" />
                      <span>Ask AI Co-Pilot</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCertificate}
                      disabled={isExporting || !result}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xs transition-all hover:scale-102 disabled:opacity-50"
                      title="Download PDF Authenticity Certificate"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>Export Certificate</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      ID: VRX-{result.id || 'LIVE'}
                    </span>
                  </div>
                </div>

                {/* Probability Breakdown */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Genuine Probability: {((1 - result.fake_probability) * 100).toFixed(1)}%
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      Fake Probability: {(result.fake_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-700"
                      style={{ width: `${(1 - result.fake_probability) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all duration-700"
                      style={{ width: `${result.fake_probability * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreCard
                  title="Deception Probability"
                  value={`${(result.fake_probability * 100).toFixed(1)}%`}
                  subtitle={
                    result.fake_probability > 0.65
                      ? 'High likelihood of opinion spam'
                      : result.fake_probability > 0.4
                      ? 'Moderate / ambiguous flags'
                      : 'Low probability of fraud'
                  }
                  variant={result.fake_probability > 0.5 ? 'danger' : 'success'}
                />
                <ScoreCard
                  title="Confidence Score"
                  value={`${result.confidence.toFixed(1)}%`}
                  subtitle="Calibrated classifier certainty"
                  variant="default"
                />
                <ScoreCard
                  title="Sentiment Polarity"
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
                  title="Duplicate / Repetition"
                  value={result.is_duplicate ? 'Flagged Duplicate' : 'Unique Review'}
                  subtitle={
                    result.is_duplicate
                      ? `${result.duplicate_similarity}% match with corpus`
                      : 'RapidFuzz uniqueness verified'
                  }
                  variant={result.is_duplicate ? 'warning' : 'success'}
                  icon={<Copy className="w-4 h-4" />}
                />
              </div>

              {/* REVIEWER ACTIVITY ANALYSIS CARD */}
              {result.reviewer_activity && (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-indigo-500" />
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                          Reviewer Activity & Behavioral Forensics
                          {result.reviewer_id && (
                            <span className="font-mono text-xs normal-case px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                              {result.reviewer_id}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Posting cadence, rapid burst detection, and historical rating distribution analysis
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        result.reviewer_activity.burst_detected
                          ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                          : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      }`}>
                        {result.reviewer_activity.burst_detected ? 'BURST DETECTED (<=24h)' : 'NORMAL POSTING CADENCE'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Frequency & Velocity */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Posting Frequency</span>
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {result.reviewer_activity.posting_frequency}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {result.reviewer_activity.total_reviews} total reviews indexed for this author identity
                      </p>
                    </div>

                    {/* Rating Pattern Forensics */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase">
                        <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                        <span>Rating Pattern</span>
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {result.reviewer_activity.pattern_label}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Mean: {result.reviewer_activity.rating_mean ?? 'N/A'}★ • StdDev: {result.reviewer_activity.rating_std ?? 0} • Extreme Ratio: {((result.reviewer_activity.extreme_rating_ratio ?? 0) * 100).toFixed(0)}%
                      </p>
                    </div>

                    {/* Reviewer Risk Score */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          Author Risk Score
                        </span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {(result.reviewer_activity.reviewer_risk_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            result.reviewer_activity.reviewer_risk_score > 0.5
                              ? 'bg-rose-500'
                              : result.reviewer_activity.reviewer_risk_score > 0.25
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${result.reviewer_activity.reviewer_risk_score * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {result.reviewer_activity.risk_flags && result.reviewer_activity.risk_flags.length > 0
                          ? result.reviewer_activity.risk_flags.join(' • ')
                          : 'No suspicious behavioral anomalies flagged'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* INTERACTIVE FORENSIC IN-TEXT HIGHLIGHTER */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Interactive Forensic Text Inspection
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHighlighter(!showHighlighter)}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    {showHighlighter ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide Token Overlay
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Show Token Overlay
                      </>
                    )}
                  </button>
                </div>

                {showHighlighter ? (
                  <TextHighlighter text={result.review_text} keywords={result.suspicious_keywords} />
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {result.review_text}
                  </p>
                )}
              </div>

              {/* SHAP EXPLAINABILITY CARD WITH PLAIN-ENGLISH REASONS */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      SHAP Explainability & Keyword Attributions
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Impact score (+ increases fake risk, - supports genuine)
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  The model identifies specific lexical tokens and stylistic patterns that influenced the final classification:
                </p>

                <KeywordPills keywords={result.suspicious_keywords} showReasons={true} />
              </div>

              {/* LINGUISTIC NLP FEATURES TABLE */}
              {result.features && (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-purple-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Linguistic & Forensic NLP Metrics (spaCy Profiling)
                    </h3>
                  </div>
                  <LinguisticFeaturesTable features={result.features} />
                </div>
              )}
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
