'use client';

import { memo } from 'react';
import { FloatMenu } from '@/components/ui';
import clsx from 'clsx';
import type { User } from '@/types';
import type { FloatMenuOptionItem } from '@/components/ui/FloatMenu';

const BRAND = {
  name: 'Citas Pro Beauty',
  subtitle: 'Panel de administración',
  icon: '🗓',
};

interface NavbarProps {
  user: User | null;
  userMenuOptions?: FloatMenuOptionItem[];
  onMenuClick?: () => void;
  className?: string;
}

function Navbar({
  user,
  userMenuOptions = [],
  onMenuClick,
  className = '',
}: NavbarProps) {
  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex h-14 min-h-(--touch-min) items-center justify-between gap-4 border-b border-white/[0.08] bg-slate-950/65 px-4 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150 sm:px-5 safe-top',
        className
      )}
      role="banner"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.06] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-teal-400/40 active:scale-[0.98]"
          aria-label="Abrir menú"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-400 to-cyan-500 text-base shadow-[0_10px_28px_-6px_rgba(20,184,166,0.45)] ring-1 ring-white/15">
            {BRAND.icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-50">{BRAND.name}</p>
            <p className="truncate text-[11px] text-slate-400">{BRAND.subtitle}</p>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <FloatMenu placement="bottom-end" className="shrink-0" options={userMenuOptions}>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-slate-900/60 text-sm font-semibold text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-teal-400/40 active:scale-[0.98]"
            aria-label="Cuenta y opciones"
          >
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </button>
        </FloatMenu>
      </div>
    </header>
  );
}

export default memo(Navbar);
