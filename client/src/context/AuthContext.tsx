import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setToken, getToken } from '../lib/api';
import type { Prefs, User } from '../types';

type Ctx = {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  savePrefs: (p: Required<Prefs>) => void;
};
const AuthCtx = createContext<Ctx | null>(null);
export const useAuth = () => { const c = useContext(AuthCtx); if (!c) throw new Error('AuthProvider missing'); return c; };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api<{ user: User }>('/me').then((r) => setUser(r.user)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const finish = (r: { token: string; user: User }) => { setToken(r.token); setUser(r.user); };
  const value = useMemo<Ctx>(() => ({
    user, loading,
    login: async (email, password) => finish(await api('/auth/login', { method: 'POST', body: { email, password } })),
    register: async (name, email, password) => finish(await api('/auth/register', { method: 'POST', body: { name, email, password } })),
    logout: () => { setToken(null); setUser(null); },
    savePrefs: (p) => { if (getToken()) api('/me/prefs', { method: 'PATCH', body: p }).catch(() => undefined); },
  }), [user, loading]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
