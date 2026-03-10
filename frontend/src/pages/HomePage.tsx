import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '@/layout/AppShell';
import { PostsToolbar } from '@/components/features/posts/PostsToolbar';
import { PostList } from '@/components/features/posts/PostList';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryDisplayName } from '@/utils/postCategory';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost } from '@/hooks/useCreatePost';
import { CreatePostModal } from '@/components/features/posts/CreatePostModal';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const { data: categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<'ALL' | number>(
    'ALL',
  );
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const { createPost, isLoading: isCreatingPost } = useCreatePost();

  const toolbarCategories = useMemo(
    () => [
      { id: 'ALL' as const, label: 'All' },
      ...(categories ?? []).map((category) => ({
        id: category.id,
        label: getCategoryDisplayName(category.name),
      })),
    ],
    [categories],
  );

  const activeCategoryLabel =
    toolbarCategories.find((entry) => entry.id === activeCategoryId)?.label ??
    'All';

  return (
    <AppShell>
      <PostsToolbar
        categories={toolbarCategories.map((entry) => entry.label)}
        activeCategory={activeCategoryLabel}
        onCategoryChange={(categoryLabel) => {
          const match = toolbarCategories.find(
            (entry) => entry.label === categoryLabel,
          );
          setActiveCategoryId(match?.id ?? 'ALL');
        }}
        onCreatePostClick={() => {
          if (!isAuthenticated) {
            void navigate('/login');
            return;
          }
          if (isMobile) {
            void navigate('/posts/new');
          } else {
            setIsCreatePostOpen(true);
          }
        }}
      />
      <PostList />
      <CreatePostModal
        isOpen={isCreatePostOpen}
        isSubmitting={isCreatingPost}
        categories={categories ?? []}
        onClose={() => {
          if (isCreatingPost) return;
          setIsCreatePostOpen(false);
        }}
        onSubmit={async (values) => {
          const post = await createPost(values);
          setIsCreatePostOpen(false);
          void navigate(`/posts/${post.id.toString()}`);
        }}
      />
    </AppShell>
  );
}
