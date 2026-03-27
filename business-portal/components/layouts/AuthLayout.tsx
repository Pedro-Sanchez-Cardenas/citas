import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 -right-24 h-96 w-96 rounded-full bg-teal-400/[0.14] blur-[100px]" />
        <div className="absolute top-1/4 left-0 h-72 w-72 rounded-full bg-indigo-500/[0.08] blur-[90px]" />
        <div className="absolute -bottom-40 -left-20 h-[22rem] w-[22rem] rounded-full bg-cyan-500/[0.12] blur-[110px]" />
      </div>
      <div className="relative w-full max-w-4xl flex flex-col items-center gap-10 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-center md:gap-12 md:py-12">
        {children}
      </div>
    </div>
  );
}
