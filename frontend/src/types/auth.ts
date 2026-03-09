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

export interface AuthResponse extends AuthUser {
  token: string;
  refreshToken?: string;
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
