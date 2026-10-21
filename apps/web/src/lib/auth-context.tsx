'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as api from '@ai-news/api-client';

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

  /*
   * Restore the session on mount.
   *
   * There are two ways in, and the second is the one that matters. The
   * token kept in this tab is the fast path — but it is per-tab, and it
   * knows nothing about the other apps of the product. The session the API
   * holds is the real one: it is the same cookie the Block Studio sees, and
   * it is alive after a sign-in anywhere in the product.
   *
   * So the portal asks the API who it is talking to. Without that, signing
   * in the studio would leave the portal looking signed out.
   */
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const savedToken = api.getAuthToken();
      if (savedToken) {
        const savedUser = loadPersistedUser();
        if (savedUser) {
          if (!cancelled) {
            setUser(savedUser);
            setToken(savedToken);
          }
          return;
        }
      }

      try {
        const current = await api.getCurrentUser();
        if (!cancelled && current) {
          setUser(current);
          setToken(savedToken);
        }
      } catch {
        // No session. The portal stays signed out.
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthResponse = useCallback((authUser: AuthUser, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    api.setAuthToken(authToken);
    persistUser(authUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
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
    },
    [handleAuthResponse]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
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
    },
    [handleAuthResponse]
  );

  /*
   * Signing out ends the session for the whole product, not just for this
   * tab — the API's cookie is cleared, so the studio is signed out too.
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    api.setAuthToken(null);
    persistUser(null);
    void api.logoutUser().catch(() => {
      // The local session is gone either way.
    });
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
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
