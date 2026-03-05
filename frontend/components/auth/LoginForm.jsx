import { useState } from 'react';
import { useRouter } from 'next/router';
import { fetchCsrfCookie, loginRequest } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetchCsrfCookie();
      const { user } = await loginRequest({ email, password });
      if (user) {
        login(user);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Ha ocurrido un error al iniciar sesión.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/80 px-8 py-9 shadow-[0_0_60px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
      <div className="mb-7 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Acceso privado para tu negocio de belleza.
          </p>
        </div>
        <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-teal-500 to-cyan-500 text-lg shadow-[0_10px_30px_rgba(34,211,238,0.55)]">
          🗓
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            placeholder="tu@correo.com"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            placeholder="********"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-teal-500 via-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_16px_45px_rgba(8,47,73,0.9)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] text-slate-500">
        Acceso privado para negocios de belleza: barberías, salones, spas, uñas,
        pestañas y más.
      </p>
    </div>
  );
}
