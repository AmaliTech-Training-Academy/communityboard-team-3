import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/authService';
import type { AuthUser, LoginRequest, RegisterRequest } from '@/types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuthOnMount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthOnMount = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const session = authService.getSession();
    if (session.isAuthenticated && session.user) {
      setUser(session.user);
      setIsLoading(false);
      return;
    }

    try {
      const refreshed = await authService.refreshSession();
      setUser({
        email: refreshed.email,
        name: refreshed.name,
        role: refreshed.role,
      });
    } catch {
      authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuthOnMount();
  }, [checkAuthOnMount]);

  const login = useCallback(async (payload: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      setUser({
        email: response.email,
        name: response.name,
        role: response.role,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to login right now';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: RegisterRequest): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.register(payload);
        setUser({
          email: response.email,
          name: response.name,
          role: response.role,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to register right now';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback((): void => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      checkAuthOnMount,
    }),
    [user, isLoading, error, login, register, logout, checkAuthOnMount],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
