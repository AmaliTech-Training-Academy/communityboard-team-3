import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { routes } from '@/routes';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import * as postServiceModule from '@/services/postService';
import { authService } from '@/services/authService';
import { categoryService } from '@/services/categoryService';
import type { PostSummary } from '@/types/post';

function renderWithProviders(initialEntries: string[]) {
  const router = createMemoryRouter(routes, {
    initialEntries,
  });

  const renderResult = render(
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>,
  );

  return {
    router,
    renderResult,
  };
}

describe('HomePage create post flow', () => {
  it('opens the create post modal, validates required fields, and calls createPost on submit', async () => {
    const user = userEvent.setup();

    vi.spyOn(authService, 'getSession').mockReturnValue({
      user: {
        email: 'john@example.com',
        name: 'John Doe',
        role: 'USER',
      },
      isAuthenticated: true,
    });

    vi.spyOn(postServiceModule.postService, 'getPosts').mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    });

    vi.spyOn(categoryService, 'getCategories').mockResolvedValue([
      {
        id: 1,
        name: 'NEWS',
        description: null,
      },
    ]);

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

    vi.spyOn(postServiceModule.postService, 'getPostById').mockResolvedValue({
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

    vi.spyOn(postServiceModule.postService, 'getComments').mockResolvedValue(
      [],
    );

    const { renderResult } = renderWithProviders(['/']);
    expect(renderResult).toBeTruthy();

    const createButton = await screen.findByRole('button', {
      name: /create post/i,
    });

    await user.click(createButton);

    await screen.findByRole('heading', {
      name: /create new post/i,
    });
    const submitButton = screen.getAllByRole('button', {
      name: /^create post$/i,
    })[1];
    await user.click(submitButton);

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    expect(screen.getByText(/content is required/i)).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/post title/i);
    const contentTextarea = screen.getByLabelText(/content/i);

    await user.type(titleInput, 'New title');
    await user.type(contentTextarea, 'New content');

    await user.click(
      screen.getByRole('button', {
        name: /select/i,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: /news/i,
      }),
    );

    await user.click(submitButton);

    await waitFor(() => {
      expect(createPostSpy).toHaveBeenCalledTimes(1);
    });
  });
});
