import { useMemo } from 'react';
import { useParams } from 'react-router';
import { usePostQuery } from '@/hooks/usePostQuery';
import { useCommentsQuery } from '@/hooks/useCommentsQuery';
import { formatRelativeTime } from '@/utils/date';
import {
  getCategoryDisplayName,
  getChipVariantForCategory,
} from '@/utils/postCategory';
import type { ChipVariant } from '@/components/ui/Chip';
import type { PostSummary } from '@/types/post';
import type { Comment } from '@/types/comment';

type PostDetailDerived = {
  chipVariant: ChipVariant;
  categoryLabel: string;
  createdRelative: string;
};

type UsePostDetailResult = {
  postId: number | null;
  post: PostSummary | null;
  isPostLoading: boolean;
  comments: Comment[] | null;
  isCommentsLoading: boolean;
  derived: PostDetailDerived | null;
};

export function usePostDetail(): UsePostDetailResult {
  const { id } = useParams<{ id: string }>();

  const postId = useMemo(() => {
    if (!id) return null;
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [id]);

  const { data: post, isLoading: isPostLoading } = usePostQuery(postId);
  const { data: comments, isLoading: isCommentsLoading } =
    useCommentsQuery(postId);

  const derived: PostDetailDerived | null = useMemo(() => {
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
