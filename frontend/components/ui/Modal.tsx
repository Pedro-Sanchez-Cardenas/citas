import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  title?: string | null;
  description?: string | null;
  children?: ReactNode;
  onClose?: (() => void) | null;
  size?: ModalSize;
}

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = 'md',
}: ModalProps) {
  if (typeof document === 'undefined') return null;
  if (!open) return null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const maxWidth = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-xl overflow-y-auto"
      onClick={onClose ?? undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={clsx(
          'flex w-full max-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl',
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description || onClose) && (
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800/80 px-6 pt-6 pb-4">
            <div className="min-w-0">
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-slate-50">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800/80 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                aria-label="Cerrar modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

