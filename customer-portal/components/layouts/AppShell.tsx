import Link from 'next/link';
import { useRouter } from 'next/router';
import { logoutCustomer } from '@/lib/api/customer';
import type { ReactNode } from 'react';

interface AppShellProps {
  slug: string;
  children: ReactNode;
}

function NavLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const active = router.asPath === href;
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm ${
        active ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ slug, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href={`/${slug}/book`} className="text-sm font-semibold text-slate-100">
            Portal Clientes
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink href={`/${slug}/book`} label="Agendar" />
            <NavLink href={`/${slug}/appointments`} label="Mis citas" />
            <NavLink href={`/${slug}/profile`} label="Mi cuenta" />
            <button
              type="button"
              onClick={() => {
                void logoutCustomer(slug).finally(() => {
                  window.location.href = `/${slug}/login`;
                });
              }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

