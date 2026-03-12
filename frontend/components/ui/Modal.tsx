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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-xl overflow-y-auto">
      <div
        className={clsx(
          'flex w-full max-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl',
          maxWidth
        )}
      >
        {(title || description) && (
          <header className="shrink-0 border-b border-slate-800/80 px-6 pt-6 pb-4">
            {title && <h2 className="text-lg font-semibold text-slate-50">{title}</h2>}
            {description && (
              <p className="mt-1 text-xs text-slate-400">{description}</p>
            )}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="sr-only"
            aria-label="Cerrar modal"
          />
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

