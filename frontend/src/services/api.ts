import axios, { AxiosError, AxiosHeaders } from 'axios';
import type { ApiError } from '@/types/auth';

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
    const status = error.response?.status;

    if (status === 401) {
      // No refresh flow implemented – clear any stored tokens and surface the error.
      tokenStore.clear();
    }

    throw toThrowableApiError(error);
  },
);
