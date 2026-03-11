import { useState } from 'react';
import { useNavigate } from 'react-router';
import { usePosts } from '@/hooks/usePosts';
import { PostListView } from './PostListView';

/**
 * Post list container for the /posts route.
 * Fetches posts on mount and renders either:
 * - skeletons while loading
 * - an empty state when there are no posts
 * - a card for each post when data is available
 */
export function PostList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const size = 10;
  const { data, isLoading } = usePosts({ page, size });

  const posts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const canPrev = page > 0;
  const canNext = data ? page < data.totalPages - 1 : false;

  return (
    <PostListView
      isLoading={isLoading}
      posts={posts}
      onPostClick={(postId) => {
        void navigate(`/posts/${postId.toString()}`);
      }}
      page={page}
      totalPages={totalPages}
      canPrev={canPrev}
      canNext={canNext}
      onPrev={() => {
        setPage((current) => Math.max(0, current - 1));
      }}
      onNext={() => {
        if (!data) return;
        setPage((current) => Math.min(data.totalPages - 1, current + 1));
      }}
      onPageChange={(nextPage: number) => {
        setPage((current) => {
          const maxPage = Math.max(0, totalPages - 1);
          const normalizedNext = Number.isFinite(nextPage) ? nextPage : current;
          return Math.max(0, Math.min(maxPage, normalizedNext));
        });
      }}
    />
  );
}
