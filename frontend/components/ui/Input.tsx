import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | null;
  hint?: string | null;
  error?: string | null;
  className?: string;
  inputClassName?: string;
  required?: boolean;
}

export default function Input({
  label,
  hint,
  error,
  className,
  inputClassName,
  required,
  id,
  ...props
}: InputProps) {
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
      <input
        id={id}
        className={clsx(
          'w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50',
          error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/40',
          inputClassName
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
