import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { clearTokens, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }
    const me = await authApi.me();
    setUser(me);
    setError(null);
    return me;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (getAccessToken()) {
          const me = await authApi.me();
          if (!cancelled) {
            setUser(me);
            setError(null);
          }
        }
      } catch (err) {
        clearTokens();
        if (!cancelled) {
          setUser(null);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    async login(creds) {
      setError(null);
      await authApi.login(creds);
      return refreshUser();
    },
    async register(payload) {
      setError(null);
      await authApi.register(payload);
      await authApi.login({ email: payload.email, password: payload.password });
      return refreshUser();
    },
    async logout() {
      setError(null);
      await authApi.logout();
      setUser(null);
    },
    async identityGate(payload) {
      setError(null);
      await authApi.identityGate(payload);
      return refreshUser();
    },
    async acceptInvite(payload) {
      setError(null);
      await authApi.acceptInvite(payload);
      return refreshUser();
    },
    async googleLogin(payload) {
      setError(null);
      await authApi.googleLogin(payload);
      return refreshUser();
    },
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
