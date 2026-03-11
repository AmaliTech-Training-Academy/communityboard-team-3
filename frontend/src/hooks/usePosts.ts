import { useEffect, useState } from 'react';
import { postService, type GetPostsParams } from '@/services/postService';
import type { PaginatedPosts } from '@/types/post';
import { useToast } from '@/hooks/useToast';

export interface UsePostsResult {
  data: PaginatedPosts | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Simple data-fetching hook for the post list.
 *
 * This is intentionally lightweight so it can be
 * swapped to React Query later without changing the
 * PostList UI component interface.
 */
export function usePosts(params?: GetPostsParams): UsePostsResult {
  const toast = useToast();
  const [data, setData] = useState<PaginatedPosts | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    postService
      .getPosts(params)
      .then((response) => {
        if (!isMounted) return;
        setData(response);
      })
      .catch(() => {
        if (!isMounted) return;
        const message = 'Unable to load posts. Please try again later.';
        setError(message);
        toast.error({
          title: 'Failed to load posts',
          description: message,
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params?.page, params?.size, toast]);

  return { data, isLoading, error };
}
