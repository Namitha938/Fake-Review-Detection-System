import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { signInWithGooglePopup } from '../../services/firebase';
import { Input, Button, Alert } from '../../components/ui';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nextPath = searchParams.get('next') || '/app/single';

  // Compute password strength score (0 to 4)
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-800' };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-indigo-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: 'Too short', color: 'bg-rose-500' };
    }
  }, [password]);

  const validateForm = (): boolean => {
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters long.');
      return false;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@company.com).');
      return false;
    }
    if (!password) {
      setError('Please create a password.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return false;
    }
    return true;
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const gUser = await signInWithGooglePopup();
      const targetRole = nextPath.includes('/admin') ? 'admin' : 'user';
      await loginWithGoogle(gUser.email, gUser.displayName, gUser.idToken, targetRole);
      navigate(nextPath, { replace: true });
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
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      await register(email.trim(), fullName.trim(), password);
      navigate(nextPath, { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Registration failed. An account with this email may already exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl dark:shadow-2xl shadow-indigo-500/5 backdrop-blur-md animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 shadow-md shadow-indigo-500/20 mb-3">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create an Account
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Get started with real-time AI review forensic analysis
        </p>
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
        {/* Full Name Field */}
        <Input
          id="register-fullname"
          label="Full Name"
          type="text"
          required
          autoComplete="name"
          placeholder="Jane Doe"
          icon={User}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        {/* Email Address Field */}
        <Input
          id="register-email"
          label="Work Email Address"
          type="email"
          required
          autoComplete="email"
          placeholder="jane@company.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password Field */}
        <div>
          <Input
            id="register-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Strength:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {passwordStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-all duration-300 ${
                      step <= passwordStrength.score
                        ? passwordStrength.color
                        : 'bg-slate-200 dark:bg-slate-700/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <Input
          id="register-confirm-password"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          placeholder="Re-enter your password"
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          loadingText="Creating account..."
          className="w-full mt-2"
        >
          Create Account
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
        Sign up with Google
      </Button>

      {/* Login Redirect Link */}
      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to={`/login${
            searchParams.get('next')
              ? `?next=${encodeURIComponent(searchParams.get('next')!)}`
              : ''
          }`}
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
        >
          Sign in here
        </Link>
      </div>

      {/* Security Assurance Footnote */}
      <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
        <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
        <span>Protected by secure sign-in</span>
      </div>
    </div>
  );
};
