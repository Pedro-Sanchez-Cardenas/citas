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
    'rounded-2xl bg-surface-elevated shadow-(--shadow-card) border border-white/[0.06] transition-shadow hover:shadow-[var(--shadow-card-hover)]',
  outlined:
    'rounded-2xl bg-surface border border-slate-700/80',
  flat:
    'rounded-xl bg-surface-elevated/60',
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
