import { apiClient, tokenStore, AUTH_STORAGE_MODE } from '@/services/api';
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth';

const AUTH_USER_STORAGE_KEY = 'auth.user';
let memoryUser: AuthUser | null = null;

const userStore = {
  get(): AuthUser | null {
    if (AUTH_STORAGE_MODE === 'memory') {
      return memoryUser;
    }

    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  set(user: AuthUser): void {
    if (AUTH_STORAGE_MODE === 'memory') {
      memoryUser = user;
      return;
    }
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  },
  clear(): void {
    memoryUser = null;
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  },
};

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);

    tokenStore.setTokens({
      accessToken: data.token,
      refreshToken: data.refreshToken,
    });
    userStore.set({
      email: data.email,
      name: data.name,
      role: data.role,
    });

    return data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/register',
      payload,
    );

    tokenStore.setTokens({
      accessToken: data.token,
      refreshToken: data.refreshToken,
    });
    userStore.set({
      email: data.email,
      name: data.name,
      role: data.role,
    });

    return data;
  },

  async refreshSession(): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken: tokenStore.getRefreshToken(),
    });

    tokenStore.setTokens({
      accessToken: data.token,
      refreshToken: data.refreshToken ?? tokenStore.getRefreshToken(),
    });
    userStore.set({
      email: data.email,
      name: data.name,
      role: data.role,
    });

    return data;
  },

  logout(): void {
    tokenStore.clear();
    userStore.clear();
  },

  getSession(): { user: AuthUser | null; isAuthenticated: boolean } {
    const user = userStore.get();
    return {
      user,
      isAuthenticated: Boolean(tokenStore.getAccessToken() && user),
    };
  },

  isAuthenticated(): boolean {
    return Boolean(tokenStore.getAccessToken() && userStore.get());
  },
};
