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
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = effectiveError ? `${id}-error` : undefined;

  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-400"
          htmlFor={id}
        >
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          'w-full min-h-(--touch-min) rounded-xl border border-white/[0.1] bg-slate-950/45 pl-4 pr-10 py-2.5 text-sm text-slate-50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] outline-none ring-0 backdrop-blur-sm transition focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/25 disabled:cursor-not-allowed disabled:opacity-60 appearance-none bg-no-repeat bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center]',
          selectClassName,
          effectiveError &&
            'border-red-500/80 bg-red-950/30 focus:border-red-500 focus:ring-red-500/30'
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        }}
        aria-invalid={!!effectiveError}
        aria-describedby={errorId ?? hintId}
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
        <p id={hintId} className="text-[11px] text-slate-500">{hint}</p>
      )}
      {effectiveError && (
        <p id={errorId} className="text-[11px] text-red-300">{effectiveError}</p>
      )}
    </div>
  );
}
