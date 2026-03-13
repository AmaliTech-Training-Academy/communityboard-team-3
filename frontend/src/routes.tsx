import type { RouteObject } from 'react-router';
import { Outlet } from 'react-router';
import { PublicRoute, ProtectedRoute } from '@/components/common';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import PostDetailPage from '@/pages/PostDetailPage';
import CreatePostPage from '@/pages/CreatePostPage';
import EditPostPage from '@/pages/EditPostPage';
import AnalyticsDashboardPage from '@/pages/AnalyticsDashboardPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Outlet />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'posts/:id', element: <PostDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'posts/new', element: <CreatePostPage /> },
          { path: 'posts/:id/edit', element: <EditPostPage /> },
          { path: 'analytics', element: <AnalyticsDashboardPage /> },
        ],
      },
    ],
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
