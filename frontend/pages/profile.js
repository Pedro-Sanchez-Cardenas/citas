import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBusinessSetup } from '@/lib/api/businessSetup';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [setup, setSetup] = useState(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (!user) return;

    const load = async () => {
      try {
        const data = await fetchBusinessSetup();
        setSetup(data);
      } catch (e) {
        setError('No se pudo cargar el estado de configuración del negocio.');
      } finally {
        setLoadingSetup(false);
      }
    };

    load();
  }, [user, authLoading, router]);

  if (!authLoading && !user) {
    return null;
  }

  const isLoading = authLoading || loadingSetup;

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Perfil y configuración
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Actualiza tu información de usuario y revisa el progreso del
            onboarding de tu negocio.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tarjeta de usuario */}
        <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.8)] lg:col-span-1">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-500 text-lg font-semibold text-slate-950">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-50">
                {user?.name ?? 'Usuario'}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Negocio
              </p>
              <p className="mt-1 text-sm">
                {user?.business?.name ?? 'Sin negocio asignado'}
              </p>
            </div>
          </div>

          {/* Aquí más adelante puedes agregar el formulario editable de perfil */}
          <p className="mt-4 text-[11px] text-slate-500">
            Próximamente: edición de datos personales, contraseña y
            preferencias.
          </p>
        </section>

        {/* Onboarding negocio */}
        <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.8)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Onboarding del negocio
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Completa estos pasos para dejar listo tu panel y empezar a
                agendar citas.
              </p>
            </div>
            {!isLoading && setup && (
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ${
                  setup.completed
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/10 text-amber-200 border border-amber-500/40'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {setup.completed ? 'Onboarding completado' : 'Configuración pendiente'}
              </span>
            )}
          </div>

          {isLoading && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
              Cargando estado de configuración...
            </div>
          )}

          {!isLoading && setup && setup.steps?.length > 0 && (
            <ul className="mt-2 space-y-2">
              {setup.steps.map((step) => (
                <li
                  key={step.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-2.5 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                        step.completed
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {step.completed ? '✓' : '•'}
                    </span>
                    <div>
                      <p className="font-medium text-slate-100">
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {step.completed
                          ? 'Listo'
                          : 'Pendiente de configurar en el panel'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <p className="font-mono text-xs text-slate-200">
                      {step.count}
                    </p>
                    <p>elementos</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && setup && setup.steps?.length === 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
              El usuario aún no tiene un negocio asociado. Crea un negocio para
              empezar el onboarding.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

