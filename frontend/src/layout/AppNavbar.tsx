import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { Button, Text } from '@/components/ui';
import pingLogo from '@/assets/ping-logo.svg';
import chartColumnsIcon from '@/assets/chart-column.svg';
import logoutIcon from '@/assets/log-out.svg';
import menuIcon from '@/assets/menu.svg';
import closeIcon from '@/assets/x.svg';

type AppNavbarProps = {
  showUserInfo?: boolean;
};

export function AppNavbar({ showUserInfo = true }: Readonly<AppNavbarProps>) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = Boolean(user);
  const isOnAnalytics = location.pathname.startsWith('/analytics');

  return (
    <header className="border-b border-default bg-surface px-6">
      {/* Desktop nav (Figma 27:6184) */}
      <div className="mx-auto hidden w-full max-w-[1201px] items-center justify-between py-[10px] md:flex">
        {/* Logo */}
        <button
          type="button"
          onClick={() => {
            void navigate('/');
          }}
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
          aria-label="Go to home"
        >
          <img src={pingLogo} alt="Ping" className="h-[38px] w-auto" />
        </button>

        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              {/* Analytics */}
              <Button
                type="button"
                variant={isOnAnalytics ? 'primary' : 'ghost'}
                size="sm"
                leftIcon={
                  <img src={chartColumnsIcon} alt="" className="h-4 w-4" />
                }
                onClick={() => {
                  void navigate('/analytics');
                }}
              >
                Analytics
              </Button>

              {/* User info */}
              {showUserInfo ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-overlay text-xs font-medium text-inverse">
                    {user?.name ? user.name.charAt(0) : 'JD'}
                  </div>
                  <div className="flex flex-col">
                    <Text variant="bodySm" className="text-primary">
                      {user?.name ?? 'John Doe'}
                    </Text>
                    <Text variant="bodySmRegular" className="text-muted">
                      {user?.email ?? 'johndoe@gmail.com'}
                    </Text>
                  </div>
                </div>
              ) : null}

              {/* Log out */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger"
                leftIcon={<img src={logoutIcon} alt="" className="h-4 w-4" />}
                onClick={logout}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void navigate('/login');
                }}
              >
                Log in
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  void navigate('/register');
                }}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav (Figma 27:6445) */}
      <div className="mx-auto flex w-full items-center justify-between py-[10px] md:hidden">
        <button
          type="button"
          onClick={() => {
            void navigate('/');
          }}
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
          aria-label="Go to home"
        >
          <img src={pingLogo} alt="Ping" className="h-[26px] w-auto" />
        </button>

        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          className="inline-flex h-6 w-6 items-center justify-center"
          onClick={() => {
            setIsMobileMenuOpen((prev) => !prev);
          }}
        >
          <img
            src={isMobileMenuOpen ? closeIcon : menuIcon}
            alt=""
            className="h-6 w-6"
          />
        </button>
      </div>

      {/* Mobile fullscreen sheet menu (Figma mobile sidebar) */}
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 flex h-full w-full flex-col bg-page md:hidden">
          {/* Header: user info (when authenticated) or spacer + close icon */}
          <div className="w-full px-6 pt-6 border-b border-default">
            <div className="flex items-center justify-between gap-6 pb-4">
              {isAuthenticated && showUserInfo ? (
                <div className="flex flex-1 items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-overlay text-xs font-medium text-inverse">
                    {user?.name ? user.name.charAt(0) : 'JD'}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text
                      variant="bodySm"
                      className="text-primary font-semibold"
                    >
                      {user?.name ?? 'John Doe'}
                    </Text>
                    <Text variant="bodySmRegular" className="text-secondary">
                      {user?.email ?? 'Johndoe@gmail.com'}
                    </Text>
                  </div>
                </div>
              ) : (
                <div className="flex-1" />
              )}
              <button
                type="button"
                aria-label="Close navigation"
                className="inline-flex h-6 w-6 items-center justify-center"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
              >
                <img src={closeIcon} alt="" className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body actions */}
          <div className="w-full flex-1 px-6 pt-6">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2.5 rounded-lg px-5 py-2.5 ${
                    isOnAnalytics ? 'bg-(--color-primary-900)' : ''
                  }`}
                  onClick={() => {
                    void navigate('/analytics');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <img src={chartColumnsIcon} alt="" className="h-5 w-5" />
                  <Text
                    variant="bodySm"
                    className={
                      isOnAnalytics
                        ? 'text-white font-medium'
                        : 'text-primary font-medium'
                    }
                  >
                    Analytics
                  </Text>
                </button>

                <div className="my-4 h-px w-full border-t border-default" />

                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-5 py-2.5"
                  onClick={logout}
                >
                  <img src={logoutIcon} alt="" className="h-5 w-5" />
                  <Text variant="bodySm" className="text-danger font-medium">
                    Log out
                  </Text>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-5 py-2.5"
                  onClick={() => {
                    void navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Text variant="bodySm" className="text-accent font-medium">
                    Log in
                  </Text>
                </button>

                <div className="my-4 h-px w-full border-t border-default" />

                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-5 py-2.5"
                  onClick={() => {
                    void navigate('/register');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Text variant="bodySm" className="text-accent font-medium">
                    Register
                  </Text>
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
