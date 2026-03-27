import AuthLayout from '@/components/layouts/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="mb-8 w-full max-w-md text-center md:mb-0 md:max-w-lg md:text-left">
        <p className="inline-flex items-center gap-2 rounded-full border border-teal-400/35 bg-teal-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-100 shadow-[0_0_24px_-4px_rgba(45,212,191,0.35)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          Plataforma de citas para belleza
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          Control profesional de tu agenda
        </h1>
        <p className="mt-3 text-sm text-slate-300 sm:text-base">
          Centraliza citas, clientes y servicios de barberías, salones, spas y estudios de
          belleza en un solo panel moderno y fácil de usar.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <div className="surface-muted flex items-start gap-3 rounded-xl px-3 py-2.5">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/25 text-[11px] font-semibold text-teal-200 ring-1 ring-teal-500/30">
              ✓
            </span>
            <p className="leading-relaxed">Agenda diaria clara para todo el equipo.</p>
          </div>
          <div className="surface-muted flex items-start gap-3 rounded-xl px-3 py-2.5">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-semibold text-cyan-200 ring-1 ring-cyan-500/25">
              ✓
            </span>
            <p className="leading-relaxed">Historial de clientes y servicios más solicitados.</p>
          </div>
        </div>
      </div>
      <LoginForm />
    </AuthLayout>
  );
}
