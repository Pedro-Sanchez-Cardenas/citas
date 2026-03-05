import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import api, { setUnauthorizedHandler } from '@/lib/api';
import { fetchCurrentUser, logoutRequest } from '@/lib/api/auth';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'auth_user';

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
    setUnauthorizedHandler(() => {
      setUserState(null);
      setStoredUser(null);
      router.replace('/');
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
    return () => { cancelled = true; };
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
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
