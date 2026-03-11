import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { analyticsService } from '@/services/analyticsService';
import { server } from '@/test/server';

describe('analyticsService', () => {
  it('fetches posts per category', async () => {
    server.use(
      http.get('/api/analytics/posts-per-category', () =>
        HttpResponse.json([
          { category: 'NEWS', count: 5 },
          { category: 'EVENT', count: 2 },
        ]),
      ),
    );

    const data = await analyticsService.getPostsPerCategory();
    expect(data).toEqual([
      { category: 'NEWS', count: 5 },
      { category: 'EVENT', count: 2 },
    ]);
  });

  it('fetches daily activity for last N days', async () => {
    server.use(
      http.get('/api/analytics/daily-activity', ({ request }) => {
        const url = new URL(request.url);
        const days = url.searchParams.get('days');
        return HttpResponse.json([{ date: '2024-01-01', count: Number(days) }]);
      }),
    );

    const data = await analyticsService.getDailyActivity(30);
    expect(data[0]?.count).toBe(30);
  });

  it('fetches top contributors with limit', async () => {
    server.use(
      http.get('/api/analytics/top-contributors', ({ request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get('limit') ?? '0');
        const items = Array.from({ length: limit }, (_, index) => ({
          username: `user-${String(index + 1)}`,
          postCount: index + 1,
        }));
        return HttpResponse.json(items);
      }),
    );

    const data = await analyticsService.getTopContributors(5);
    expect(data).toHaveLength(5);
    expect(data[0]?.username).toBe('user-1');
  });
});
