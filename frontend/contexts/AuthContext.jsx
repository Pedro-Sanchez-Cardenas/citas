import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'auth_user';

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
    setStoredUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const response = await api.get('/api/me');
        const userFromApi = response.data?.user ?? null;
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
    return () => { cancelled = true; };
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/logout');
    } finally {
      setUserState(null);
      setStoredUser(null);
      router.push('/');
    }
  }, [router]);

  const value = {
    user,
    loading,
    setUser,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
