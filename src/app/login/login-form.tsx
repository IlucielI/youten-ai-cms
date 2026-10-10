'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status === 'fail' || data.status === 'error' || data.error) {
        const errorMsg =
          data.error ||
          data.message ||
          (res.status === 401
            ? 'Invalid username or password'
            : 'Authentication failed. Please verify credentials.');
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      // Success: redirect to target console page
      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to connect to authentication service.';
      setError(message);
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('Admin123!');
    setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Outer Card with Glassmorphism and Neon Gradient Ring */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse" />

        <div className="relative rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 p-8 shadow-2xl">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <YoutenLogo size="lg" className="mb-4 shadow-lg shadow-blue-500/25 ring-1 ring-white/10 rounded-2xl" />
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Youten AI Console
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Operational Management, Analytics &amp; Governance Gateway
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              id="login-error-alert"
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Staff ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-username-input"
                className="block text-xs font-semibold text-slate-300"
              >
                Administrator Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username-input"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password-input"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Security Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Security Status */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 transition-colors">
                <input
                  type="checkbox"
                  id="login-remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span>Keep session active</span>
              </label>

              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HMAC-SHA256 Encrypted</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-button"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Operator Demo Helper */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col items-center gap-2 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Demo Credentials: <code className="text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">admin</code> / <code className="text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">Admin123!</code>
            </span>
            <button
              type="button"
              id="login-fill-demo-button"
              onClick={handleFillDemo}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium transition-colors hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Default Admin Credentials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
