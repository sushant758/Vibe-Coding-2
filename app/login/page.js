'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ACADEMY_NAME } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Redirect by role
      if (data.role === 'coach') {
        router.push('/coach/dashboard');
      } else if (data.role === 'scout') {
        router.push('/scout');
      } else if (data.role === 'player') {
        router.push('/player');
      } else {
        router.push('/login');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen -mt-16 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-amber-50/85 backdrop-blur-md border border-stone-300/80 rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-200/60 px-3 py-1 rounded-full border border-amber-300/60">
            {ACADEMY_NAME}
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-3">
            Academy Desk
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Sign in to manage academy players and readiness
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-center gap-2">
            <span className="font-bold">&bull;</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@academy.test"
              className="w-full px-4 py-3 rounded-xl bg-white/90 border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/90 border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 text-amber-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

