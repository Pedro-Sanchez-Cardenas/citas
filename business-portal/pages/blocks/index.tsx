import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoading } from '@/components/ui';

/**
 * Redirige a Horarios y disponibilidad (pestaña Bloqueos).
 * Los bloqueos se gestionan desde /working-hours.
 */
export default function BlocksRedirectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    router.replace({ pathname: '/working-hours', query: { tab: 'blocks' } });
  }, [user, authLoading, router]);

  return <PageLoading label="Redirigiendo a horarios y bloqueos..." className="min-h-[220px]" />;
}
