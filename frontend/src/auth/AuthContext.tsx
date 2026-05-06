import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authMe, login as apiLogin, logout as apiLogout } from '../api/client';
import { clearToolStorage } from '../utils/toolPersistence';

type User = {
  username: string;
  is_admin?: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const me = await authMe();
      setUser({
        username: me.username,
        is_admin: me.is_admin,
      });
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    void (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    await apiLogin(username, password);
    // Cookie should be set by the server; re-check to update state.
    await refresh();
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    clearToolStorage();
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, login, logout }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

