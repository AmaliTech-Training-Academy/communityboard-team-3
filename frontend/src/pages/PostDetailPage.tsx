import { useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import { AppShell } from '@/layout/AppShell';
import { PageLoader } from '@/components/ui/PageLoader';
import { formatRelativeTime } from '@/utils/date';
import { usePostDetail } from '@/hooks/usePostDetail';
import { PostDetailView } from '@/components/features/posts/PostDetailView';
import { Text } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { postService } from '@/services/postService';
import type { PostSummary } from '@/types/post';
import { EditPostModal } from '@/components/features/posts/EditPostModal';
import type { PostFormModalValues } from '@/components/features/posts/PostFormModal';
import { useCategories } from '@/hooks/useCategories';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function PostDetailPage() {
  const navigate = useNavigate();
  const { postId, post, isPostLoading, comments, isCommentsLoading, derived } =
    usePostDetail();

  const [commentDraft, setCommentDraft] = useState('');
  const [currentPost, setCurrentPost] = useState<PostSummary | null>(
    post ?? null,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const isMobile = useIsMobile();

  const effectivePost = currentPost ?? post ?? null;

  const canEdit = useMemo(() => {
    if (!effectivePost || !user) return false;
    const isAdmin = user.role === 'ADMIN';
    const isAuthor = user.email === effectivePost.authorEmail;
    return isAdmin || isAuthor;
  }, [effectivePost, user]);

  const updatedRelative =
    effectivePost && effectivePost.updatedAt !== effectivePost.createdAt
      ? formatRelativeTime(effectivePost.updatedAt)
      : null;

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
        comments={comments}
        isCommentsLoading={isCommentsLoading}
        getCommentTimeLabel={(iso) => formatRelativeTime(iso)}
        commentDraft={commentDraft}
        onCommentDraftChange={setCommentDraft}
        onAddComment={() => {
          // Stub: wire to POST /comments when backend is ready.
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
      />
    </AppShell>
  );
}
