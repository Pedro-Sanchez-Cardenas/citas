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
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-400 sm:mt-1.5">
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
