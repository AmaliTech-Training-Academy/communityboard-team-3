import { useEffect, useState } from 'react';
import { postService } from '@/services/postService';
import type { Comment } from '@/types/comment';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export interface UsePostCommentsResult {
  comments: Comment[] | null;
  commentDraft: string;
  isSubmitting: boolean;
  setCommentDraft: (next: string) => void;
  addComment: () => Promise<void>;
}

export function usePostComments(
  postId: number | null,
  initialComments: Comment[] | null,
  isInitialLoading: boolean,
): UsePostCommentsResult {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [comments, setComments] = useState<Comment[] | null>(initialComments);
  const [commentDraft, setCommentDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitialLoading && comments === null && initialComments) {
      setComments(initialComments);
    }
  }, [comments, initialComments, isInitialLoading]);

  const addComment = async (): Promise<void> => {
    if (!postId) return;

    if (!isAuthenticated || !user) {
      toast.error({
        title: 'Login required',
        description: 'Please log in to add a comment.',
      });
      return;
    }

    const trimmed = commentDraft.trim();
    if (!trimmed) {
      toast.error({
        title: 'Comment required',
        description: 'Please enter a comment before submitting.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const next = await postService.createComment(postId, {
        content: trimmed,
      });
      setComments((prev) => {
        if (!prev) return [next];
        return [...prev, next];
      });
      setCommentDraft('');
    } catch {
      toast.error({
        title: 'Failed to add comment',
        description: 'Something went wrong while adding your comment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    comments,
    commentDraft,
    isSubmitting,
    setCommentDraft,
    addComment,
  };
}

