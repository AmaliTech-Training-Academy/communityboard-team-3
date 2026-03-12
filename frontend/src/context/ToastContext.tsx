import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Toast, ToastViewport, type ToastVariant } from '@/components/ui/Toast';

type ToastId = number;

export type ToastOptions = {
  title: string;
  description?: string;
};

type InternalToast = ToastOptions & {
  id: ToastId;
  variant: ToastVariant;
};

export type ToastContextValue = {
  /**
   * Show a green "something went well" message.
   *
   * Example:
   * - After login succeeds → "Authenticated successfully"
   * - After creating a post → "Post created"
   */
  success: (options: ToastOptions) => void;
  /**
   * Show a red "something went wrong" message.
   *
   * Example:
   * - Wrong login credentials
   * - Server/network error while saving data
   */
  error: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ToastProviderProps = {
  /**
   * Wrap your whole app once at the top.
   *
   * This lets any screen or hook call `useToast()` without
   * manually passing props down through many components.
   */
  children: ReactNode;
};

export function ToastProvider({ children }: Readonly<ToastProviderProps>) {
  /**
   * We keep a simple list of toasts in memory.
   * Each toast:
   * - has an `id` so React can track it
   * - knows if it is success or error
   * - has a title/description to show
   */
  const [toasts, setToasts] = useState<InternalToast[]>([]);

  const removeToast = useCallback((id: ToastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Core helper for adding a toast.
   *
   * - `variant` controls the color (success/error)
   * - `title` / `description` control the text
   * - we also set up a timer so the toast disappears automatically
   */
  const addToast = useCallback(
    (variant: ToastVariant, options: ToastOptions) => {
      const id = Date.now();

      setToasts((current) => {
        const next: InternalToast = {
          id,
          variant,
          title: options.title,
          description: options.description,
        };

        return [...current, next];
      });

      // Auto-remove the toast after a short delay so it does not
      // stay on screen forever if the user does nothing.
      window.setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast],
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      success: (options) => {
        addToast('success', options);
      },
      error: (options) => {
        addToast('error', options);
      },
    }),
    [addToast],
  );

  return (
    <ToastContext value={contextValue}>
      {children}

      {/* This is the single place where all toasts are rendered.
          Any screen that calls `useToast()` will show up here. */}
      <ToastViewport>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            onClose={() => {
              removeToast(toast.id);
            }}
          />
        ))}
      </ToastViewport>
    </ToastContext>
  );
}

/**
 * Small helper hook so screens and hooks can say:
 *
 * const toast = useToast();
 * toast.success({ title: 'Authenticated successfully' });
 *
 * This keeps the API very simple and easy to remember.
 */
export const useToastContext = (): ToastContextValue => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }

  return context;
};
