'use client';

import clsx from 'clsx';
import type { ReactNode, HTMLAttributes } from 'react';

export type CardVariant = 'elevated' | 'outlined' | 'flat';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: ReactNode;
  className?: string;
}

const paddingMap = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

const variantMap: Record<CardVariant, string> = {
  elevated:
    'rounded-2xl border border-white/10 bg-slate-900/60 shadow-(--shadow-card) backdrop-blur-xl transition-[box-shadow,transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-slate-900/70 hover:shadow-[var(--shadow-card-hover)]',
  outlined:
    'rounded-2xl border border-white/12 bg-slate-900/45 backdrop-blur-md',
  flat:
    'rounded-xl border border-white/8 bg-slate-900/35 backdrop-blur-sm',
};

export default function Card({
  variant = 'elevated',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(variantMap[variant], paddingMap[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
