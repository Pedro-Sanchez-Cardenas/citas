import clsx from 'clsx';
import { useState } from 'react';
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
  onInvalid,
  onInput,
  ...props
}: InputProps) {
  const [nativeError, setNativeError] = useState<string | null>(null);
  const effectiveError = error ?? nativeError;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = effectiveError ? `${id}-error` : undefined;

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
          inputClassName,
          effectiveError && 'border-red-500/80! bg-red-950/30! focus:border-red-500! focus:ring-red-500/40!'
        )}
        aria-invalid={!!effectiveError}
        aria-describedby={errorId ?? hintId}
        onInvalid={(e) => {
          if (error) return;
          setNativeError(e.currentTarget.validationMessage || 'Campo inválido.');
          onInvalid?.(e);
        }}
        onInput={(e) => {
          if (nativeError && e.currentTarget.validity.valid) {
            setNativeError(null);
          }
          onInput?.(e);
        }}
        required={required}
        {...props}
      />
      {hint && !effectiveError && (
        <p id={hintId} className="mt-1 text-[11px] text-slate-500">
          {hint}
        </p>
      )}
      {effectiveError && (
        <p id={errorId} className="mt-1 text-[11px] text-red-300">
          {effectiveError}
        </p>
      )}
    </div>
  );
}
