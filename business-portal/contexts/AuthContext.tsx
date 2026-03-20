import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import { setUnauthorizedHandler } from '@/lib/api';
import { fetchCurrentUser, logoutRequest } from '@/lib/api/auth';
import type { User } from '@/types';

const DASHBOARD_PATH_PREFIXES = [
  '/dashboard',
  '/agenda',
  '/clients',
  '/professionals',
  '/services',
  '/combined-services',
  '/service-relations',
  '/service-categories',
  '/products',
  '/inventory',
  '/working-hours',
  '/payments',
  '/reports',
  '/automations',
  '/profile',
  '/billing',
  '/branches',
];

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = 'auth_user';

function setStoredUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    setStoredUser(nextUser);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUserState(null);
      setStoredUser(null);
      if (isDashboardPath(router.pathname)) {
        router.replace('/');
      }
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const userFromApi = await fetchCurrentUser();
        if (!cancelled) {
          setUserState(userFromApi);
          setStoredUser(userFromApi);
        }
      } catch {
        if (!cancelled) {
          setUserState(null);
          setStoredUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    (userData: User) => {
      setUser(userData);
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUserState(null);
      setStoredUser(null);
      router.push('/');
    }
  }, [router]);

  const value: AuthContextValue = {
    user,
    loading,
    setUser,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
