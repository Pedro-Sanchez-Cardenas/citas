import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchData = async () => {
      try {
        const response = await api.get('/api/dashboard');
        setUser(response.data.user);
        setCards(response.data.cards || []);
      } catch (err) {
        setError('No se pudo cargar el dashboard. Vuelve a iniciar sesión.');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_user');
        }
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
      }
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        Cargando dashboard...
      </div>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      <header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Panel de belleza
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Resumen de tus citas, servicios y actividad reciente del salón, barbería o spa.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="group rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-950/90 p-[1px] shadow-[0_18px_40px_rgba(15,23,42,0.85)]"
          >
            <div className="flex h-full flex-col justify-between rounded-2xl bg-slate-950/80 p-4 transition group-hover:bg-slate-950">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  {card.title}
                </div>
              </div>
              <div className="text-2xl font-semibold text-slate-50">
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </section>
    </DashboardLayout>
  );
}

