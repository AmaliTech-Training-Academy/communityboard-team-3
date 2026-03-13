import { useEffect, useState } from 'react';
import { postService } from '@/services/postService';
import type { Comment } from '@/types/comment';
import type { ApiError } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const maybe = error as Partial<ApiError>;
  return typeof maybe.status === 'number' ? maybe.status : null;
}

export interface UsePostCommentsResult {
  comments: Comment[] | null;
  commentDraft: string;
  commentError: string | null;
  isSubmitting: boolean;
  setCommentDraft: (next: string) => void;
  addComment: () => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  updateComment: (commentId: number, content: string) => Promise<void>;
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
  const [commentError, setCommentError] = useState<string | null>(null);
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
      setCommentError('Comment is required.');
      return;
    }

    setCommentError(null);

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
      setCommentError(null);
      toast.success({
        title: 'Comment added',
        description: 'Your comment has been posted.',
      });
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 401) {
        toast.error({
          title: 'Session expired',
          description: 'Please log in again to add a comment.',
        });
        return;
      }

      toast.error({
        title: 'Failed to add comment',
        description: 'Something went wrong while adding your comment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: number): Promise<void> => {
    if (!postId) return;

    if (!isAuthenticated || !user) {
      toast.error({
        title: 'Login required',
        description: 'Please log in to delete a comment.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await postService.deleteComment(postId, commentId);
      setComments((prev) =>
        prev ? prev.filter((comment) => comment.id !== commentId) : prev,
      );
      toast.success({
        title: 'Comment deleted',
        description: 'Your comment has been removed.',
      });
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 401) {
        toast.error({
          title: 'Session expired',
          description: 'Please log in again to manage comments.',
        });
        return;
      }

      if (status === 403) {
        toast.error({
          title: 'Not allowed',
          description: 'You can only delete your own comments.',
        });
        return;
      }

      if (status === 404) {
        // Comment does not exist on the server anymore – treat as deleted.
        setComments((prev) =>
          prev ? prev.filter((comment) => comment.id !== commentId) : prev,
        );
        return;
      }

      toast.error({
        title: 'Failed to delete comment',
        description: 'Something went wrong while deleting this comment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateComment = async (
    commentId: number,
    content: string,
  ): Promise<void> => {
    if (!postId) return;

    if (!isAuthenticated || !user) {
      toast.error({
        title: 'Login required',
        description: 'Please log in to edit a comment.',
      });
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      toast.error({
        title: 'Comment required',
        description: 'Please enter a comment before saving.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await postService.updateComment(postId, commentId, {
        content: trimmed,
      });
      setComments((prev) =>
        prev
          ? prev.map((comment) =>
              comment.id === commentId ? updated : comment,
            )
          : prev,
      );
      toast.success({
        title: 'Comment updated',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 401) {
        toast.error({
          title: 'Session expired',
          description: 'Please log in again to edit comments.',
        });
        return;
      }

      if (status === 403) {
        toast.error({
          title: 'Not allowed',
          description: 'You can only edit your own comments.',
        });
        return;
      }

      if (status === 404) {
        // Comment does not exist on the server anymore – treat as deleted.
        setComments((prev) =>
          prev ? prev.filter((comment) => comment.id !== commentId) : prev,
        );
        toast.error({
          title: 'Comment not found',
          description: 'This comment no longer exists.',
        });
        return;
      }

      toast.error({
        title: 'Failed to update comment',
        description: 'Something went wrong while saving your changes.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    comments,
    commentDraft,
    commentError,
    isSubmitting,
    setCommentDraft: (next: string) => {
      setCommentDraft(next);
      if (commentError) {
        setCommentError(null);
      }
    },
    addComment,
    deleteComment,
    updateComment,
  };
}
