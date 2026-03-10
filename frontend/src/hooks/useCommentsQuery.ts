import { useEffect, useState } from 'react';
import { postService } from '@/services/postService';
import type { Comment } from '@/types/comment';
import { useToast } from '@/hooks/useToast';

export interface UseCommentsQueryResult {
  data: Comment[] | null;
  isLoading: boolean;
}

/**
 * Data-fetching hook for comments on a post.
 *
 * Mirrors:
 *   GET /api/posts/{postId}/comments
 */
export function useCommentsQuery(
  postId: number | null | undefined,
): UseCommentsQueryResult {
  const toast = useToast();
  const [data, setData] = useState<Comment[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!postId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    postService
      .getComments(postId)
      .then((response) => {
        if (!isMounted) return;
        setData(response);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error({
          title: 'Failed to load comments',
          description: 'Unable to load comments. Please try again later.',
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postId, toast]);

  return { data, isLoading };
}
