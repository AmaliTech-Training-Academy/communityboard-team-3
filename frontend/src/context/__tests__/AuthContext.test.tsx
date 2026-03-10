import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { server } from '@/test/server';

function AuthProbe() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <div>
      <p data-testid="loading">{String(isLoading)}</p>
      <p data-testid="auth">{String(isAuthenticated)}</p>
      <p data-testid="email">{user?.email ?? ''}</p>
      <button
        type="button"
        onClick={() => {
          void login({
            email: 'user@amalitech.com',
            password: 'password123',
          });
        }}
      >
        login
      </button>
      <button
        type="button"
        onClick={() => {
          logout();
        }}
      >
        logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  it('hydrates user from existing local session', async () => {
    localStorage.setItem('auth.accessToken', 'access-token');
    localStorage.setItem(
      'auth.user',
      JSON.stringify({
        email: 'user@amalitech.com',
        name: 'Test User',
        role: 'USER',
      }),
    );

    render(
      <ToastProvider>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('auth').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe('user@amalitech.com');
  });

  it('logs in and logs out correctly', async () => {
    localStorage.clear();
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ message: 'unauthorized' }, { status: 401 }),
      ),
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

    render(
      <ToastProvider>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('auth').textContent).toBe('false');

    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('true');
    });

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));
    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('false');
    });
  });
});
