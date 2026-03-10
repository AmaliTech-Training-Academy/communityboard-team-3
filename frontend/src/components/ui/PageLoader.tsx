import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { Text } from './Text';

export type PageLoaderProps = {
  /**
   * Short human-readable message explaining what is loading.
   *
   * Examples:
   * - "Checking session..."
   * - "Loading your dashboard..."
   */
  label?: string;
  /**
   * Optional extra content below the label, e.g. a hint or helper text.
   */
  description?: ReactNode;
};

/**
 * Full-page loading state.
 *
 * This component is meant for situations where the *entire* route is
 * waiting on something important, such as:
 * - checking the user's authentication session
 * - loading the initial data for a screen
 *
 * It keeps the UI simple and consistent with the rest of the design:
 * centered content, body text, and a subtle spinner.
 */
export function PageLoader({ label, description }: PageLoaderProps) {
  return (
    <main className="bg-page flex min-h-screen items-center justify-center px-6 py-6">
      <div className="flex items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-[var(--toast-shadow)]">
        <Spinner />
        <div className="space-y-1">
          <Text variant="bodySmRegular" className="text-secondary">
            {label ?? 'Loading...'}
          </Text>
          {description ? (
            <Text variant="bodySmRegular" className="text-muted">
              {description}
            </Text>
          ) : null}
        </div>
      </div>
    </main>
  );
}

