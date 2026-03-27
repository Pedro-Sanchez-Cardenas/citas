import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboardCards } from '@/lib/api/dashboard';
import type { DashboardCard } from '@/components/dashboard/types';
import { PageHeader, Card, Alert, PageLoading } from '@/components/ui';
import { swalError } from '@/lib/swal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!authLoading && !user) {
      setLoading(false);
      router.replace('/');
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      try {
        const cardsFromApi = await fetchDashboardCards();
        setCards(Array.isArray(cardsFromApi) ? (cardsFromApi as DashboardCard[]) : []);
      } catch {
        setError('No se pudo cargar el dashboard. Vuelve a iniciar sesión.');
        void swalError('Error', 'No se pudo cargar el dashboard. Vuelve a iniciar sesión.');
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router, logout]);

  if (!authLoading && !user) return null;

  const isLoading = authLoading || loading;
  if (isLoading) {
    return <PageLoading label="Cargando tu panel..." className="min-h-[min(360px,55vh)]" />;
  }

  return (
    <>
      <PageHeader
        title="Panel de belleza"
        subtitle="Resumen de tus citas, servicios y actividad reciente del salón, barbería o spa."
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Indicadores del negocio"
      >
        {cards.map((card) => (
          <Card key={card.title} variant="elevated" padding="md">
            <div className="flex flex-col justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {card.title}
                </div>
                <div
                  className="mt-2 h-0.5 w-1/4 min-w-[2.5rem] rounded-full bg-gradient-to-r from-teal-400/70 to-cyan-500/40"
                  aria-hidden
                />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-slate-50 tabular-nums">
                {card.value}
              </div>
            </div>
          </Card>
        ))}
      </section>
    </>
  );
}
