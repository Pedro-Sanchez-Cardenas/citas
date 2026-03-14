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
        'sticky top-0 z-30 flex h-14 min-h-[var(--touch-min)] items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-overlay)] px-4 backdrop-blur-xl sm:px-5 safe-top',
        className
      )}
      role="banner"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 text-slate-100 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 active:scale-[0.98]"
          aria-label="Abrir menú"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-base shadow-lg shadow-teal-500/20 ring-1 ring-white/10">
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] text-sm font-semibold text-slate-100 ring-1 ring-[var(--color-border)] transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 active:scale-[0.98]"
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
