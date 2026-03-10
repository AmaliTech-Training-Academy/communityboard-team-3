import { useNavigate } from 'react-router';
import { useState } from 'react';
import { AppShell } from '@/layout/AppShell';
import { PageLoader } from '@/components/ui/PageLoader';
import { formatRelativeTime } from '@/utils/date';
import { usePostDetail } from '@/hooks/usePostDetail';
import { PostDetailView } from '@/components/features/posts/PostDetailView';
import { Text } from '@/components/ui';

export default function PostDetailPage() {
  const navigate = useNavigate();
  const { postId, post, isPostLoading, comments, isCommentsLoading, derived } =
    usePostDetail();

  const [commentDraft, setCommentDraft] = useState('');

  if (isPostLoading) {
    return <PageLoader label="Loading post details..." />;
  }

  if (!post || postId === null || !derived) {
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
      <PostDetailView
        title={post.title}
        content={post.content}
        authorName={post.authorName}
        createdRelative={derived.createdRelative}
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
      />
    </AppShell>
  );
}
