import type { RouteObject } from 'react-router';
import { PublicRoute, ProtectedRoute } from '@/components/common';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    element: <PublicRoute />,
    children: [
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    path: '*',
    element: <div>404</div>,
  },
];
