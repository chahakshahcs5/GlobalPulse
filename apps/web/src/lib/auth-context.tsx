'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as api from './api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface AuthContextValue {
  /** Currently authenticated user, or null if not logged in */
  user: AuthUser | null;
  /** JWT token for API requests */
  token: string | null;
  /** Whether an auth operation is in progress */
  isLoading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Log in with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** Register a new account */
  register: (name: string, email: string, password: string) => Promise<void>;
  /** Clear the current session */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const AUTH_USER_KEY = 'globalpulse_auth_user';

function persistUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

function loadPersistedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const savedUser = loadPersistedUser();
    const savedToken = api.getAuthToken();
    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
    }
  }, []);

  const handleAuthResponse = useCallback((authUser: AuthUser, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    api.setAuthToken(authToken);
    persistUser(authUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await api.loginUser(email, password);
      handleAuthResponse(
        {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          avatarUrl: result.user.avatarUrl,
        },
        result.token
      );
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthResponse]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await api.registerUser(name, email, password);
      handleAuthResponse(
        {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          avatarUrl: result.user.avatarUrl,
        },
        result.token
      );
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthResponse]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    api.setAuthToken(null);
    persistUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
