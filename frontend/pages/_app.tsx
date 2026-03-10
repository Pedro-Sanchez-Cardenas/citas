import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const DASHBOARD_PATHS = [
  '/dashboard',
  '/agenda',
  '/appointments',
  '/clients',
  '/professionals',
  '/services',
  '/combined-services',
  '/service-relations',
  '/service-categories',
  '/products',
  '/inventory',
  '/working-hours',
  '/blocks',
  '/payments',
  '/reports',
  '/automations',
  '/profile',
  '/billing',
];

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

function AppLayout({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (isDashboardRoute(router.pathname)) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Component {...pageProps} />
      </DashboardLayout>
    );
  }

  return <Component {...pageProps} />;
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppLayout {...props} />
    </AuthProvider>
  );
}
