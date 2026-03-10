import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RouterProvider,
  createMemoryRouter,
  type RouteObject,
} from 'react-router';
import { routes } from '@/routes';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import * as postServiceModule from '@/services/postService';
import type { PostSummary } from '@/types/post';

function renderWithProviders(initialEntries: string[]) {
  const router = createMemoryRouter(routes as RouteObject[], {
    initialEntries,
  });

  return {
    router,
    renderResult: (
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    ),
  };
}

describe('HomePage create post flow', () => {
  it('opens the create post modal, validates required fields, and calls createPost on submit', async () => {
    const user = userEvent.setup();

    const createPostSpy = vi
      .spyOn(postServiceModule.postService, 'createPost')
      .mockResolvedValueOnce({
        id: 123,
        title: 'New title',
        content: 'New content',
        categoryName: 'NEWS',
        categoryId: 1,
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commentCount: 0,
      } satisfies PostSummary);

    const { renderResult } = renderWithProviders(['/']);
    // eslint-disable-next-line testing-library/render-result-naming-convention
    expect(renderResult).toBeTruthy();

    const createButton = await screen.findByRole('button', {
      name: /create post/i,
    });

    await user.click(createButton);

    const dialogTitle = await screen.findByRole('heading', {
      name: /create new post/i,
    });
    expect(dialogTitle).toBeInTheDocument();

    const submitButton = screen.getByRole('button', {
      name: /^create post$/i,
    });
    await user.click(submitButton);

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    expect(screen.getByText(/content is required/i)).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/post title/i);
    const categorySelect = screen.getByLabelText(/category/i);
    const contentTextarea = screen.getByLabelText(/content/i);

    await user.type(titleInput, 'New title');
    await user.selectOptions(categorySelect, 'NEWS');
    await user.type(contentTextarea, 'New content');

    await user.click(submitButton);

    await waitFor(() => {
      expect(createPostSpy).toHaveBeenCalledTimes(1);
    });
  });
});
