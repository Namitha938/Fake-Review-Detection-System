import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { authApi } from '../../api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  Clock,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Zap,
  CheckCircle2,
  X,
  AlertTriangle,
  ClipboardPaste,
} from 'lucide-react';
import { signInWithGooglePopup } from '../../services/firebase';
import { Input, Button, Alert } from '../../components/ui';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);

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

  // Email format check
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Load remembered email if available
  useEffect(() => {
    const saved = localStorage.getItem('veridex_remembered_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // Countdown timers for 2FA
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
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

  const handleKeyModifier = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const autofillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handlePasteOtp = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, '').slice(0, 6);
      if (digits.length > 0) {
        setTwoFactorOtp(digits);
      }
    } catch {
      // Clipboard access not granted or denied
    }
  };

  const validateCredentials = (): boolean => {
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return false;
    }
    if (!isEmailValid) {
      setError('Please enter a valid email address (e.g. name@company.com).');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    return true;
  };

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
    if (!validateCredentials()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (rememberMe) {
      localStorage.setItem('veridex_remembered_email', email.trim());
    } else {
      localStorage.removeItem('veridex_remembered_email');
    }

    try {
      const res = await login(email.trim(), password);
      if (res.requires_2fa && res.temp_token) {
        setTempToken(res.temp_token);
        setTwoFactorEmail(email.trim());
        setStep('2fa');
        setResendCooldown(45);
        setSessionExpiresIn(300);
        setTwoFactorOtp('');
      } else {
        navigate(nextPath, { replace: true });
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || 'Incorrect email or password. Please verify your credentials.'
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
    <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-950/40 backdrop-blur-xl animate-fade-in relative z-10">
      {step === '2fa' ? (
        /* ========================================================
           2FA VERIFICATION STEP
           ======================================================== */
        <div>
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20 mb-3">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Two-Factor Authentication
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Enter the 6-digit code from your Authenticator app (or email) for
            </p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
              {twoFactorEmail}
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <Alert variant="error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            </div>
          )}

          {successMsg && (
            <div className="mb-5">
              <Alert variant="success" onDismiss={() => setSuccessMsg(null)}>
                {successMsg}
              </Alert>
            </div>
          )}

          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="two-factor-otp"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  6-Digit Verification Code
                </label>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Expires in {formatTime(sessionExpiresIn)}</span>
                </div>
              </div>
              <div className="relative">
                <input
                  id="two-factor-otp"
                  type="text"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  placeholder="000000"
                  value={twoFactorOtp}
                  onChange={(e) => setTwoFactorOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-2xl font-bold tracking-[0.45em] font-mono text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all"
                />
              </div>

              {/* Paste from clipboard helper */}
              <div className="flex justify-end pt-1.5">
                <button
                  type="button"
                  onClick={handlePasteOtp}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  Paste from clipboard
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              loadingText="Verifying Code..."
              disabled={twoFactorOtp.length !== 6 || sessionExpiresIn <= 0}
              leftIcon={<KeyRound className="w-4 h-4" />}
              className="w-full"
            >
              Verify & Access Dashboard
            </Button>
          </form>

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
        /* ========================================================
           STANDARD CREDENTIALS LOGIN STEP
           ======================================================== */
        <div>
          <div className="text-center mb-5">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 shadow-md shadow-indigo-500/20 mb-3">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign In to Veridex
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Access saved review histories, model benchmarks, and bulk uploads
            </p>
          </div>

          {/* Quick Demo Credentials Bar (Instant Testing for Mentors & Evaluators) */}
          <div className="mb-5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
                Quick Demo Access:
              </span>
              <span className="text-[10px] text-slate-400">One-click autofill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => autofillDemoAccount('namithaaa444@gmail.com', 'AdminPass123!')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-all hover:scale-[1.02] active:scale-95 text-left flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span className="truncate">Admin Demo</span>
              </button>
              <button
                type="button"
                onClick={() => autofillDemoAccount('auditor.demo@veridex.internal', 'AuditorDemo@2026')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-all hover:scale-[1.02] active:scale-95 text-left flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">Auditor Demo</span>
              </button>
            </div>
          </div>

          {/* Inline Error Alert Banner */}
          {error && (
            <div className="mb-5">
              <Alert variant="error" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field with Mail Icon & Real-Time Format Indicator */}
            <Input
              id="login-email"
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              rightElement={
                email.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {isEmailValid && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => setEmail('')}
                      aria-label="Clear email"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null
              }
            />

            {/* Password Field with Lock Icon, Show/Hide Toggle & Caps Lock Detector */}
            <div>
              <Input
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Min. 8 characters"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyModifier}
                onKeyUp={handleKeyModifier}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Caps Lock Warning Pill */}
              {capsLockOn && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-fade-in">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Caps Lock is currently ON</span>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-950 transition-colors cursor-pointer"
                />
                <span className="font-medium">Remember me</span>
              </label>

              <Link
                to={`/forgot-password${
                  searchParams.get('next')
                    ? `?next=${encodeURIComponent(searchParams.get('next')!)}`
                    : ''
                }`}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button with Loading Spinner & Focus Ring */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              loadingText="Signing in..."
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Social Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">
                or continue with
              </span>
            </div>
          </div>

          {/* Google Button with Official Colored G Logo */}
          <Button
            type="button"
            variant="outline"
            size="md"
            loading={googleLoading}
            loadingText="Connecting to Google..."
            onClick={handleGoogleSignIn}
            className="w-full"
            leftIcon={
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
            }
          >
            Continue with Google
          </Button>

          {/* Registration Redirect Link */}
          <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to={`/register${
                searchParams.get('next')
                  ? `?next=${encodeURIComponent(searchParams.get('next')!)}`
                  : ''
              }`}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
            >
              Create an account
            </Link>
          </div>

          {/* Security Assurance Footnote */}
          <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>256-Bit TLS Encryption • ISO/IEC 27001 Standard • Zero Knowledge</span>
          </div>
        </div>
      )}
    </div>
  );
};
