import { Button, Skeleton, Text } from '@/components/ui';
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
}: Readonly<PostListViewProps>) {
  if (isLoading) {
    const skeletonKeys = Array.from({ length: 3 }, (_, i) => `skeleton-${i}`);
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
          No posts have been made yet
        </Text>
      </div>
    );
  }

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

      <div className="mt-4 flex items-center justify-between border-t border-default pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canPrev}
          onClick={onPrev}
        >
          Previous
        </Button>

        <Text variant="bodySmRegular" className="text-muted">
          Page {page + 1} of {totalPages}
        </Text>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canNext}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
