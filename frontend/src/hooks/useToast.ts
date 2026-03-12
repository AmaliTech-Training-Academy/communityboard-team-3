import type { ToastContextValue } from '@/context/ToastContext';
import { useToastContext } from '@/context/ToastContext';

/**
 * Public toast hook for the whole app.
 *
 * Usage example (inside a screen or custom hook):
 *
 * const toast = useToast();
 * toast.success({ title: 'Authenticated successfully' });
 *
 * We keep this hook tiny on purpose:
 * - it hides the internal ToastContext details
 * - it gives you a very small, memorable API
 */
export const useToast = (): ToastContextValue => useToastContext();
