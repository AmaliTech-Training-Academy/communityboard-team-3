import type { RouteObject } from 'react-router';
import { PublicRoute, ProtectedRoute } from '@/components/common';
import RegisterPage from '@/pages/RegisterPage';

function HomePage() {
  return <div>Home</div>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    element: <PublicRoute />,
    children: [{ path: '/register', element: <RegisterPage /> }],
  },
  {
    path: '*',
    element: <div>404</div>,
  },
];
