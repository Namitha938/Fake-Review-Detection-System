import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
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
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // Helper to generate authenticated or login-redirect link
  const getAppPath = (targetAppPath: string) => {
    if (user) return targetAppPath;
    return `/login?next=${encodeURIComponent(targetAppPath)}`;
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* ========================================================
          1. HOME / HERO SECTION (#home)
         ======================================================== */}
      <section
        id="home"
        className="relative overflow-hidden pt-16 pb-16 sm:pt-24 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950"
      >
        {/* Subtle Ambient Glow Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl animate-pulse-glow" />
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 dark:bg-purple-500/10 blur-3xl animate-float" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Spot Fake Reviews with{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 dark:from-indigo-400 dark:via-purple-300 dark:to-rose-400 bg-clip-text text-transparent">
              Forensic Analysis & Transparent Reasoning
            </span>
          </h1>

          {/* Subtext */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Protect consumer confidence and marketplace integrity. Veridex evaluates stylistic signatures,
            sentiment dissonance, copy-paste syndication, and keyword weights to deliver transparent, auditable fraud assessments.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all hover:scale-102"
            >
              Explore How It Works
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link
              to={getAppPath('/app/bulk')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all hover:scale-102"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
              Bulk CSV Analysis
            </Link>
            <Link
              to={getAppPath('/app/models')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
            >
              <Cpu className="w-3.5 h-3.5" />
              Model Benchmarks
            </Link>
          </div>

          {/* Credibility & Outcome Strip */}
          <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">3.4 ms</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">TF-IDF Inference Latency</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">100%</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Transparent Reasoning</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">Calibrated</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Confidence Scoring</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">Automated</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Syndicate Detection</div>
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
          3. HOW IT WORKS SECTION (#how-it-works) with ANIMATION
         ======================================================== */}
      <section
        id="how-it-works"
        className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-slate-800/80"
      >
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            The 4-Stage Verification Process
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            Every submitted review undergoes a structured, step-by-step examination designed for speed,
            clarity, and reliable evidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Subtle connecting track line on desktop */}
          <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 pointer-events-none" />

          {/* Step 1 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative hover:shadow-xl hover:-translate-y-2 hover:border-indigo-500/50 transition-all duration-300 group">
            <div className="text-3xl font-black text-indigo-300 dark:text-indigo-900/90 mb-3 font-mono group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-105 transition-all duration-300">
              01
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Text Ingestion & Preparation
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Standardizes raw review text, strips extraneous formatting, and structures the content while preserving key capitalization and punctuation patterns.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative hover:shadow-xl hover:-translate-y-2 hover:border-purple-500/50 transition-all duration-300 group">
            <div className="text-3xl font-black text-purple-300 dark:text-purple-900/90 mb-3 font-mono group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:scale-105 transition-all duration-300">
              02
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Tone & Structure Profiling
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluates vocabulary diversity and emotional intensity, verifying whether the review's tone aligns with its submitted rating.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative hover:shadow-xl hover:-translate-y-2 hover:border-rose-500/50 transition-all duration-300 group">
            <div className="text-3xl font-black text-rose-300 dark:text-rose-900/90 mb-3 font-mono group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:scale-105 transition-all duration-300">
              03
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Scoring & Duplicate Screening
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Computes deception risk using trained statistical classifiers while screening existing records for syndicated copies or repeated submissions.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative hover:shadow-xl hover:-translate-y-2 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="text-3xl font-black text-emerald-300 dark:text-emerald-900/90 mb-3 font-mono group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-105 transition-all duration-300">
              04
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Explanation & Final Verdict
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Highlights key contributing terms, provides clear confidence indicators, and records the verdict for immediate review and auditing.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. ABOUT SECTION (#about) — USER'S MISSION FOCUS
         ======================================================== */}
      <section
        id="about"
        className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200 dark:border-slate-800/80"
      >
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Mission Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Our mission
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
              Online reviews guide millions of purchases, and fake ones distort those choices. Veridex scores each review and explains the result, so people can judge for themselves.
            </h2>
          </div>

          {/* Three Key Tenets Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tenet 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="p-3 w-fit rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Clear verdicts with confidence scores
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Calibrated Genuine, Suspicious, or Likely Fake classifications paired with statistical confidence scores give immediate, actionable clarity.
              </p>
            </div>

            {/* Tenet 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="p-3 w-fit rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Plain-English reasons for every result
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Clear feature attributions isolate the specific keywords and stylistic cues that influenced the assessment—no opaque, unexplained decisions.
              </p>
            </div>

            {/* Tenet 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="p-3 w-fit rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Honest about uncertainty: results are estimates
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Designed to assist human judgment with calibrated probabilities, acknowledging statistical boundaries rather than claiming infallible certainty.
              </p>
            </div>
          </div>

          {/* Quick Gateway Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to={getAppPath('/app/single')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all hover:scale-102"
            >
              <Search className="w-4 h-4" /> Start Single Analysis
            </Link>
            <Link
              to={getAppPath('/app/analytics')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all hover:scale-102"
            >
              <BarChart2 className="w-4 h-4 text-emerald-500" /> View Analytics Overview
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. CALL TO ACTION BAND
         ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-xs">
            <Lock className="w-3.5 h-3.5 text-indigo-300" />
            Enterprise-Grade Forensic Security
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Protect Your Platform Against Review Fraud?
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Start testing reviews now, upload bulk datasets, or integrate our real-time API pipeline.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to={getAppPath('/app/single')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-indigo-950 hover:bg-slate-100 shadow-lg shadow-black/20 transition-all hover:scale-102"
            >
              <Search className="w-4 h-4 text-indigo-600" />
              Launch Single Detector
            </Link>
            <Link
              to={getAppPath('/app/bulk')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-lg transition-all hover:scale-102"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Bulk CSV
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FOOTER
         ======================================================== */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Veridex
            </span>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Veridex. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
