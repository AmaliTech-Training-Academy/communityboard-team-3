import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from '@/components/features/auth/containers/RegisterForm';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('RegisterForm', () => {
  it('toggles password fields visibility', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      login: vi.fn(),
      register,
      logout: vi.fn(),
      checkAuthOnMount: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    const passwordInput = screen.getAllByPlaceholderText(
      'Enter password',
    )[0] as HTMLInputElement;
    const confirmPasswordInput = screen.getAllByPlaceholderText(
      'Enter password',
    )[1] as HTMLInputElement;

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await userEvent.click(
      screen.getByRole('button', { name: 'Show password' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Show confirm password' }),
    );

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  it('shows mismatch validation error', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      login: vi.fn(),
      register,
      logout: vi.fn(),
      checkAuthOnMount: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByPlaceholderText('e.g., John Doe'),
      'John Doe',
    );
    await userEvent.type(
      screen.getByPlaceholderText('your@example.com'),
      'user@example.com',
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('Enter password')[0],
      'Password1!',
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('Enter password')[1],
      'Password2!',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(
      await screen.findByText('Passwords do not match'),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('submits mapped payload for valid input', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      login: vi.fn(),
      register,
      logout: vi.fn(),
      checkAuthOnMount: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByPlaceholderText('e.g., John Doe'),
      'John Doe',
    );
    await userEvent.type(
      screen.getByPlaceholderText('your@example.com'),
      'user@example.com',
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('Enter password')[0],
      'Password1!',
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('Enter password')[1],
      'Password1!',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'user@example.com',
        password: 'Password1!',
      });
    });
  });
});
