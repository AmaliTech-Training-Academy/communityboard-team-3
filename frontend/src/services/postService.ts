import { apiClient } from '@/services/api';
import type { PaginatedPosts, PostSummary } from '@/types/post';

const BASE_PATH = '/posts';

export interface GetPostsParams {
  page?: number;
  size?: number;
}

export const postService = {
  /**
   * Fetch a paginated list of posts from the backend.
   * Mirrors the Spring endpoint:
   *   GET /api/posts?page=0&size=10
   */
  async getPosts(params: GetPostsParams = {}): Promise<PaginatedPosts> {
    const { page = 0, size = 10 } = params;
    const { data } = await apiClient.get<PaginatedPosts>(BASE_PATH, {
      params: { page, size },
    });
    return data;
  },

  /**
   * Fetch a single post by id.
   * Mirrors:
   *   GET /api/posts/{id}
   */
  async getPostById(id: number): Promise<PostSummary> {
    const { data } = await apiClient.get<PostSummary>(
      `${BASE_PATH}/${id.toString()}`,
    );
    return data;
  },
};
