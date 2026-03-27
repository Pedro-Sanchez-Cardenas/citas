import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === 'undefined') return null;
  if (!open) return null;

  const sizeClasses =
    size === 'sm'
      ? 'max-w-sm rounded-2xl'
      : size === 'lg'
        ? 'max-w-2xl rounded-2xl'
        : size === 'full'
          ? 'max-w-[min(100vw,28rem)] max-h-[85dvh] rounded-t-3xl sm:rounded-2xl'
          : 'max-w-md rounded-2xl';

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4 overflow-y-auto"
      onClick={onClose ?? undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={clsx(
          'flex w-full max-h-[calc(100dvh-2rem)] flex-col border border-white/10 bg-slate-900/70 shadow-(--shadow-modal) backdrop-blur-2xl',
          sizeClasses
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description || onClose) && (
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/8 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
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
                className="flex h-(--touch-min) w-(--touch-min) shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/8 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                aria-label="Cerrar modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
