import { useEffect, useState } from 'react';
import {
  analyticsService,
  type DailyActivityDatum,
  type PostsPerCategoryDatum,
  type TopContributorDatum,
} from '@/services/analyticsService';
import { useToast } from '@/hooks/useToast';

export interface UsePostsPerCategoryResult {
  data: PostsPerCategoryDatum[] | null;
  isLoading: boolean;
}

export interface UseDailyActivityResult {
  data: DailyActivityDatum[] | null;
  isLoading: boolean;
}

export interface UseTopContributorsResult {
  data: TopContributorDatum[] | null;
  isLoading: boolean;
}

export function usePostsPerCategory(): UsePostsPerCategoryResult {
  const toast = useToast();
  const [data, setData] = useState<PostsPerCategoryDatum[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    analyticsService
      .getPostsPerCategory()
      .then((response) => {
        if (!isMounted) return;
        setData(response);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error({
          title: 'Failed to load posts per category',
          description: 'Please try again later.',
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

export function useDailyActivity(lastNDays: number): UseDailyActivityResult {
  const toast = useToast();
  const [data, setData] = useState<DailyActivityDatum[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    analyticsService
      .getDailyActivity(lastNDays)
      .then((response) => {
        if (!isMounted) return;
        setData(response);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error({
          title: 'Failed to load daily activity',
          description: 'Please try again later.',
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lastNDays, toast]);

  return { data, isLoading };
}

export function useTopContributors(limit: number): UseTopContributorsResult {
  const toast = useToast();
  const [data, setData] = useState<TopContributorDatum[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    analyticsService
      .getTopContributors(limit)
      .then((response) => {
        if (!isMounted) return;
        setData(response);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error({
          title: 'Failed to load top contributors',
          description: 'Please try again later.',
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [limit, toast]);

  return { data, isLoading };
}
