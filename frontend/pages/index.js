import AuthLayout from '@/components/layouts/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
	return (
		<AuthLayout>
			<div className="mb-10 max-w-md md:mb-0">
				<p className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-slate-900/70 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-teal-200">
					<span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
					Plataforma de citas para belleza
				</p>
				<h1 className="mt-5 text-3xl font-semibold text-slate-50 md:text-4xl">
					Control profesional de tu agenda
				</h1>
				<p className="mt-3 text-sm text-slate-300 md:text-base">
					Centraliza citas, clientes y servicios de barberías, salones, spas y estudios de
					belleza en un solo panel moderno y fácil de usar.
				</p>
				<div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-2">
					<div className="flex items-start gap-2">
						<span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/15 text-[11px] text-teal-300">
							✓
						</span>
						<p>Agenda diaria clara para todo el equipo.</p>
					</div>
					<div className="flex items-start gap-2">
						<span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] text-cyan-300">
							✓
						</span>
						<p>Historial de clientes y servicios más solicitados.</p>
					</div>
				</div>
			</div>

			<LoginForm />
		</AuthLayout>
	);
}
