'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push('/dashboard-7k3x');
    } else {
      setError('Invalid username or password');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          placeholder="Enter your username"
          className="w-full px-4 py-3 rounded-xl border border-[#e0e2ed] bg-white text-[#181c23] text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]/30 focus:border-[#0058bc] transition-all placeholder-gray-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          className="w-full px-4 py-3 rounded-xl border border-[#e0e2ed] bg-white text-[#181c23] text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bc]/30 focus:border-[#0058bc] transition-all placeholder-gray-400"
        />
      </div>

      {error && (
        <p className="text-red-600 text-xs font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#0058bc] text-white font-bold text-sm hover:bg-[#0070eb] disabled:opacity-60 disabled:cursor-not-allowed transition-all cta-glow"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
