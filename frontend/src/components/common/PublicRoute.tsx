import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader label="Checking session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
