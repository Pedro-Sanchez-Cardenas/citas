import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[var(--color-surface)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 -right-32 h-72 w-72 rounded-full bg-teal-500/12 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-4xl flex flex-col items-center gap-10 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-center md:gap-12 md:py-12">
        {children}
      </div>
    </div>
  );
}
