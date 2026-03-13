import { useState } from 'react';
import { postService, type CreatePostRequest } from '@/services/postService';
import type { PostSummary } from '@/types/post';
import { useToast } from '@/hooks/useToast';

export interface UseCreatePostResult {
  createPost: (payload: CreatePostRequest) => Promise<PostSummary>;
  isLoading: boolean;
  error: string | null;
}

export function useCreatePost(): UseCreatePostResult {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (
    payload: CreatePostRequest,
  ): Promise<PostSummary> => {
    setIsLoading(true);
    setError(null);

    if (payload.categoryId === null) {
      const message = 'Category is required.';
      setError(message);
      toast.error({
        title: 'Failed to create post',
        description: message,
      });
      setIsLoading(false);
      throw new Error(message);
    }

    try {
      const post = await postService.createPost(payload);
      toast.success({
        title: 'Post created',
        description: 'Your post has been published.',
      });
      return post;
    } catch {
      const message =
        'Unable to create post right now. Please try again later.';
      setError(message);
      toast.error({
        title: 'Failed to create post',
        description: message,
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { createPost, isLoading, error };
}
