import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError, AuthResponse } from '@/types/auth';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
} as const;

export type AuthStorageMode = 'local' | 'memory';

export interface AuthTokens {
  accessToken: string | null;
  refreshToken?: string;
}

interface TokenStorage {
  getTokens: () => AuthTokens;
  setTokens: (tokens: AuthTokens) => void;
  clear: () => void;
}

const memoryStorageState: AuthTokens = {
  accessToken: null,
  refreshToken: undefined,
};

const memoryTokenStorage: TokenStorage = {
  getTokens: () => ({
    accessToken: memoryStorageState.accessToken,
    refreshToken: memoryStorageState.refreshToken,
  }),
  setTokens: (tokens) => {
    memoryStorageState.accessToken = tokens.accessToken;
    memoryStorageState.refreshToken = tokens.refreshToken;
  },
  clear: () => {
    memoryStorageState.accessToken = null;
    memoryStorageState.refreshToken = undefined;
  },
};

const localStorageTokenStorage: TokenStorage = {
  getTokens: () => ({
    accessToken: localStorage.getItem(AUTH_STORAGE_KEYS.accessToken),
    refreshToken:
      localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken) ?? undefined,
  }),
  setTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) {
      localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
    }

    if (refreshToken) {
      localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    }
  },
  clear: () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  },
};

export const AUTH_STORAGE_MODE: AuthStorageMode =
  (import.meta.env.VITE_AUTH_STORAGE_MODE as AuthStorageMode | undefined) ??
  'local';

// TODO(security-migration): Switch default to `memory` after backend ships:
// 1) POST /api/auth/refresh
// 2) HttpOnly/Secure refresh-token cookie policy
const activeTokenStorage: TokenStorage =
  AUTH_STORAGE_MODE === 'memory'
    ? memoryTokenStorage
    : localStorageTokenStorage;

export const tokenStore = {
  getAccessToken(): string | null {
    return activeTokenStorage.getTokens().accessToken;
  },
  getRefreshToken(): string | undefined {
    return activeTokenStorage.getTokens().refreshToken;
  },
  setTokens(tokens: AuthTokens): void {
    activeTokenStorage.setTokens(tokens);
  },
  clear(): void {
    activeTokenStorage.clear();
  },
};

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const normalizeApiError = (error: AxiosError): ApiError => {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as
    | { message?: string; code?: string; details?: unknown }
    | undefined;

  return {
    status,
    message: data?.message ?? error.message,
    code: data?.code,
    details: data?.details ?? error.response?.data,
  };
};

const toThrowableApiError = (error: AxiosError): Error & ApiError => {
  const normalized = normalizeApiError(error);
  return Object.assign(new Error(normalized.message), normalized);
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;

const requestRefreshToken = async (): Promise<string> => {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await refreshClient.post<AuthResponse>('/auth/refresh', {
    refreshToken,
  });
  const nextAccessToken = response.data.token;
  tokenStore.setTokens({
    accessToken: nextAccessToken,
    refreshToken: response.data.refreshToken ?? refreshToken,
  });
  return nextAccessToken;
};

apiClient.interceptors.request.use((config) => {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) return config;

  const headers = AxiosHeaders.from(config.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    const shouldTryRefresh =
      status === 401 &&
      Boolean(originalConfig) &&
      !originalConfig?._retry &&
      Boolean(tokenStore.getRefreshToken());

    if (!shouldTryRefresh) {
      if (status === 401) tokenStore.clear();
      throw toThrowableApiError(error);
    }

    if (!originalConfig) {
      throw toThrowableApiError(error);
    }

    originalConfig._retry = true;

    try {
      refreshPromise ??= requestRefreshToken();
      const nextAccessToken = await refreshPromise;
      refreshPromise = null;

      const headers = AxiosHeaders.from(originalConfig.headers);
      headers.set('Authorization', `Bearer ${nextAccessToken}`);
      originalConfig.headers = headers;

      return await apiClient(originalConfig);
    } catch {
      refreshPromise = null;
      tokenStore.clear();
      throw toThrowableApiError(error);
    }
  },
);
