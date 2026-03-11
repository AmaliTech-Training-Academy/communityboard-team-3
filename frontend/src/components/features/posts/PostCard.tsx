import type { PostSummary } from '@/types/post';
import { Card, Chip, Text } from '@/components/ui';

export type PostCardProps = {
  post: PostSummary;
  onClick?: () => void;
};

/**
 * Presentational card for a single post in the list.
 * Uses shared UI primitives so it stays aligned with
 * the design system.
 */
export function PostCard({ post, onClick }: Readonly<PostCardProps>) {
  const preview =
    post.content.length > 200
      ? `${post.content.slice(0, 200).trimEnd()}…`
      : post.content;

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="w-full p-4 hover:bg-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <Text variant="bodySmRegular" className="text-secondary">
              {post.authorName}
            </Text>
            <Text as="h2" variant="bodyBase" className="text-primary">
              {post.title}
            </Text>
            <Text variant="bodySmRegular" className="text-secondary">
              {preview}
            </Text>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Chip>{post.categoryName}</Chip>
            <Text variant="bodySmRegular" className="text-muted">
              {new Date(post.createdAt).toLocaleDateString()}
            </Text>
            <Text variant="bodySmRegular" className="text-muted">
              {post.commentCount.toString()} comments
            </Text>
          </div>
        </div>
      </Card>
    </button>
  );
}
