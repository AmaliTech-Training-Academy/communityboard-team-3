import { apiClient } from '@/services/api';
import type { PaginatedPosts, PostSummary } from '@/types/post';
import type { Comment } from '@/types/comment';

const BASE_PATH = '/posts';

export interface GetPostsParams {
  page?: number;
  size?: number;
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
};
