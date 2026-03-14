'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string | null;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-[var(--radius-2xl)]',
        'border border-dashed border-slate-700/70 bg-slate-900/30',
        'px-5 py-10 sm:px-8 sm:py-12 text-center',
        className
      )}
    >
      {icon && (
        <div
          className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800/80 text-2xl sm:h-16 sm:w-16 sm:text-3xl"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-slate-100 sm:text-base">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-xs text-slate-400 sm:text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
