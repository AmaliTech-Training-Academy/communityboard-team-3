export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Shape returned by the backend authentication endpoints.
 * Mirrors:
 * {
 *   "token": "...",
 *   "data": { "email": "...", "name": "...", "role": "USER" }
 * }
 */
export interface BackendAuthResponse {
  token: string;
  data: AuthUser;
}

/**
 * Flattened auth response used throughout the frontend.
 * Keeps user fields at the top level for convenience.
 */
export interface AuthResponse extends AuthUser {
  token: string;
}

export interface StoredAuth {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}
