import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Text } from '@/components/ui';
import pingLogo from '@/assets/ping-logo.svg';
import chartColumnsIcon from '@/assets/chart-column.svg';
import logoutIcon from '@/assets/log-out.svg';
import menuIcon from '@/assets/menu.svg';

type AppNavbarProps = {
  showUserInfo?: boolean;
};

export function AppNavbar({ showUserInfo = true }: Readonly<AppNavbarProps>) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-default bg-surface px-6">
      {/* Desktop nav (Figma 27:6184) */}
      <div className="mx-auto hidden w-full max-w-[1201px] items-center justify-between py-[10px] md:flex">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={pingLogo} alt="Ping" className="h-[38px] w-auto" />
        </div>

        <div className="flex items-center gap-5">
          {/* Analytics */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<img src={chartColumnsIcon} alt="" className="h-4 w-4" />}
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
        </div>
      </div>

      {/* Mobile nav (Figma 27:6445) */}
      <div className="mx-auto flex w-full items-center justify-between py-[10px] md:hidden">
        <div className="flex items-center gap-2">
          <img src={pingLogo} alt="Ping" className="h-[26px] w-auto" />
        </div>

        <button
          type="button"
          aria-label="Open navigation"
          className="inline-flex h-6 w-6 items-center justify-center"
          onClick={() => {
            setIsMobileMenuOpen((prev) => !prev);
          }}
        >
          <img src={menuIcon} alt="" className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isMobileMenuOpen ? (
        <div className="mx-auto flex w-full max-w-[1201px] flex-col gap-3 pb-3 md:hidden">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={
                <img src={chartColumnsIcon} alt="" className="h-4 w-4" />
              }
            >
              Analytics
            </Button>
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
          </div>

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
        </div>
      ) : null}
    </header>
  );
}
