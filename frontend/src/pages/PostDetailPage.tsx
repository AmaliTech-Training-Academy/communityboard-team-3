import { useNavigate, useLocation } from 'react-router';
import { useMemo, useState } from 'react';
import { AppShell } from '@/layout/AppShell';
import { PageLoader } from '@/components/ui/PageLoader';
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
import { postService } from '@/services/postService';
import { usePostComments } from '@/hooks/usePostComments';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { data: categories } = useCategories();
  const isMobile = useIsMobile();

  const {
    comments: commentsState,
    commentDraft,
    commentError,
    isSubmitting: isSubmittingComment,
    setCommentDraft,
    addComment,
    deleteComment,
    updateComment,
  } = usePostComments(postId, comments, isCommentsLoading);

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
    const fn = deleteComment as (id: number) => Promise<void>;
    void fn(commentId);
  };

  const handleUpdateComment = (commentId: number, content: string): void => {
    const fn = updateComment as (id: number, next: string) => Promise<void>;
    void fn(commentId, content);
  };

  const updatedRelative =
    effectivePost && effectivePost.updatedAt !== effectivePost.createdAt
      ? formatRelativeTime(effectivePost.updatedAt)
      : null;

  const handleDelete = async (postIdToDelete: number): Promise<void> => {
    try {
      setIsDeleting(true);
      await (postService.deletePost as (id: number) => Promise<void>)(
        postIdToDelete,
      );
      void navigate('/');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isPostLoading) {
    return <PageLoader label="Loading post details..." />;
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
        comments={commentsState}
        isCommentsLoading={isCommentsLoading}
        getCommentTimeLabel={(iso) => formatRelativeTime(iso)}
        commentDraft={commentDraft}
        onCommentDraftChange={setCommentDraft}
        onAddComment={() => {
          void addComment();
        }}
        isAuthenticated={isAuthenticated}
        commentError={typeof commentError === 'string' ? commentError : null}
        isSubmittingComment={isSubmittingComment}
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
        isConfirming={isDeleting}
        onCancel={() => {
          if (isDeleting) return;
          setIsDeleteDialogOpen(false);
        }}
        onConfirm={() => {
          if (!postId) return;
          void handleDelete(postId);
        }}
      />
    </AppShell>
  );
}
