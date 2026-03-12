import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { authService } from '@/services/authService';
import { tokenStore } from '@/services/api';
import { server } from '@/test/server';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStore.clear();
    authService.logout();
  });

  it('stores session after login', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({
          token: 'access-token',
          refreshToken: 'refresh-token',
          email: 'user@amalitech.com',
          name: 'Test User',
          role: 'USER',
        }),
      ),
    );

    const response = await authService.login({
      email: 'user@amalitech.com',
      password: 'password123',
    });

    expect(response.token).toBe('access-token');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getSession().user?.email).toBe('user@amalitech.com');
  });

  it('clears session on logout', () => {
    tokenStore.setTokens({ accessToken: 'access-token' });
    localStorage.setItem(
      'auth.user',
      JSON.stringify({
        email: 'user@amalitech.com',
        name: 'Test User',
        role: 'USER',
      }),
    );

    authService.logout();

    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getSession().user).toBeNull();
  });
});
