import { Skeleton, Text } from '@/components/ui';
import emptyIllustration from '@/assets/Messages 03.svg';
import type { PostSummary } from '@/types/post';
import { PostCard } from './PostCard';

export type PostListViewProps = {
  isLoading: boolean;
  posts: PostSummary[];
  onPostClick: (postId: number) => void;
  page: number;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
};

export function PostListView({
  isLoading,
  posts,
  onPostClick,
  page,
  totalPages,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onPageChange,
  hasActiveFilters,
}: Readonly<PostListViewProps>) {
  if (isLoading) {
    const skeletonKeys = Array.from(
      { length: 3 },
      (_, i) => `skeleton-${String(i)}`,
    );
    return (
      <div className="flex flex-col gap-4">
        {skeletonKeys.map((key) => (
          <Skeleton key={key} variant="card" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <img src={emptyIllustration} alt="" className="h-48 w-auto md:h-64" />
        <Text variant="bodyBase" className="text-primary">
          {hasActiveFilters
            ? 'No posts match your filters. Try clearing your search or changing filters.'
            : 'No posts have been made yet'}
        </Text>
      </div>
    );
  }

  const pageWindow = (() => {
    const current = page + 1;
    const windowSize = 3;
    const maxPage = Math.max(1, totalPages);

    let start = Math.max(1, current - 1);
    const end = Math.min(maxPage, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    const pages: number[] = [];
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  })();

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onClick={() => {
            onPostClick(post.id);
          }}
        />
      ))}

      <div className="mt-6 flex items-center justify-end">
        <div className="inline-flex overflow-hidden rounded-lg border border-default bg-page">
          <button
            type="button"
            className="px-3 py-1.5 text-body-sm text-primary font-medium disabled:cursor-not-allowed disabled:opacity-60 hover:bg-overlay"
            disabled={!canPrev}
            onClick={onPrev}
          >
            Previous
          </button>

          {pageWindow.map((pageNumber) => {
            const isActive = pageNumber === page + 1;
            return (
              <button
                key={pageNumber}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'px-3 py-1.5 text-body-sm text-primary font-medium hover:bg-overlay',
                  'border-l border-default',
                  isActive ? 'bg-overlay' : 'bg-page',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  onPageChange(pageNumber - 1);
                }}
              >
                {pageNumber.toString()}
              </button>
            );
          })}

          <button
            type="button"
            className="px-3 py-1.5 text-body-sm text-primary font-medium border-l border-default disabled:cursor-not-allowed disabled:opacity-60 hover:bg-overlay"
            disabled={!canNext}
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
