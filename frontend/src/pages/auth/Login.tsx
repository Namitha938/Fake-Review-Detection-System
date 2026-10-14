import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { authApi } from '../../api';
import { ShieldAlert, LogIn, AlertCircle, KeyRound, ArrowLeft, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { signInWithGooglePopup } from '../../services/firebase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 2FA state
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempToken, setTempToken] = useState<string>('');
  const [twoFactorOtp, setTwoFactorOtp] = useState<string>('');
  const [twoFactorEmail, setTwoFactorEmail] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [sessionExpiresIn, setSessionExpiresIn] = useState<number>(300); // 5 min
  const [resending, setResending] = useState(false);

  const { login, loginWithGoogle, complete2FALogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nextPath = searchParams.get('next') || '/app/single';

  // Countdown timers for 2FA
  useEffect(() => {
    let timer: any;
    if (step === '2fa') {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        setSessionExpiresIn((prev) => {
          if (prev <= 1) {
            setError('2FA verification session expired. Please sign in again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      const gUser = await signInWithGooglePopup();
      const targetRole = nextPath.includes('/admin') ? 'admin' : 'user';
      const res = await loginWithGoogle(gUser.email, gUser.displayName, gUser.idToken, targetRole);
      if (res.requires_2fa && res.temp_token) {
        setTempToken(res.temp_token);
        setTwoFactorEmail(gUser.email);
        setStep('2fa');
        setResendCooldown(45);
        setSessionExpiresIn(300);
        setTwoFactorOtp('');
      } else {
        navigate(nextPath, { replace: true });
      }
    } catch (err: any) {
      if (err?.message !== 'Google Sign-In was cancelled.') {
        setError(err?.response?.data?.detail || err?.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await login(email, password);
      if (res.requires_2fa && res.temp_token) {
        setTempToken(res.temp_token);
        setTwoFactorEmail(email);
        setStep('2fa');
        setResendCooldown(45);
        setSessionExpiresIn(300);
        setTwoFactorOtp('');
      } else {
        navigate(nextPath, { replace: true });
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorOtp || twoFactorOtp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const verifyRes = await authApi.verify2FA(tempToken, twoFactorOtp.trim());
      complete2FALogin(verifyRes);
      navigate(nextPath, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await authApi.resend2FA(tempToken);
      setSuccessMsg(res.message || 'A new verification code has been sent to your email.');
      setResendCooldown(45);
      setSessionExpiresIn(300);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex w-full transition-colors duration-200">
      {/* Left Image Panel (Desktop lg+) */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12">
        <img
          src="/images/login-side.webp"
          alt="Customer Reviews Verification"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Sleek professional vignette preserving photo realism */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-900/40 to-indigo-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/30" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-lg">
            <ShieldAlert className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white drop-shadow">Veridex</span>
        </div>

        {/* Headline & Supporting Line */}
        <div className="relative z-10 max-w-lg pb-4">
          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
            Know which reviews you can trust
          </h1>
          <p className="mt-3 text-sm xl:text-base text-slate-200/95 leading-relaxed drop-shadow">
            Empower your purchasing decisions with explainable AI forensics and sentiment dissonance detection.
          </p>
        </div>
      </div>

      {/* Right Column: Centered Form Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xl dark:shadow-2xl backdrop-blur-sm">
        {step === '2fa' ? (
          <div>
            {/* 2FA Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20 mb-3">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Two-Factor Authentication</h2>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Enter the 6-digit code from your Authenticator app (or email) for
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                {twoFactorEmail}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    6-Digit Verification Code
                  </label>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Expires in {formatTime(sessionExpiresIn)}</span>
                  </div>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  placeholder="000000"
                  value={twoFactorOtp}
                  onChange={(e) => setTwoFactorOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xl font-bold tracking-[0.5em] font-mono text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorOtp.length !== 6 || sessionExpiresIn <= 0}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Verify & Access Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Resend and Back Actions */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResend2FA}
                  disabled={resendCooldown > 0 || resending}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError(null);
                    setSuccessMsg(null);
                    setTwoFactorOtp('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to sign in</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-500 shadow-md mb-3 hover:scale-105 transition-transform">
                <ShieldAlert className="w-6 h-6 text-white" />
              </Link>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign In to Veridex</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Access saved review histories, model benchmarks, and bulk uploads
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    to={`/forgot-password${searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next')!)}` : ''}`}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">
                  or continue with
                </span>
              </div>
            </div>

            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 hover:scale-101"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to={`/register${searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next')!)}` : ''}`}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Register here
              </Link>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
