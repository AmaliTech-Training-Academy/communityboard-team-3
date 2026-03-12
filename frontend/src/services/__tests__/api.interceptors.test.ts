import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient, tokenStore } from '@/services/api';
import { server } from '@/test/server';

describe('apiClient interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStore.clear();
  });

  it('attaches bearer token to outgoing requests', async () => {
    tokenStore.setTokens({ accessToken: 'access-123' });

    server.use(
      http.get('/api/protected', ({ request }) => {
        return HttpResponse.json({
          authorization: request.headers.get('authorization'),
        });
      }),
    );

    const response = await apiClient.get<{ authorization: string | null }>(
      '/protected',
    );

    expect(response.data.authorization).toBe('Bearer access-123');
  });

  it('refreshes once after 401 when refresh token exists', async () => {
    tokenStore.setTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-123',
    });

    let attempts = 0;
    server.use(
      http.get('/api/protected', ({ request }) => {
        attempts += 1;
        if (attempts === 1) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({
          ok: true,
          authorization: request.headers.get('authorization'),
        });
      }),
      http.post('/api/auth/refresh', async ({ request }) => {
        const body = (await request.json()) as { refreshToken?: string };
        if (body.refreshToken !== 'refresh-123') {
          return HttpResponse.json(
            { message: 'invalid refresh' },
            { status: 401 },
          );
        }
        return HttpResponse.json({
          token: 'next-access-token',
          refreshToken: 'refresh-123',
          email: 'user@amalitech.com',
          name: 'Test User',
          role: 'USER',
        });
      }),
    );

    const response = await apiClient.get<{
      ok: boolean;
      authorization: string | null;
    }>('/protected');

    expect(response.data.ok).toBe(true);
    expect(response.data.authorization).toBe('Bearer next-access-token');
    expect(tokenStore.getAccessToken()).toBe('next-access-token');
  });

  it('clears tokens when refresh is unavailable', async () => {
    tokenStore.setTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-123',
    });

    server.use(
      http.get('/api/protected', () => {
        return new HttpResponse(null, { status: 401 });
      }),
      http.post('/api/auth/refresh', () => {
        return HttpResponse.json(
          { message: 'not implemented' },
          { status: 404 },
        );
      }),
    );

    await expect(apiClient.get('/protected')).rejects.toMatchObject({
      status: 401,
    });
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeUndefined();
  });
});
