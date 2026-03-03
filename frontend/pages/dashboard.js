import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

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
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold">Citas</h2>
          <p className="text-xs text-slate-400 mt-1">
            Panel de administración
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2 text-sm">
          <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 bg-slate-800 text-slate-50">
            <span>📅</span>
            <span>Citas de hoy</span>
          </button>
          <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800/70">
            <span>👥</span>
            <span>Pacientes</span>
          </button>
          <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800/70">
            <span>📊</span>
            <span>Reportes</span>
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="mb-2">
            <div className="font-medium text-slate-200">
              {user?.name ?? 'Usuario'}
            </div>
            <div className="truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Resumen general de tus citas.
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-md shadow-slate-900/40"
            >
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                {card.title}
              </div>
              <div className="text-2xl font-semibold text-white">
                {card.value}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

