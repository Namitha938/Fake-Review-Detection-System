import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reviewsApi } from '../../api';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Loader2, Calendar, Shield } from 'lucide-react';

interface CertVerificationData {
  id: number;
  cert_id: string;
  verdict: string;
  confidence: number;
  fake_probability: number;
  sentiment_label?: string;
  created_at: string;
  is_valid: boolean;
  status: string;
}

export const VerifyCertificate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CertVerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No certificate ID specified.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await reviewsApi.verifyCertificate(id);
        setData(result);
      } catch (err: any) {
        console.error('Failed to verify certificate:', err);
        setError(
          err?.response?.data?.detail ||
          'Certificate record not found. It may be an ephemeral sandbox test or an invalid identifier.'
        );
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [id]);

  const getVerdictDetails = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'genuine':
        return {
          label: 'VERIFIED GENUINE',
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
          description: 'Authentic customer feedback verified with organic lexical distribution.',
        };
      case 'suspicious':
        return {
          label: 'SUSPICIOUS PATTERN',
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          description: 'Ambiguous or divergent linguistic signals detected by classifier ensemble.',
        };
      case 'likely_fake':
      default:
        return {
          label: 'LIKELY FAKE / OPINION SPAM',
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30',
          icon: <AlertTriangle className="w-6 h-6 text-rose-500" />,
          description: 'High deception probability with strong astroturfing markers.',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/30">
              V
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Veridex Forensics</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Authenticity Verification Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span>Official Audit</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Querying cryptographic ledger & audit record...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-8 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-500">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Certificate Verification Failed</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-sm mx-auto">{error}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Veridex</span>
              </Link>
            </div>
          </div>
        )}

        {/* Valid Certificate Result */}
        {!loading && data && (
          <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Certificate valid</h3>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  This forensic certificate is genuine and officially recorded in the Veridex audit log.
                </p>
              </div>
            </div>

            {/* Certificate Metadata Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Certificate ID</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{data.cert_id}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Audit Timestamp</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {new Date(data.created_at).toUTCString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Audit Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Authenticated & Valid</span>
              </div>
            </div>

            {/* Verdict Card */}
            {(() => {
              const v = getVerdictDetails(data.verdict);
              return (
                <div className={`p-5 rounded-2xl border ${v.bg} space-y-3 text-center`}>
                  <div className="flex items-center justify-center gap-2">
                    {v.icon}
                    <span className={`text-base font-extrabold tracking-wide uppercase ${v.color}`}>
                      {v.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{v.description}</p>
                  <div className="pt-2 flex justify-center gap-4 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    <span>Fake Prob: {(data.fake_probability * 100).toFixed(1)}%</span>
                    <span>•</span>
                    <span>Confidence: {data.confidence.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })()}

            {/* Disclaimer & Back Link */}
            <div className="pt-2 space-y-4 text-center">
              <p className="text-[11px] text-slate-400 italic">
                Notice: For privacy and compliance reasons, review content is not displayed on public verification endpoints.
              </p>
              <div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Go to Veridex AI Platform</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

