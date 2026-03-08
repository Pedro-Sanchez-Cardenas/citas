import clsx from 'clsx';
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | null;
  hint?: string | null;
  error?: string | null;
  className?: string;
  textareaClassName?: string;
  required?: boolean;
  rows?: number;
}

export default function Textarea({
  label,
  hint,
  error,
  className,
  textareaClassName,
  required,
  rows = 3,
  id,
  ...props
}: TextareaProps) {
  return (
    <div className={className}>
      {label && (
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400"
          htmlFor={id}
        >
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={clsx(
          'w-full resize-none rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50',
          error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/40',
          textareaClassName
        )}
        aria-invalid={!!error}
        aria-describedby={hint ? `${id}-hint` : undefined}
        required={required}
        {...props}
      />
      {hint && !error && (
        <p id={id ? `${id}-hint` : undefined} className="mt-1 text-[11px] text-slate-500">
          {hint}
        </p>
      )}
      {error && <p className="mt-1 text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
