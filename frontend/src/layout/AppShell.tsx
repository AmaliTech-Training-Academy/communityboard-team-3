import type { ReactNode } from 'react';
import { AppNavbar } from '@/layout/AppNavbar';

type AppShellProps = {
  children: ReactNode;
};

/**
 * High-level application shell that matches the "Home page" layout
 * from Figma:
 * - top navigation bar with logo, analytics entry point, user info, logout
 * - centered content width with page background
 *
 * This component is intentionally lightweight and does not fetch data.
 * Feature routes (posts, analytics, etc.) render their content via `children`.
 */
export function AppShell({ children }: Readonly<AppShellProps>) {
  return (
    <div className="bg-page min-h-screen">
      <AppNavbar />

      <main className="px-6 py-6">
        <div className="mx-auto w-full max-w-[1201px] space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
