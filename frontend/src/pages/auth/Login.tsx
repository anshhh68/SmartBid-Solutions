import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password required');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Desk unlocked');
      navigate('/admin', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Access denied');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <Link to="/" className="mb-4 inline-block bg-white p-3 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <img src="/logo.png" alt="SmartBid Solutions" className="h-14 w-auto object-contain" />
      </Link>
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">Administration Console</p>
      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm space-y-4 border border-rule bg-paper-2 p-8">
        <h1 className="font-display text-2xl">Admin sign-in</h1>
        <p className="text-sm text-ink-soft">This page is for the Ahmedabad desk. Customers use Contact or WhatsApp.</p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Staff email"
          className="w-full border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-stamp"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-stamp"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-ink py-2.5 text-sm font-semibold text-paper disabled:opacity-50"
        >
          {isLoading ? 'Checking…' : 'Enter admin'}
        </button>
      </form>
    </div>
  );
}
