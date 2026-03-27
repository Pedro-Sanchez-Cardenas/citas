'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

export type AlertVariant = 'error' | 'success' | 'info' | 'warning';

export interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantMap: Record<AlertVariant, string> = {
  error:
    'border-red-500/40 bg-red-500/10 text-red-100 [--alert-ring:rgba(248,113,113,0.25)]',
  success:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-100 [--alert-ring:rgba(52,211,153,0.25)]',
  info:
    'border-sky-500/40 bg-sky-500/10 text-sky-100 [--alert-ring:rgba(56,189,248,0.25)]',
  warning:
    'border-amber-500/40 bg-amber-500/10 text-amber-100 [--alert-ring:rgba(245,158,11,0.25)]',
};

export default function Alert({
  variant = 'info',
  children,
  className = '',
}: AlertProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border px-4 py-3 text-sm shadow-[0_0_0_1px_var(--alert-ring),0_8px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur-sm',
        variantMap[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
