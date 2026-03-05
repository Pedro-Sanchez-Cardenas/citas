import { useState } from 'react';
import { useRouter } from 'next/router';
import { fetchCsrfCookie, loginRequest } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';

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
          <Input
            label="Correo electrónico"
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
          />
        </div>

        <div>
          <Input
            label="Contraseña"
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        <Button type="submit" disabled={loading} size="full">
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[11px] text-slate-500">
        Acceso privado para negocios de belleza: barberías, salones, spas, uñas,
        pestañas y más.
      </p>
    </div>
  );
}
