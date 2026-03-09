import clsx from 'clsx';
import { useState } from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | null;
  hint?: string | null;
  error?: string | null;
  className?: string;
  selectClassName?: string;
  required?: boolean;
  children?: ReactNode;
}

export default function Select({
  label,
  hint,
  error,
  className,
  selectClassName,
  required,
  children,
  id,
  onChange,
  onInvalid,
  ...props
}: SelectProps) {
  const [nativeError, setNativeError] = useState<string | null>(null);
  const effectiveError = error ?? nativeError;

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
      <select
        id={id}
        className={clsx(
          'w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50',
          selectClassName,
          effectiveError && 'border-red-500/80! bg-red-950/30! focus:border-red-500! focus:ring-red-500/40!'
        )}
        aria-invalid={!!effectiveError}
        onInvalid={(e) => {
          if (error) return;
          setNativeError(e.currentTarget.validationMessage || 'Campo inválido.');
          onInvalid?.(e);
        }}
        onChange={(e) => {
          if (nativeError && e.currentTarget.validity.valid) {
            setNativeError(null);
          }
          onChange?.(e);
        }}
        required={required}
        {...props}
      >
        {children}
      </select>
      {hint && !effectiveError && (
        <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      )}
      {effectiveError && <p className="mt-1 text-[11px] text-red-300">{effectiveError}</p>}
    </div>
  );
}
