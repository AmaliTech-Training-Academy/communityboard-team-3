import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { postService } from '@/services/postService';
import { server } from '@/test/server';

describe('postService', () => {
  it('fetches a paginated list of posts', async () => {
    server.use(
      http.get('/api/posts', () =>
        HttpResponse.json({
          content: [
            {
              id: 1,
              title: 'First',
              content: 'First content',
              categoryName: 'General',
              categoryId: 1,
              authorName: 'Author',
              authorEmail: 'author@example.com',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              commentCount: 0,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          size: 10,
          number: 0,
        }),
      ),
    );

    const page = await postService.getPosts();

    expect(page.content).toHaveLength(1);
    expect(page.content[0]?.title).toBe('First');
  });

  it('delegates to the search endpoint when filters are provided', async () => {
    const handler = http.get('/api/posts/search', ({ request }) => {
      const url = new URL(request.url);
      const keyword = url.searchParams.get('keyword');

      if (keyword !== 'spring') {
        return HttpResponse.json(
          {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: 10,
            number: 0,
          },
          { status: 200 },
        );
      }

      return HttpResponse.json({
        content: [
          {
            id: 2,
            title: 'Spring Tips',
            content: 'Content about Spring',
            categoryName: 'Engineering',
            categoryId: 2,
            authorName: 'Dev',
            authorEmail: 'dev@example.com',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
            commentCount: 0,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      });
    });

    server.use(handler);

    const page = await postService.getPosts({ keyword: 'spring' });

    expect(page.content).toHaveLength(1);
    expect(page.content[0]?.title).toBe('Spring Tips');
  });

  it('normalizes date-only filters to ISO date-time for the backend', async () => {
    const handler = http.get('/api/posts/search', ({ request }) => {
      const url = new URL(request.url);
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      if (
        startDate !== '2020-08-31T00:00:00' ||
        endDate !== '2020-09-01T23:59:59'
      ) {
        return HttpResponse.json(
          {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: 10,
            number: 0,
          },
          { status: 200 },
        );
      }

      return HttpResponse.json({
        content: [
          {
            id: 3,
            title: 'Filtered',
            content: 'Filtered content',
            categoryName: 'General',
            categoryId: 1,
            authorName: 'Author',
            authorEmail: 'author@example.com',
            createdAt: '2024-01-03T00:00:00Z',
            updatedAt: '2024-01-03T00:00:00Z',
            commentCount: 0,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
      });
    });

    server.use(handler);

    const page = await postService.getPosts({
      startDate: '2020-08-31',
      endDate: '2020-09-01',
    });

    expect(page.content).toHaveLength(1);
    expect(page.content[0]?.title).toBe('Filtered');
  });

  it('fetches a post by id', async () => {
    server.use(
      http.get('/api/posts/1', () =>
        HttpResponse.json({
          id: 1,
          title: 'Test Post',
          content: 'Content',
          categoryName: 'Events',
          categoryId: 1,
          authorName: 'Author',
          authorEmail: 'author@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          commentCount: 0,
        }),
      ),
    );

    const post = await postService.getPostById(1);

    expect(post.id).toBe(1);
    expect(post.title).toBe('Test Post');
  });

  it('fetches comments for a post', async () => {
    server.use(
      http.get('/api/posts/2/comments', () =>
        HttpResponse.json([
          {
            id: 10,
            content: 'Nice post',
            authorName: 'Jane',
            createdAt: '2024-01-02T00:00:00Z',
          },
        ]),
      ),
    );

    const comments = await postService.getComments(2);

    expect(comments).toHaveLength(1);
    expect(comments[0]?.content).toBe('Nice post');
  });

  it('creates a comment for a post', async () => {
    const createSpy = vi.fn();

    server.use(
      http.post('/api/posts/2/comments', async ({ request }) => {
        const body = (await request.json()) as { content?: string };
        createSpy(body.content);
        return HttpResponse.json(
          {
            id: 11,
            content: body.content ?? '',
            authorName: 'Jane',
            createdAt: '2024-01-03T00:00:00Z',
          },
          { status: 201 },
        );
      }),
    );

    const created = await postService.createComment(2, {
      content: 'New comment',
    });

    expect(createSpy).toHaveBeenCalledWith('New comment');
    expect(created.id).toBe(11);
    expect(created.content).toBe('New comment');
  });

  it('deletes a comment from a post', async () => {
    const deleteSpy = vi.fn();

    server.use(
      http.delete('/api/posts/2/comments/11', () => {
        deleteSpy();
        return HttpResponse.json(null, { status: 204 });
      }),
    );

    await postService.deleteComment(2, 11);

    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  it('updates a comment on a post', async () => {
    const updateSpy = vi.fn();

    server.use(
      http.put('/api/posts/2/comments/11', async ({ request }) => {
        const body = (await request.json()) as { content?: string };
        updateSpy(body.content);
        return HttpResponse.json(
          {
            id: 11,
            content: body.content ?? '',
            authorName: 'Jane',
            createdAt: '2024-01-03T00:00:00Z',
          },
          { status: 200 },
        );
      }),
    );

    const updated = await postService.updateComment(2, 11, {
      content: 'Edited comment',
    });

    expect(updateSpy).toHaveBeenCalledWith('Edited comment');
    expect(updated.id).toBe(11);
    expect(updated.content).toBe('Edited comment');
  });

  it('deletes a post', async () => {
    const deleteSpy = vi.fn();

    server.use(
      http.delete('/api/posts/3', () => {
        deleteSpy();
        return HttpResponse.json(null, { status: 204 });
      }),
    );

    await postService.deletePost(3);

    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });
});
