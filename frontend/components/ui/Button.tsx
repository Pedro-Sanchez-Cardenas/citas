import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const baseClasses =
  'inline-flex items-center justify-center rounded-[var(--radius-xl)] text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98] min-h-[var(--touch-min)]';

const variants = {
  primary:
    'bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 text-white shadow-[0_4px_24px_-4px_rgba(20,184,166,0.5)] hover:brightness-110 focus-visible:ring-teal-400',
  subtle:
    'border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 text-slate-100 hover:bg-slate-800/90 focus-visible:ring-slate-500',
  ghost: 'text-slate-200 hover:bg-slate-800/70 focus-visible:ring-slate-500',
  danger:
    'border border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 focus-visible:ring-red-400',
  outline:
    'border border-[var(--color-border)] bg-transparent text-slate-100 hover:bg-slate-800/70 focus-visible:ring-slate-500',
};

const sizes: Record<string, string> = {
  sm: 'px-3 py-2 text-xs rounded-[var(--radius-md)] min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-[var(--radius-xl)]',
  lg: 'px-5 py-3 text-sm rounded-2xl',
  full: 'w-full px-4 py-2.5 text-sm rounded-2xl',
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const sizeKey = variant === 'primary' && size === 'full' ? 'full' : size;
  return (
    <button
      className={clsx(baseClasses, variants[variant], sizes[sizeKey], className)}
      {...props}
    >
      {children}
    </button>
  );
}
