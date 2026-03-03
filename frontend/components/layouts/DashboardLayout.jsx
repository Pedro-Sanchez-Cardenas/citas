import React from 'react';

export default function DashboardLayout({ user, onLogout, children }) {
  return (
    <div className="relative h-screen flex overflow-hidden bg-slate-950 text-slate-100">
      {/* halos de fondo */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-10 h-56 w-56 rounded-full bg-gradient-to-br from-teal-400/22 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-7rem] right-0 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400/18 via-slate-900 to-transparent blur-3xl" />
      </div>

      <aside className="relative z-10 flex h-full w-64 flex-col border-r border-slate-800/90 bg-slate-950/80 px-5 pb-5 pt-6 backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-lg shadow-[0_10px_25px_rgba(8,47,73,0.9)]">
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
          <button className="group relative flex w-full items-center gap-2 rounded-xl bg-slate-900/90 px-3 py-2.5 text-slate-50 shadow-[0_0_0_1px_rgba(15,23,42,0.8)]">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/15 text-base text-teal-200">
              📅
            </span>
            <span className="text-[13px] font-medium tracking-tight">
              Agenda de hoy
            </span>
            <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-gradient-to-b from-teal-400 to-cyan-400" />
          </button>
          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-slate-300 transition hover:bg-slate-900/80 hover:text-slate-50">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800/60 text-base">
              👥
            </span>
            <span className="text-[13px] font-medium tracking-tight">
              Clientes
            </span>
          </button>
          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-slate-300 transition hover:bg-slate-900/80 hover:text-slate-50">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800/60 text-base">
              📊
            </span>
            <span className="text-[13px] font-medium tracking-tight">
              Reportes
            </span>
          </button>
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

