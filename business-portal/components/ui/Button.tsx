import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const baseClasses =
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98] min-h-(--touch-min)';

const variants = {
  primary:
    'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-slate-50 shadow-[0_10px_24px_-10px_rgba(13,148,136,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] hover:from-teal-600 hover:via-teal-500 hover:to-emerald-500 focus-visible:ring-teal-400/60',
  subtle:
    'border border-white/12 bg-slate-900/55 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm hover:bg-slate-800/70 focus-visible:ring-slate-400/50',
  ghost:
    'text-slate-200 hover:bg-slate-800/55 focus-visible:ring-slate-500/60',
  danger:
    'border border-red-500/45 bg-red-950/40 text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm hover:bg-red-950/60 focus-visible:ring-red-400/60',
  outline:
    'border border-white/12 bg-transparent text-slate-100 hover:bg-slate-800/45 focus-visible:ring-slate-400/50',
};

const sizes: Record<string, string> = {
  sm: 'px-3 py-2 text-xs rounded-md min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-xl',
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
