import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DashboardLayout({ user, onLogout, children }) {
  const router = useRouter();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: '🏠',
    },
    {
      label: 'Agenda',
      href: '/agenda',
      icon: '📅',
    },
    {
      label: 'Citas',
      href: '/appointments',
      icon: '📝',
    },
    {
      label: 'Clientes',
      href: '/clients',
      icon: '👥',
    },
    {
      label: 'Profesionales',
      href: '/professionals',
      icon: '💇',
    },
    {
      label: 'Servicios',
      href: '/services',
      icon: '✨',
    },
    {
      label: 'Servicios combinados',
      href: '/combined-services',
      icon: '💫',
    },
    {
      label: 'Relaciones de servicio',
      href: '/service-relations',
      icon: '🔗',
    },
    {
      label: 'Categorías',
      href: '/service-categories',
      icon: '🧩',
    },
    {
      label: 'Productos',
      href: '/products',
      icon: '🧴',
    },
    {
      label: 'Inventario',
      href: '/inventory',
      icon: '📦',
    },
    {
      label: 'Pagos',
      href: '/payments',
      icon: '💳',
    },
    {
      label: 'Horarios',
      href: '/working-hours',
      icon: '⏰',
    },
    {
      label: 'Bloqueos',
      href: '/blocks',
      icon: '🚫',
    },
    {
      label: 'Automatizaciones',
      href: '/automations',
      icon: '⚙️',
    },
    {
      label: 'Reportes',
      href: '/reports',
      icon: '📊',
    },
  ];

  const isActive = (href) =>
    router.pathname === href || router.pathname.startsWith(`${href}/`);

  return (
    <div className="relative h-screen flex overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-10 h-56 w-56 rounded-full bg-linear-to-br from-teal-400/22 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-linear-to-tr from-emerald-400/18 via-slate-900 to-transparent blur-3xl" />
      </div>

      <aside className="relative z-10 flex h-full w-64 flex-col border-r border-slate-800/90 bg-slate-950/80 px-5 pb-5 pt-6 backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-teal-500 to-cyan-500 text-lg shadow-[0_10px_25px_rgba(8,47,73,0.9)]">
            🗓
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-50">
              Citas Pro Beauty
            </h2>
            <p className="text-[11px] text-slate-400">
              Agenda profesional para negocios de belleza
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 text-sm">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium tracking-tight transition ${
                  active
                    ? 'bg-slate-900/90 text-slate-50 shadow-[0_0_0_1px_rgba(15,23,42,0.8)]'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-50'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-base ${
                    active
                      ? 'bg-teal-500/15 text-teal-200'
                      : 'bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-linear-to-b from-teal-400 to-cyan-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-3 text-[11px] text-slate-400">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-medium text-slate-100">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-slate-100">
                {user?.name ?? 'Usuario'}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-1 inline-flex w-full items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-slate-800/90"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        {children}
      </main>
    </div>
  );
}
