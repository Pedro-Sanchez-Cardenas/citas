'use client';

import { memo } from 'react';
import Link from 'next/link';
import { FloatMenu } from '@/components/ui';
import clsx from 'clsx';
import type { User } from '@/types';
import type { FloatMenuOptionItem } from '@/components/ui/FloatMenu';

const BRAND = {
  name: 'Citas Pro Beauty',
  tagline: 'Agenda profesional para negocios de belleza',
  icon: '🗓',
};

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavLinkProps {
  item: NavItem;
  isActive: (href: string) => boolean;
  onClose?: () => void;
}

function NavLink({ item, isActive, onClose }: NavLinkProps) {
  const active = isActive(item.href);
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={clsx(
        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 min-h-[44px]',
        active
          ? 'bg-teal-500/15 text-teal-200 shadow-[0_0_0_1px_rgba(20,184,166,0.2)]'
          : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
      )}
    >
      <span
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base transition-colors',
          active ? 'bg-teal-500/25 text-teal-300' : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700/80 group-hover:text-slate-300'
        )}
      >
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
      {active && (
        <span
          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-teal-400"
          aria-hidden
        />
      )}
    </Link>
  );
}

interface SidebarProps {
  user: User | null;
  userMenuOptions?: FloatMenuOptionItem[];
  navSections?: NavSection[];
  isActive: (href: string) => boolean;
  onClose?: () => void;
  open?: boolean;
  variant?: 'desktop' | 'mobile';
}

function Sidebar({
  user,
  userMenuOptions = [],
  navSections = [],
  isActive,
  onClose,
  open = false,
  variant = 'desktop',
}: SidebarProps) {
  const roleKey = Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles[0] : null;
  const isMobile = variant === 'mobile';

  const content = (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] pb-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-xl shadow-lg shadow-teal-500/20 ring-1 ring-white/10">
          {BRAND.icon}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight text-slate-50">
            {BRAND.name}
          </h2>
          <p className="truncate text-[11px] text-slate-400">{BRAND.tagline}</p>
        </div>
      </div>

      <nav
        className="flex-1 space-y-5 overflow-y-auto py-4 pr-1"
        aria-label="Navegación principal"
      >
        {navSections.map((section) => (
          <div key={section.label}>
            <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  onClose={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 pt-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-surface-elevated/80 px-3.5 py-3 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-semibold text-slate-100 ring-1 ring-slate-700/80">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-100">
                  {user?.name ?? 'Usuario'}
                </div>
                <div className="truncate text-[11px] text-slate-400">{user?.email}</div>
                {roleKey && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-teal-500/40 bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden />
                    {roleKey.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
            <FloatMenu placement="top-end" className="shrink-0" options={userMenuOptions}>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800/80 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                aria-label="Opciones de cuenta"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </FloatMenu>
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          aria-hidden
          onClick={onClose}
        />
        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-[var(--color-surface)] px-4 pb-6 pt-6 shadow-2xl ring-1 ring-[var(--color-border)] transition-transform duration-300 ease-out lg:hidden safe-top safe-bottom',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
          aria-label="Menú de navegación"
        >
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-[var(--touch-min)] w-[var(--touch-min)] items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              aria-label="Cerrar menú"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {content}
        </aside>
      </>
    );
  }

  return (
    <aside
      className="flex h-full w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 pb-5 pt-6"
      aria-label="Barra lateral"
    >
      {content}
    </aside>
  );
}

export default memo(Sidebar);
