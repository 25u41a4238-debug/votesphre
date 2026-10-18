import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../lib/api.ts';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOfficial: boolean;
  isPlatformAdmin: boolean;
  isParticipant: boolean;
  login: (credentials: any) => Promise<UserProfile>;
  register: (payload: any) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchDemo: (userId: string) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session check failed or expired:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: any) => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore network errors on logout
    }
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const switchDemo = async (userId: string) => {
    const res = await api.switchDemo(userId);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const isOfficial = Boolean(user && user.account_role === 'OFFICIAL');
  const isPlatformAdmin = Boolean(user && user.account_role === 'PLATFORM_ADMIN');
  const isParticipant = Boolean(user && user.account_role === 'PARTICIPANT');
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isOfficial,
        isPlatformAdmin,
        isParticipant,
        login,
        register,
        logout,
        switchDemo,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
