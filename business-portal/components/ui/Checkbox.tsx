import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: 'checkbox';
  label?: string | null;
  className?: string;
  wrapperClassName?: string;
}

export default function Checkbox({
  label,
  className,
  wrapperClassName,
  id,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={clsx(
        'inline-flex min-h-(--touch-min) cursor-pointer items-center gap-3 rounded-md py-1 pr-2 text-sm text-slate-300 transition hover:text-slate-100 active:scale-[0.99]',
        wrapperClassName
      )}
      htmlFor={id}
    >
      <input
        type="checkbox"
        id={id}
        className={clsx(
          'h-5 w-5 shrink-0 rounded-sm border-2 border-white/[0.15] bg-slate-950/50 text-teal-400 transition backdrop-blur-sm',
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
