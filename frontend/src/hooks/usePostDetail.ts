import { useMemo } from 'react';
import { useParams } from 'react-router';
import { usePostQuery } from '@/hooks/usePostQuery';
import { useCommentsQuery } from '@/hooks/useCommentsQuery';
import { formatRelativeTime } from '@/utils/date';
import {
  getCategoryDisplayName,
  getChipVariantForCategory,
} from '@/utils/postCategory';

export function usePostDetail() {
  const { id } = useParams<{ id: string }>();

  const postId = useMemo(() => {
    if (!id) return null;
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [id]);

  const { data: post, isLoading: isPostLoading } = usePostQuery(postId);
  const { data: comments, isLoading: isCommentsLoading } =
    useCommentsQuery(postId);

  const derived = useMemo(() => {
    if (!post) return null;
    return {
      chipVariant: getChipVariantForCategory(post.categoryName),
      categoryLabel: getCategoryDisplayName(post.categoryName),
      createdRelative: formatRelativeTime(post.createdAt),
    };
  }, [post]);

  return {
    postId,
    post,
    isPostLoading,
    comments,
    isCommentsLoading,
    derived,
  };
}
