import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '@/layout/AppShell';
import { PostsToolbar } from '@/components/features/posts/PostsToolbar';
import { PostList } from '@/components/features/posts/PostList';
import { PostDateRangeFilter } from '@/components/features/posts/PostDateRangeFilter';
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
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const { createPost, isLoading: isCreatingPost } = useCreatePost();

  const toolbarCategories = useMemo(
    () => [
      { id: 'ALL' as const, label: 'All', name: null as string | null },
      ...(categories ?? []).map((category) => ({
        id: category.id,
        label: getCategoryDisplayName(category.name),
        name: category.name,
      })),
    ],
    [categories],
  );

  const activeCategoryLabel =
    toolbarCategories.find((entry) => entry.id === activeCategoryId)?.label ??
    'All';

  const activeCategoryBackendName =
    activeCategoryId === 'ALL'
      ? undefined
      : (toolbarCategories.find((entry) => entry.id === activeCategoryId)
          ?.name ?? undefined);

  const hasValidDateRange =
    Boolean(startDate) && Boolean(endDate) && endDate >= startDate;
  const effectiveStartDate = hasValidDateRange ? startDate : undefined;
  const effectiveEndDate = hasValidDateRange ? endDate : undefined;

  return (
    <AppShell>
      <PostsToolbar
        categories={toolbarCategories.map((entry) => entry.label)}
        activeCategory={activeCategoryLabel}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => {
          setKeyword(searchInput.trim());
        }}
        onCategoryChange={(categoryLabel) => {
          const match = toolbarCategories.find(
            (entry) => entry.label === categoryLabel,
          );
          setActiveCategoryId(match?.id ?? 'ALL');
        }}
        onCreatePostClick={() => {
          if (!isAuthenticated) {
            void navigate('/login?returnUrl=%2Fposts%2Fnew');
            return;
          }
          if (isMobile) {
            void navigate('/posts/new');
          } else {
            setIsCreatePostOpen(true);
          }
        }}
      />
      <PostDateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
        onClear={() => {
          setStartDate('');
          setEndDate('');
        }}
      />
      <PostList
        categoryName={activeCategoryBackendName}
        keyword={keyword}
        startDate={effectiveStartDate}
        endDate={effectiveEndDate}
      />
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
