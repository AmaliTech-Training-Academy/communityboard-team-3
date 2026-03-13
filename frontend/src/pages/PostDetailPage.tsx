import { useNavigate, useLocation } from 'react-router';
import { useMemo, useState } from 'react';
import { AppShell } from '@/layout/AppShell';
import { formatRelativeTime } from '@/utils/date';
import { usePostDetail } from '@/hooks/usePostDetail';
import { PostDetailView } from '@/components/features/posts/PostDetailView';
import { Text } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import type { PostSummary } from '@/types/post';
import { EditPostModal } from '@/components/features/posts/EditPostModal';
import type { PostFormModalValues } from '@/components/features/posts/PostFormModal';
import { useCategories } from '@/hooks/useCategories';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePostComments } from '@/hooks/usePostComments';
import { postService } from '@/services/postService';
import { useDeletePost } from '@/hooks/useDeletePost';
import { PostDetailSkeleton } from '@/components/features/posts/PostDetailSkeleton';

export default function PostDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId, post, isPostLoading, comments, isCommentsLoading, derived } =
    usePostDetail();
  const [currentPost, setCurrentPost] = useState<PostSummary | null>(
    post ?? null,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteCommentDialogOpen, setIsDeleteCommentDialogOpen] =
    useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState<number | null>(
    null,
  );
  const { user, isAuthenticated } = useAuth();
  const { data: categories } = useCategories();
  const isMobile = useIsMobile();
  const deletePostState = useDeletePost();

  const postCommentsState = usePostComments(
    postId,
    comments,
    isCommentsLoading,
  );

  const effectivePost = currentPost ?? post ?? null;

  const canEdit = useMemo(() => {
    if (!effectivePost || !user) return false;
    const isAdmin = user.role === 'ADMIN';
    const isAuthor = user.email === effectivePost.authorEmail;
    return isAdmin || isAuthor;
  }, [effectivePost, user]);

  const canDelete = canEdit;

  const currentUserName = user?.name ?? null;
  const isAdmin = user?.role === 'ADMIN';

  const handleDeleteComment = (commentId: number): void => {
    setCommentIdToDelete(commentId);
    setIsDeleteCommentDialogOpen(true);
  };

  const handleUpdateComment = (commentId: number, content: string): void => {
    const fn = postCommentsState.updateComment as (
      id: number,
      next: string,
    ) => Promise<void>;
    void fn(commentId, content);
  };

  const updatedRelative =
    effectivePost && effectivePost.updatedAt !== effectivePost.createdAt
      ? formatRelativeTime(effectivePost.updatedAt)
      : null;

  const handleDelete = async (postIdToDelete: number): Promise<void> => {
    try {
      await deletePostState.deletePost(postIdToDelete);
      setIsDeleteDialogOpen(false);
      void navigate('/');
    } catch {
      // Toast handled by hook; allow retry/cancel in dialog.
    }
  };

  if (isPostLoading) {
    return (
      <AppShell>
        <PostDetailSkeleton />
      </AppShell>
    );
  }

  if (!effectivePost || postId === null || !derived) {
    return (
      <AppShell>
        <Text variant="bodyBase" className="text-primary">
          Post not found.
        </Text>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {isMobile ? null : (
        <EditPostModal
          isOpen={isEditOpen}
          isSubmitting={isUpdating}
          categories={categories ?? []}
          initialValues={{
            title: effectivePost.title,
            content: effectivePost.content,
            categoryId: effectivePost.categoryId,
          }}
          onClose={() => {
            setIsEditOpen(false);
          }}
          onSubmit={async (values: PostFormModalValues) => {
            if (!postId) return;
            try {
              setIsUpdating(true);
              const updated = await postService.updatePost(postId, values);
              setCurrentPost(updated);
              setIsEditOpen(false);
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      )}
      <PostDetailView
        title={effectivePost.title}
        content={effectivePost.content}
        authorName={effectivePost.authorName}
        createdRelative={derived.createdRelative}
        updatedRelative={updatedRelative}
        categoryLabel={derived.categoryLabel}
        chipVariant={derived.chipVariant}
        comments={postCommentsState.comments}
        isCommentsLoading={isCommentsLoading}
        getCommentTimeLabel={(iso) => formatRelativeTime(iso)}
        commentDraft={postCommentsState.commentDraft}
        onCommentDraftChange={postCommentsState.setCommentDraft}
        onAddComment={() => {
          void postCommentsState.addComment();
        }}
        isAuthenticated={isAuthenticated}
        commentError={
          typeof postCommentsState.commentError === 'string'
            ? postCommentsState.commentError
            : null
        }
        isSubmittingComment={postCommentsState.isSubmitting}
        currentUserName={currentUserName}
        isAdmin={isAdmin}
        onDeleteComment={handleDeleteComment}
        onUpdateComment={handleUpdateComment}
        onRequestLogin={() => {
          const returnUrl = encodeURIComponent(location.pathname);
          void navigate(`/login?returnUrl=${returnUrl}`);
        }}
        onBackHome={() => {
          void navigate('/');
        }}
        canEdit={canEdit}
        onEdit={() => {
          if (isMobile) {
            void navigate(`/posts/${postId.toString()}/edit`);
            return;
          }
          setCurrentPost(effectivePost);
          setIsEditOpen(true);
        }}
        canDelete={canDelete}
        onDelete={() => {
          setIsDeleteDialogOpen(true);
        }}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete post?"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isConfirming={deletePostState.isLoading}
        onCancel={() => {
          if (deletePostState.isLoading) return;
          setIsDeleteDialogOpen(false);
        }}
        onConfirm={() => {
          if (!postId) return;
          void handleDelete(postId);
        }}
      />
      <ConfirmDialog
        isOpen={isDeleteCommentDialogOpen}
        title="Delete comment?"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isConfirming={postCommentsState.isSubmitting}
        onCancel={() => {
          if (postCommentsState.isSubmitting) return;
          setIsDeleteCommentDialogOpen(false);
          setCommentIdToDelete(null);
        }}
        onConfirm={() => {
          if (commentIdToDelete === null) return;
          const fn = postCommentsState.deleteComment as (
            id: number,
          ) => Promise<void>;
          void fn(commentIdToDelete).finally(() => {
            setIsDeleteCommentDialogOpen(false);
            setCommentIdToDelete(null);
          });
        }}
      />
    </AppShell>
  );
}
