import clsx from 'clsx';

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = 'md',
}) {
  if (!open) return null;

  const maxWidth =
    size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={clsx(
          'w-full rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl',
          maxWidth
        )}
      >
        {(title || description) && (
          <header className="mb-4">
            {title && (
              <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-slate-400">{description}</p>
            )}
          </header>
        )}
        <div>{children}</div>
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
}

