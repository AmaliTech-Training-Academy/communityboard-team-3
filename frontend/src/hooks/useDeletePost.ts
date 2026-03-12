import { useState } from 'react';
import { postService } from '@/services/postService';
import type { ApiError } from '@/types/auth';
import { useToast } from '@/hooks/useToast';

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const maybe = error as Partial<ApiError>;
  return typeof maybe.status === 'number' ? maybe.status : null;
}

export interface UseDeletePostResult {
  deletePost: (postId: number) => Promise<void>;
  isLoading: boolean;
}

export function useDeletePost(): UseDeletePostResult {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const deletePost = async (postId: number): Promise<void> => {
    try {
      setIsLoading(true);
      await postService.deletePost(postId);
      toast.success({
        title: 'Post deleted',
        description: 'Your post has been removed.',
      });
    } catch (error) {
      const status = getErrorStatus(error);

      if (status === 401) {
        toast.error({
          title: 'Session expired',
          description: 'Please log in again to delete posts.',
        });
      } else if (status === 403) {
        toast.error({
          title: 'Not allowed',
          description: 'You can only delete your own posts.',
        });
      } else if (status === 404) {
        toast.error({
          title: 'Post not found',
          description: 'This post no longer exists.',
        });
      } else {
        toast.error({
          title: 'Failed to delete post',
          description: 'Unable to delete post. Please try again later.',
        });
      }

      throw error instanceof Error ? error : new Error('Failed to delete post');
    } finally {
      setIsLoading(false);
    }
  };

  return { deletePost, isLoading };
}
