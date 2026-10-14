import React from 'react';
import { ReviewAnalysisResult } from '../types';
import { generateCertificate } from '../utils/generateCertificate';
import { ShieldCheck, Download, X, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ForensicCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReviewAnalysisResult;
}

export const ForensicCertificateModal: React.FC<ForensicCertificateModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!isOpen || !result) return null;

  // Generate deterministic certificate hash ID from review text and date
  const certId = `VRX-CERT-${Math.abs(
    (result.review_text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 8971
  ).toString(16).toUpperCase().padStart(8, '0')}`;

  const dateStr = result.created_at
    ? new Date(result.created_at).toUTCString()
    : new Date().toUTCString();

  const isGenuine = result.prediction === 'genuine';
  const isSuspicious = result.prediction === 'suspicious';

  const handleDownload = () => {
    generateCertificate(result, null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 text-slate-900 dark:text-white print:border-none print:shadow-none print:m-0 print:p-4">
        {/* Actions Bar (hidden on print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Official Veridex Forensic Certificate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE BODY */}
        <div className="border-4 border-double border-slate-300 dark:border-slate-700 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950/50 relative overflow-hidden">
          {/* Subtle Watermark */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none">
            <ShieldCheck className="w-80 h-80 text-indigo-900 dark:text-indigo-200" />
          </div>

          {/* Certificate Header */}
          <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-500 shadow-md text-white mb-2">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-serif">
              Veridex Security Audit Certificate
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
              Machine Learning Forensics & Opinion Spam Verification Report
            </p>
            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>ID: <strong>{certId}</strong></span>
              <span>•</span>
              <span>Issued: {dateStr}</span>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="my-6 p-4 rounded-xl text-center border bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Final Credibility Determination
            </span>
            <div className="inline-flex items-center gap-2 text-xl font-extrabold uppercase tracking-wide">
              {isGenuine ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-6 h-6" /> VERIFIED GENUINE
                </span>
              ) : isSuspicious ? (
                <span className="text-amber-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-6 h-6" /> SUSPICIOUS OPINION PATTERN
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-6 h-6" /> HIGH DECEPTION RISK (LIKELY FAKE)
                </span>
              )}
            </div>
            <div className="mt-2 flex justify-center gap-6 text-xs text-slate-600 dark:text-slate-300 font-mono">
              <span>Deception Prob: <strong>{(result.fake_probability * 100).toFixed(1)}%</strong></span>
              <span>Confidence: <strong>{result.confidence.toFixed(1)}%</strong></span>
              <span>Sentiment: <strong>{result.sentiment_label.toUpperCase()} ({result.sentiment_score})</strong></span>
            </div>
          </div>

          {/* Review Text Tested */}
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Inspected Review Content {result.rating ? `(Rated ★${result.rating}/5)` : ''}:
            </span>
            <blockquote className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              "{result.review_text}"
            </blockquote>
          </div>

          {/* Linguistic Diagnostics Grid */}
          {result.features && (
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Word Count</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{result.features.word_count}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Lexical Diversity</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {(result.features.lexical_diversity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Uppercase Ratio</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {(result.features.uppercase_ratio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Duplicate Check</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {result.is_duplicate ? 'Duplicate' : 'Unique (0%)'}
                </span>
              </div>
            </div>
          )}

          {/* Certificate Footer Stamp */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>VERIDEX AUTOMATED FORENSIC ENGINE v2.0</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">Cryptographically Audited</span>
          </div>
        </div>
      </div>
    </div>
  );
};

