import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.get('/sanctum/csrf-cookie');
      const response = await api.post('/api/login', { email, password });
      const { user } = response.data;
      if (typeof window !== 'undefined' && user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      router.push('/dashboard');
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* halos de fondo */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-40 -right-32 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/20 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400/18 via-slate-900 to-transparent blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl items-center gap-12 px-6 md:flex">
        <div className="mb-10 max-w-md md:mb-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-slate-900/70 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-teal-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
            Plataforma de citas para belleza
          </p>
          <h1 className="mt-5 text-3xl font-semibold text-slate-50 md:text-4xl">
            Control profesional de tu agenda
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            Centraliza citas, clientes y servicios de barberías, salones, spas y estudios de belleza en un solo panel moderno y fácil de usar.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/15 text-[11px] text-teal-300">
                ✓
              </span>
              <p>Agenda diaria clara para todo el equipo.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] text-cyan-300">
                ✓
              </span>
              <p>Historial de clientes y servicios más solicitados.</p>
            </div>
          </div>
        </div>

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
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-lg shadow-[0_10px_30px_rgba(34,211,238,0.55)]">
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
            className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_16px_45px_rgba(8,47,73,0.9)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Acceso privado para negocios de belleza: barberías, salones, spas, uñas, pestañas y más.
        </p>
      </div>
      </div>
    </div>
  );
}

