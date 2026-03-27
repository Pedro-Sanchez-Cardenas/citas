import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const baseClasses =
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98] min-h-(--touch-min)';

const variants = {
  primary:
    'bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-500 text-white shadow-[0_8px_28px_-6px_rgba(20,184,166,0.55),0_0_40px_-12px_rgba(45,212,191,0.25)] hover:brightness-110 focus-visible:ring-teal-400/80',
  subtle:
    'border border-white/[0.12] bg-white/[0.06] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm hover:bg-white/[0.1] focus-visible:ring-slate-400/50',
  ghost:
    'text-slate-200 hover:bg-white/[0.06] focus-visible:ring-slate-500/60',
  danger:
    'border border-red-500/45 bg-red-950/40 text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm hover:bg-red-950/60 focus-visible:ring-red-400/60',
  outline:
    'border border-white/[0.12] bg-transparent text-slate-100 hover:bg-white/[0.05] focus-visible:ring-slate-400/50',
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
