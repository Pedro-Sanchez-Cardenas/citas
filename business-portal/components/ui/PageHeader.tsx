'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

export interface PageHeaderProps {
  title: string;
  subtitle?: string | null;
  action?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <header
      className={clsx(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        'pb-4 sm:pb-5',
        className
      )}
    >
      <div className="min-w-0 flex-1 border-l-2 border-teal-500/50 pl-4">
        <h1 className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-300/90 bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-slate-400 sm:mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 sm:mt-0">
          {action}
        </div>
      )}
    </header>
  );
}
