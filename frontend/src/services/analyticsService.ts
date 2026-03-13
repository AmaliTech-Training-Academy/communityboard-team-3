import { apiClient } from '@/services/api';

export type PostsPerCategoryDatum = {
  category: string;
  count: number;
};

export type DailyActivityDatum = {
  date: string;
  count: number;
};

export type TopContributorDatum = {
  username: string;
  postCount: number;
};

export type AnalyticsSummary = {
  totalPosts: number;
  totalComments: number;
};

const BASE_PATH = '/analytics';

export const analyticsService = {
  async getPostsPerCategory(): Promise<PostsPerCategoryDatum[]> {
    const { data } = await apiClient.get<PostsPerCategoryDatum[]>(
      `${BASE_PATH}/posts-per-category`,
    );
    return data;
  },

  async getDailyActivity(lastNDays: number): Promise<DailyActivityDatum[]> {
    const { data } = await apiClient.get<DailyActivityDatum[]>(
      `${BASE_PATH}/daily-activity`,
      {
        params: { days: lastNDays },
      },
    );
    return data;
  },

  async getTopContributors(limit: number): Promise<TopContributorDatum[]> {
    const { data } = await apiClient.get<TopContributorDatum[]>(
      `${BASE_PATH}/top-contributors`,
      {
        params: { limit },
      },
    );
    return data;
  },

  async getSummary(): Promise<AnalyticsSummary> {
    const { data } = await apiClient.get<AnalyticsSummary>(
      `${BASE_PATH}/summary`,
    );
    return data;
  },
};
