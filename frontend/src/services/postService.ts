import { apiClient } from '@/services/api';
import type { PaginatedPosts, PostSummary } from '@/types/post';
import type { Comment } from '@/types/comment';

const BASE_PATH = '/posts';

export interface GetPostsParams {
  page?: number;
  size?: number;
  /**
   * Optional filters; when any are present we delegate
   * to the backend search endpoint:
   *   GET /api/posts/search
   */
  categoryId?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  categoryId: number | null;
}

export type UpdatePostRequest = CreatePostRequest;

export const postService = {
  /**
   * Fetch a paginated list of posts from the backend.
   * Mirrors the Spring endpoints:
   *   GET /api/posts?page=0&size=10
   *   GET /api/posts/search?... (when filters are provided)
   */
  async getPosts(params: GetPostsParams = {}): Promise<PaginatedPosts> {
    const {
      page = 0,
      size = 10,
      categoryId,
      keyword,
      startDate,
      endDate,
    } = params;

    const hasSearchFilters =
      categoryId !== undefined ||
      Boolean(keyword) ||
      Boolean(startDate) ||
      Boolean(endDate);

    const path = hasSearchFilters ? `${BASE_PATH}/search` : BASE_PATH;

    const { data } = await apiClient.get<PaginatedPosts>(path, {
      params: {
        page,
        size,
        categoryId,
        keyword,
        startDate,
        endDate,
      },
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

  /**
   * Fetch all comments for a given post.
   * Mirrors:
   *   GET /api/posts/{postId}/comments
   */
  async getComments(postId: number): Promise<Comment[]> {
    const { data } = await apiClient.get<Comment[]>(
      `${BASE_PATH}/${postId.toString()}/comments`,
    );
    return data;
  },

  /**
   * Create a new comment on a post.
   * Mirrors:
   *   POST /api/posts/{postId}/comments
   */
  async createComment(
    postId: number,
    payload: { content: string },
  ): Promise<Comment> {
    const { data } = await apiClient.post<Comment>(
      `${BASE_PATH}/${postId.toString()}/comments`,
      payload,
    );
    return data;
  },

  /**
   * Delete a comment from a post.
   * Mirrors:
   *   DELETE /api/posts/{postId}/comments/{commentId}
   */
  async deleteComment(postId: number, commentId: number): Promise<void> {
    await apiClient.delete(
      `${BASE_PATH}/${postId.toString()}/comments/${commentId.toString()}`,
    );
  },

  /**
   * Create a new post.
   * Mirrors:
   *   POST /api/posts
   */
  async createPost(payload: CreatePostRequest): Promise<PostSummary> {
    const { data } = await apiClient.post<PostSummary>(BASE_PATH, payload);
    return data;
  },

  /**
   * Update an existing post.
   * Mirrors:
   *   PUT /api/posts/{id}
   */
  async updatePost(
    id: number,
    payload: UpdatePostRequest,
  ): Promise<PostSummary> {
    const { data } = await apiClient.put<PostSummary>(
      `${BASE_PATH}/${id.toString()}`,
      payload,
    );
    return data;
  },

  /**
   * Delete a post.
   * Mirrors:
   *   DELETE /api/posts/{id}
   */
  async deletePost(id: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${id.toString()}`);
  },
};
