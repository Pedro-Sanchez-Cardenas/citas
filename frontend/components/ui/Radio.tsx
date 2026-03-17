import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: 'radio';
  label?: string | null;
  className?: string;
  wrapperClassName?: string;
}

export default function Radio({
  label,
  className,
  wrapperClassName,
  id,
  ...props
}: RadioProps) {
  return (
    <label
      className={clsx(
        'inline-flex min-h-(--touch-min) cursor-pointer items-center gap-3 rounded-md py-1 pr-2 text-sm text-slate-300 transition hover:text-slate-100 active:scale-[0.99]',
        wrapperClassName
      )}
      htmlFor={id}
    >
      <input
        type="radio"
        id={id}
        className={clsx(
          'h-5 w-5 shrink-0 rounded-full border-2 border-[var(--color-border)] bg-surface-elevated/80 text-teal-500 transition',
          'focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 focus:ring-offset-surface',
          'checked:border-teal-500 checked:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        {...props}
      />
      {label != null && label !== '' && (
        <span className="select-none">{label}</span>
      )}
    </label>
  );
}
