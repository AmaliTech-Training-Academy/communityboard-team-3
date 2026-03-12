import { useEffect, useState } from 'react';
import { categoryService } from '@/services/categoryService';
import type { Category } from '@/types/category';
import { useToast } from '@/hooks/useToast';

export interface UseCategoriesResult {
  data: Category[] | null;
  isLoading: boolean;
}

/**
 * Lightweight hook to fetch post categories from the backend.
 *
 * Mirrors:
 *   GET /api/categories
 */
export function useCategories(): UseCategoriesResult {
  const toast = useToast();
  const [data, setData] = useState<Category[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    categoryService
      .getCategories()
      .then((response) => {
        if (!isMounted) return;
        setData(response);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error({
          title: 'Failed to load categories',
          description: 'Unable to load categories. Please try again later.',
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [toast]);

  return { data, isLoading };
}
