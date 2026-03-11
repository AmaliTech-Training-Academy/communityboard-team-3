import { useEffect, useState } from 'react';
import { postService } from '@/services/postService';
import type { PostSummary } from '@/types/post';
import { useToast } from '@/hooks/useToast';

export interface UsePostQueryResult {
  data: PostSummary | null;
  isLoading: boolean;
}

/**
 * Data-fetching hook for a single post detail.
 *
 * Mirrors:
 *   GET /api/posts/{id}
 */
export function usePostQuery(
  id: number | null | undefined,
): UsePostQueryResult {
  const toast = useToast();
  const [data, setData] = useState<PostSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    postService
      .getPostById(id)
      .then((response) => {
        if (!isMounted) return;
        setData(response);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error({
          title: 'Failed to load post',
          description: 'Unable to load this post. Please try again later.',
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, toast]);

  return { data, isLoading };
}
