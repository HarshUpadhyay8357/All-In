'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import '@/app/complement.css'

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/register', { username, email, password });
      const { user, accessToken, refreshToken } = response.data;

      setUser(user);
      setTokens(accessToken, refreshToken);
      router.push('/lobby');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="rounded-lg shadow-2xl p-8 w-full max-w-md login-card">
        <h1 className="text-3xl font-bold text-center mb-8 heading">Join The Table</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full px-4 py-2 rounded-lg input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-violet-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-violet-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-violet-300 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg input"
              required
            />
          </div>

          {error && <div className="p-3 bg-red-950/30 border border-red-500/30 text-red-400 rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-2 rounded-lg disabled:opacity-50 transition login-btn"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-white mt-6">
          Already have an account?{' '}
          <Link href="/login" className="register-link hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}