import clsx from 'clsx';
import { useState } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | null;
  hint?: string | null;
  error?: string | null;
  className?: string;
  textareaClassName?: string;
  required?: boolean;
  rows?: number;
  resize?: boolean;
}

export default function Textarea({
  label,
  hint,
  error,
  className,
  textareaClassName,
  required,
  rows = 3,
  resize = false,
  id,
  onInvalid,
  onInput,
  ...props
}: TextareaProps) {
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
      <textarea
        id={id}
        rows={rows}
        className={clsx(
          'w-full min-h-[calc(var(--touch-min)*2)] rounded-xl border border-slate-700/80 bg-surface-elevated/60 px-4 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-500',
          resize ? 'resize-y' : 'resize-none',
          textareaClassName,
          effectiveError &&
            'border-red-500/80 bg-red-950/30 focus:border-red-500 focus:ring-red-500/30'
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
        <p id={hintId} className="text-[11px] text-slate-500">
          {hint}
        </p>
      )}
      {effectiveError && (
        <p id={errorId} className="text-[11px] text-red-300">
          {effectiveError}
        </p>
      )}
    </div>
  );
}
