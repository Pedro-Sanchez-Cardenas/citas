'use client';

import { useRouter } from 'next/router';
import { useState, useMemo, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import type { User } from '@/types';
import { hasAnyRole, hasPermission } from '@/lib/auth';
import type { FloatMenuOptionItem } from '@/components/ui/FloatMenu';

interface NavSection {
  label: string;
  items: { label: string; href: string; icon: string }[];
}

/** Agrupación alineada al modelo SaaS: portal del negocio por dominio funcional */
const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Operación diaria',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
      { label: 'Agenda', href: '/agenda', icon: '📅' },
      { label: 'Horarios y bloqueos', href: '/working-hours', icon: '⏰' },
    ],
  },
  {
    label: 'Profesionales',
    items: [{ label: 'Profesionales', href: '/professionals', icon: '💇' }],
  },
  {
    label: 'Servicios e inventario',
    items: [
      { label: 'Categorías', href: '/service-categories', icon: '🧩' },
      { label: 'Servicios', href: '/services', icon: '✨' },
      { label: 'Servicios combinados', href: '/combined-services', icon: '💫' },
      { label: 'Relaciones de servicio', href: '/service-relations', icon: '🔗' },
      { label: 'Productos', href: '/products', icon: '🧴' },
      { label: 'Inventario', href: '/inventory', icon: '📦' },
    ],
  },
  {
    label: 'Clientes (CRM)',
    items: [{ label: 'Clientes', href: '/clients', icon: '👥' }],
  },
  {
    label: 'Pagos',
    items: [{ label: 'Cobros', href: '/payments', icon: '💳' }],
  },
  {
    label: 'Marketing',
    items: [{ label: 'Automatizaciones', href: '/automations', icon: '📣' }],
  },
  {
    label: 'Analytics',
    items: [{ label: 'Reportes', href: '/reports', icon: '📊' }],
  },
  {
    label: 'Configuración',
    items: [{ label: 'Sucursales', href: '/branches', icon: '🏢' }],
  },
];

const BOTTOM_NAV_HREF_ORDER = ['/dashboard', '/agenda', '/clients'];

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

  const filteredNavSections = useMemo<NavSection[]>(() => {
    return NAV_SECTIONS.map((section) => {
      const items = section.items.filter((item) => {
        if (hasAnyRole(user, ['business_owner'])) return true;
        if (item.href === '/reports') {
          return hasPermission(user, 'view_reports');
        }
        if (item.href === '/inventory' || item.href === '/products') {
          return hasPermission(user, 'manage_inventory');
        }
        if (
          item.href === '/services' ||
          item.href === '/combined-services' ||
          item.href === '/service-relations' ||
          item.href === '/service-categories'
        ) {
          return hasPermission(user, 'manage_services');
        }
        if (item.href === '/clients') {
          return hasPermission(user, 'manage_clients');
        }
        if (item.href === '/professionals') {
          return hasPermission(user, 'manage_professionals');
        }
        if (item.href === '/working-hours') {
          return hasPermission(user, 'manage_appointments');
        }
        if (item.href === '/payments') {
          return hasPermission(user, 'manage_appointments');
        }
        if (item.href === '/automations') {
          return hasAnyRole(user, ['business_owner']);
        }
        if (item.href === '/branches') {
          return hasAnyRole(user, ['business_owner']);
        }
        if (item.href === '/dashboard' || item.href === '/agenda') {
          return true;
        }
        return false;
      });
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [user]);

  const userMenuOptions: FloatMenuOptionItem[] = useMemo(
    () => {
      const options: FloatMenuOptionItem[] = [
        {
          label: 'Ver perfil',
          onClick: () => {
            closeSidebar();
            router.push('/profile');
          },
        },
      ];
      if (hasAnyRole(user, ['business_owner'])) {
        options.push({
          label: 'Facturación',
          onClick: () => {
            closeSidebar();
            router.push('/billing');
          },
        });
      }
      options.push({ divider: true }, { label: 'Cerrar sesión', onClick: onLogout });
      return options;
    },
    [user, onLogout, router]
  );

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-surface text-slate-100 lg:flex-row">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-[10%] h-80 w-80 rounded-full bg-teal-400/[0.09] blur-[100px]" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-indigo-500/[0.06] blur-[110px]" />
        <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/[0.07] blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-600/[0.05] blur-[90px]" />
      </div>

      <div className="relative z-20 hidden h-screen shrink-0 lg:block">
        <Sidebar
          variant="desktop"
          user={user}
          userMenuOptions={userMenuOptions}
          navSections={filteredNavSections}
          isActive={isActive}
        />
      </div>

      <Sidebar
        variant="mobile"
        user={user}
        userMenuOptions={userMenuOptions}
        navSections={filteredNavSections}
        isActive={isActive}
        open={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          user={user}
          userMenuOptions={userMenuOptions}
          onMenuClick={openSidebar}
          className="shrink-0 lg:hidden"
        />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 pb-24 sm:px-5 sm:py-6 lg:px-6 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl lg:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
