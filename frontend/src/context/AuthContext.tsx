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
import type {
  ApiError,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth';
import { useToastContext } from '@/context/ToastContext';

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
  /**
   * Number of consecutive failed login attempts during this session.
   * This is purely a UX guardrail and does NOT replace server-side
   * brute-force protection. Once the user logs in successfully we reset it.
   */
  const [failedLoginAttempts, setFailedLoginAttempts] = useState<number>(0);
  /**
   * Timestamp (in ms since epoch) until which we should temporarily block
   * further login attempts. When `Date.now()` is less than this value,
   * the login function will immediately return a friendly error instead
   * of hammering the backend with more requests.
   */
  const [loginLockedUntil, setLoginLockedUntil] = useState<number | null>(null);
  const toast = useToastContext();

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

  const login = useCallback(
    async (payload: LoginRequest): Promise<void> => {
      // If we recently locked logins, short‑circuit before talking to the server.
      if (loginLockedUntil && Date.now() < loginLockedUntil) {
        const remainingSeconds = Math.ceil(
          (loginLockedUntil - Date.now()) / 1000,
        );
        const lockMessage = `Too many attempts. Please wait ${remainingSeconds} seconds before trying again.`;
        setError(lockMessage);
        toast.error({
          title: 'Too many login attempts',
          description: lockMessage,
        });
        throw new Error(lockMessage);
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.login(payload);
        setUser({
          email: response.email,
          name: response.name,
          role: response.role,
        });
         // Successful login → clear any previous failures/lock.
        setFailedLoginAttempts(0);
        setLoginLockedUntil(null);
        toast.success({ title: 'Authenticated successfully' });
      } catch (err) {
        const apiError = err as Error & ApiError;
        const status = apiError.status ?? 0;

        const isAuthError = status === 401;

        if (isAuthError) {
          // For invalid credentials we deliberately show a generic message
          // so we never reveal which field (email vs password) is wrong.
          const message = 'Invalid email or password';

          const nextFailedAttempts = failedLoginAttempts + 1;

          // If this is the 5th consecutive failure, temporarily lock login.
          if (nextFailedAttempts >= 5) {
            const lockDurationMs = 30_000;
            const lockUntil = Date.now() + lockDurationMs;
            setLoginLockedUntil(lockUntil);
            setFailedLoginAttempts(0);

            const lockMessage =
              'Too many attempts. Please wait 30 seconds before trying again.';
            setError(lockMessage);
            toast.error({
              title: 'Too many login attempts',
              description: lockMessage,
            });
          } else {
            setFailedLoginAttempts(nextFailedAttempts);
            setError(message);
            toast.error({
              title: message,
            });
          }
        } else {
          /**
           * For non-auth errors (404 when backend is down, 5xx, network),
           * we deliberately hide the low-level technical message from the user
           * and show a single, friendly fallback instead.
           *
           * This keeps the UX clean and avoids exposing implementation details
           * like "Request failed with status code 404".
           *
           * If you need the real error while developing, rely on:
           * - the browser devtools Network tab
           * - console logging (you can temporarily log `apiError` here)
           * rather than surfacing it in the toast.
           */
          const message = 'Something went wrong. Please try again later.';
          setError(message);
          toast.error({
            title: 'Unable to log you in',
            description: message,
          });
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [failedLoginAttempts, loginLockedUntil, toast],
  );

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
        toast.success({
          title: 'Account created',
          description: 'Welcome to Ping.',
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to register right now';
        setError(message);
        toast.error({
          title: 'Unable to create your account',
          description: message,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const logout = useCallback((): void => {
    authService.logout();
    setUser(null);
    setError(null);
    toast.success({ title: 'Logged out' });
  }, [toast]);

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
