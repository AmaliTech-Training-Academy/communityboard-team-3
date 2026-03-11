import { useNavigate } from 'react-router';
import { Skeleton, Text } from '@/components/ui';
import { usePosts } from '@/hooks/usePosts';
import emptyIllustration from '@/assets/Messages 03.svg';
import { PostCard } from './PostCard';

/**
 * Post list container for the /posts route.
 * Fetches posts on mount and renders either:
 * - skeletons while loading
 * - an empty state when there are no posts
 * - a card for each post when data is available
 */
export function PostList() {
  const navigate = useNavigate();
  const { data, isLoading } = usePosts({ page: 0, size: 10 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="card" />
        ))}
      </div>
    );
  }

  const posts = data?.content ?? [];

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
            void navigate(`/posts/${post.id.toString()}`);
          }}
        />
      ))}
    </div>
  );
}
