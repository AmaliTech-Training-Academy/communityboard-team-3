import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { analyticsService } from '@/services/analyticsService';

const server = setupServer();

vi.mock('@/services/api', async () => {
  const actual = await vi.importActual<typeof import('@/services/api')>(
    '@/services/api',
  );
  return {
    ...actual,
    apiClient: actual.apiClient,
  };
});

describe('analyticsService', () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

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
        return HttpResponse.json([
          { date: '2024-01-01', count: Number(days) },
        ]);
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
          username: `user-${index + 1}`,
          postCount: index + 1,
        }));
        return HttpResponse.json(items);
      }),
    );

    const data = await analyticsService.getTopContributors(5);
    expect(data).toHaveLength(5);
    expect(data[0]?.username).toBe('user-1');
  });
}

