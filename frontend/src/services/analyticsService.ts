import { apiClient } from '@/services/api';

export type PostsPerCategoryDatum = {
  category: 'NEWS' | 'EVENT' | 'DISCUSSION' | 'ALERT';
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
};
