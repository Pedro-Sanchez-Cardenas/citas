import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* halos de fondo */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-40 -right-32 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/20 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400/18 via-slate-900 to-transparent blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl items-center gap-12 px-6 md:flex">
        {children}
      </div>
    </div>
  );
}

