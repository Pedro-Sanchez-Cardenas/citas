import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboardCards } from '@/lib/api/dashboard';
import type { DashboardCard } from '@/components/dashboard/types';
import { PageHeader, Card, Container, Alert } from '@/components/ui';

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
    return (
      <Container className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-700/80" />
          <span className="text-sm">Cargando dashboard...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title="Panel de belleza"
        subtitle="Resumen de tus citas, servicios y actividad reciente del salón, barbería o spa."
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} variant="elevated" padding="md">
            <div className="flex flex-col justify-between gap-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                {card.title}
              </div>
              <div className="text-2xl font-semibold text-slate-50 tabular-nums">
                {card.value}
              </div>
            </div>
          </Card>
        ))}
      </section>
    </Container>
  );
}
