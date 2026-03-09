'use client';

import { useRouter } from 'next/router';
import { useState, useMemo, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import type { User } from '@/types';
import type { FloatMenuOptionItem } from '@/components/ui/FloatMenu';

interface NavSection {
  label: string;
  items: { label: string; href: string; icon: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
      { label: 'Agenda', href: '/agenda', icon: '📅' },
      { label: 'Citas', href: '/appointments', icon: '📝' },
    ],
  },
  {
    label: 'Clientes y equipo',
    items: [
      { label: 'Clientes', href: '/clients', icon: '👥' },
      { label: 'Profesionales', href: '/professionals', icon: '💇' },
    ],
  },
  {
    label: 'Servicios y catálogo',
    items: [
      { label: 'Servicios', href: '/services', icon: '✨' },
      { label: 'Servicios combinados', href: '/combined-services', icon: '💫' },
      { label: 'Relaciones de servicio', href: '/service-relations', icon: '🔗' },
      { label: 'Categorías', href: '/service-categories', icon: '🧩' },
      { label: 'Productos', href: '/products', icon: '🧴' },
      { label: 'Inventario', href: '/inventory', icon: '📦' },
    ],
  },
  {
    label: 'Calendario',
    items: [
      { label: 'Horarios', href: '/working-hours', icon: '⏰' },
      { label: 'Bloqueos', href: '/blocks', icon: '🚫' },
    ],
  },
  {
    label: 'Finanzas',
    items: [{ label: 'Pagos', href: '/payments', icon: '💳' }],
  },
  {
    label: 'Reportes',
    items: [{ label: 'Reportes', href: '/reports', icon: '📊' }],
  },
  {
    label: 'Configuración',
    items: [{ label: 'Automatizaciones', href: '/automations', icon: '⚙️' }],
  },
];

interface DashboardLayoutProps {
  user: User | null;
  onLogout: () => void;
  children?: React.ReactNode;
}

export default function DashboardLayout({ user, onLogout, children }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = useCallback(
    (href: string) =>
      router.pathname === href || router.pathname.startsWith(`${href}/`),
    [router.pathname]
  );

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  const userMenuOptions: FloatMenuOptionItem[] = useMemo(
    () => [
      {
        label: 'Ver perfil',
        onClick: () => {
          closeSidebar();
          router.push('/profile');
        },
      },
      {
        label: 'Facturación',
        onClick: () => {
          closeSidebar();
          router.push('/billing');
        },
      },
      { divider: true },
      { label: 'Cerrar sesión', onClick: onLogout },
    ],
    [onLogout, router]
  );

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-0 h-72 w-72 rounded-full bg-teal-500/[0.07] blur-[100px]" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-20 hidden h-screen shrink-0 lg:block">
        <Sidebar
          variant="desktop"
          user={user}
          userMenuOptions={userMenuOptions}
          navSections={NAV_SECTIONS}
          isActive={isActive}
        />
      </div>

      <Sidebar
        variant="mobile"
        user={user}
        userMenuOptions={userMenuOptions}
        navSections={NAV_SECTIONS}
        isActive={isActive}
        open={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col min-h-0">
        <Navbar
          user={user}
          userMenuOptions={userMenuOptions}
          onMenuClick={openSidebar}
          className="lg:hidden"
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
