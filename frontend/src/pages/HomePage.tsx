import { useMemo, useState } from 'react';
import { AppShell } from '@/layout/AppShell';
import { PostsToolbar } from '@/components/features/posts/PostsToolbar';
import { PostList } from '@/components/features/posts/PostList';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryDisplayName } from '@/utils/postCategory';

export default function HomePage() {
  const { data: categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<'ALL' | number>(
    'ALL',
  );

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
      />
      <PostList />
    </AppShell>
  );
}
