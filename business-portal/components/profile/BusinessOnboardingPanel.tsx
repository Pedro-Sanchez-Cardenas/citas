import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { BusinessSetup } from '@/components/profile/types';

export interface BusinessOnboardingPanelProps {
  setup: BusinessSetup | null;
  isLoading: boolean;
}

const STEP_CONFIG: Record<
  string,
  { href: string; cta: string; description: string; icon: string }
> = {
  branches: {
    href: '/billing',
    cta: 'Configurar sucursal',
    description:
      'Configura al menos una sucursal para que tus citas y recursos estén vinculados a un lugar.',
    icon: '📍',
  },
  service_categories: {
    href: '/service-categories',
    cta: 'Crear categorías',
    description:
      'Crea categorías para organizar tus servicios (por ejemplo: cortes, color, tratamientos).',
    icon: '🧩',
  },
  services: {
    href: '/services',
    cta: 'Configurar servicios',
    description:
      'Crea los servicios que ofreces con sus precios y duración para usarlos en la agenda.',
    icon: '✨',
  },
  professionals: {
    href: '/professionals',
    cta: 'Crear tu equipo',
    description:
      'Da de alta a los profesionales que atienden citas para poder asignarles horarios y servicios.',
    icon: '💇',
  },
  working_hours: {
    href: '/working-hours',
    cta: 'Definir horarios',
    description:
      'Configura los horarios de trabajo y bloqueos para que tu agenda respete la disponibilidad.',
    icon: '⏰',
  },
  products: {
    href: '/products',
    cta: 'Dar de alta productos',
    description:
      'Registra los productos que usas y vendes para controlar inventario y costos.',
    icon: '🧴',
  },
};

export function BusinessOnboardingPanel({ setup, isLoading }: BusinessOnboardingPanelProps) {
  const steps = setup?.steps ?? [];
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.completed).length;
  const progress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!steps.length) return;
    const firstIncomplete = steps.find((s) => !s.completed)?.key ?? steps[0]?.key;
    setActiveKey(firstIncomplete ?? null);
  }, [steps]);

  const activeStep = useMemo(
    () => steps.find((s) => s.key === activeKey) ?? steps[0],
    [steps, activeKey]
  );

  return (
    <section className="surface-panel p-5 lg:col-span-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
            Onboarding del negocio
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Completa estos pasos clave para dejar listo tu panel y empezar a agendar citas en
            minutos.
          </p>
        </div>
        {!isLoading && setup && totalSteps > 0 && (
          <div className="surface-inset w-full max-w-xs px-3 py-2 text-xs text-slate-200">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-medium">
                {setup.completed ? 'Onboarding completado' : 'Configuración en progreso'}
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                {completedSteps}/{totalSteps} pasos
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={`h-full rounded-full ${
                  setup.completed
                    ? 'bg-emerald-400'
                    : 'bg-linear-to-r from-teal-400 via-cyan-400 to-emerald-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Wizard compacto para PRIMERA vez (cuando no hay ningún paso completado) */}
      {!isLoading &&
        steps.length > 0 &&
        !setup?.completed &&
        completedSteps === 0 &&
        activeStep && (
        <div className="surface-inset mb-4 px-4 py-3 text-xs text-slate-200">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Primeros pasos
              </p>
              <p className="mt-0.5 text-xs text-slate-300">
                Sigue estos pasos en orden sugerido. Puedes saltar entre ellos cuando quieras.
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-slate-400">
              Paso {steps.findIndex((s) => s.key === activeStep.key) + 1} de {totalSteps}
            </span>
          </div>
          {activeStep && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400">
                Empecemos por{' '}
                <span className="font-medium text-slate-100">{activeStep.label}</span>. Te
                llevará solo unos minutos.
              </p>
              {(() => {
                const config = STEP_CONFIG[activeStep.key] ?? {
                  href: '/dashboard',
                  cta: 'Ir al módulo',
                  description: '',
                  icon: '⭐',
                };
                return (
                  <Link
                    href={config.href}
                    className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-teal-400 to-cyan-500 px-3 py-1 text-[11px] font-semibold text-slate-950 shadow-[0_8px_24px_-6px_rgba(20,184,166,0.45)] hover:brightness-110"
                  >
                    {config.cta} →
                  </Link>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="surface-muted px-4 py-3 text-sm text-slate-300">
          Cargando estado de configuración...
        </div>
      )}

      {!isLoading && setup && steps.length > 0 && (
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {steps.map((step) => {
            const config = STEP_CONFIG[step.key] ?? {
              href: '/dashboard',
              cta: 'Ir al módulo',
              description:
                'Revisa este apartado del sistema para completar la configuración.',
              icon: '⭐',
            };
            const isDone = !!step.completed;
            const isActive = activeStep && step.key === activeStep.key;
            return (
              <div
                key={step.key}
                role="button"
                tabIndex={0}
                onClick={() => setActiveKey(step.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveKey(step.key);
                  }
                }}
                className={`flex flex-col justify-between gap-3 rounded-xl border px-3.5 py-3 text-xs transition-shadow sm:text-sm ${
                  isActive
                    ? 'border-teal-400/45 bg-slate-950/70 shadow-[0_0_0_1px_rgba(45,212,191,0.15),0_12px_40px_-16px_rgba(0,0,0,0.45)]'
                    : 'border-white/[0.08] bg-slate-950/35 hover:border-white/[0.12] hover:bg-slate-950/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-base ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                        : 'bg-white/[0.06] text-slate-200 ring-1 ring-white/[0.06]'
                    }`}
                    aria-hidden
                  >
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-50">{step.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {config.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
                    {typeof step.count === 'number' && (
                      <>
                        <span className="font-mono text-xs text-slate-200">
                          {step.count}
                        </span>
                        <span>elementos</span>
                      </>
                    )}
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                        isDone
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isDone ? 'bg-emerald-400' : 'bg-amber-300'
                        }`}
                        aria-hidden
                      />
                      {isDone ? 'Listo' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    {isDone
                      ? 'Puedes volver cuando quieras para hacer ajustes.'
                      : 'Te recomendamos completar este paso antes de empezar a agendar.'}
                  </span>
                  <Link
                    href={config.href}
                    className="shrink-0 text-[11px] font-medium text-teal-300 underline underline-offset-2 hover:text-teal-200"
                  >
                    {isDone ? 'Revisar' : config.cta} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && setup && steps.length === 0 && (
        <div className="surface-muted px-4 py-3 text-sm text-slate-300">
          El usuario aún no tiene un negocio asociado. Crea un negocio para empezar el
          onboarding.
        </div>
      )}
    </section>
  );
}

