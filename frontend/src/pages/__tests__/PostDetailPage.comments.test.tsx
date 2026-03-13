import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { routes } from '@/routes';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { authService } from '@/services/authService';
import { categoryService } from '@/services/categoryService';
import * as postServiceModule from '@/services/postService';

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

describe('PostDetailPage comment flows', () => {
  it('asks for confirmation before deleting a comment', async () => {
    const user = userEvent.setup();

    vi.spyOn(authService, 'getSession').mockReturnValue({
      user: {
        email: 'john@example.com',
        name: 'John Doe',
        role: 'USER',
      },
      isAuthenticated: true,
    });

    vi.spyOn(categoryService, 'getCategories').mockResolvedValue([]);

    vi.spyOn(postServiceModule.postService, 'getPostById').mockResolvedValue({
      id: 123,
      title: 'Post title',
      content: 'Post content',
      categoryName: 'NEWS',
      categoryId: 1,
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentCount: 1,
    });

    vi.spyOn(postServiceModule.postService, 'getComments').mockResolvedValue([
      {
        id: 55,
        authorName: 'John Doe',
        content: 'My comment',
        createdAt: new Date().toISOString(),
      },
    ]);

    const deleteCommentSpy = vi
      .spyOn(postServiceModule.postService, 'deleteComment')
      .mockResolvedValue();

    const { renderResult } = renderWithProviders(['/posts/123']);
    expect(renderResult).toBeTruthy();

    const deleteButton = await screen.findByRole('button', {
      name: /delete comment/i,
    });
    await user.click(deleteButton);

    await screen.findByRole('heading', { name: /delete comment\?/i });
    expect(deleteCommentSpy).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', {
        name: /^delete$/i,
      }),
    );

    await waitFor(() => {
      expect(deleteCommentSpy).toHaveBeenCalledWith(123, 55);
    });
  });

  it('shows a success toast when a comment is added', async () => {
    const user = userEvent.setup();

    vi.spyOn(authService, 'getSession').mockReturnValue({
      user: {
        email: 'john@example.com',
        name: 'John Doe',
        role: 'USER',
      },
      isAuthenticated: true,
    });

    vi.spyOn(categoryService, 'getCategories').mockResolvedValue([]);

    vi.spyOn(postServiceModule.postService, 'getPostById').mockResolvedValue({
      id: 123,
      title: 'Post title',
      content: 'Post content',
      categoryName: 'NEWS',
      categoryId: 1,
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentCount: 0,
    });

    vi.spyOn(postServiceModule.postService, 'getComments').mockResolvedValue(
      [],
    );

    vi.spyOn(postServiceModule.postService, 'createComment').mockResolvedValue({
      id: 99,
      authorName: 'John Doe',
      content: 'Nice post!',
      createdAt: new Date().toISOString(),
    });

    const { renderResult } = renderWithProviders(['/posts/123']);
    expect(renderResult).toBeTruthy();

    await screen.findByRole('heading', { name: /comments/i });

    const textarea = screen.getByPlaceholderText(/share your thoughts/i);
    await user.type(textarea, 'Nice post!');

    await user.click(
      screen.getByRole('button', {
        name: /^add comment$/i,
      }),
    );

    expect(await screen.findByText(/comment added/i)).toBeInTheDocument();
  });
});
