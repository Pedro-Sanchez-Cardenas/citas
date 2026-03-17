import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

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

  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-400">
      Redirigiendo a Horarios...
    </div>
  );
}
