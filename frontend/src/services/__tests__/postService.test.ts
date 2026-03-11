import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { postService } from '@/services/postService';
import { server } from '@/test/server';

describe('postService', () => {
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
});
