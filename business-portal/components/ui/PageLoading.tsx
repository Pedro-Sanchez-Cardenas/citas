'use client';

import clsx from 'clsx';

export interface PageLoadingProps {
  /** Texto mostrado bajo el indicador */
  label?: string;
  className?: string;
}

/**
 * Estado de carga consistente para páginas de listado y dashboards.
 */
export default function PageLoading({ label = 'Cargando...', className }: PageLoadingProps) {
  return (
    <div
      className={clsx('page-loading', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-teal-400/25 border-t-teal-400"
          aria-hidden
        />
        <span className="text-sm font-medium tracking-tight">{label}</span>
      </div>
    </div>
  );
}
