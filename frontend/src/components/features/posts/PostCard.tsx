import type { PostSummary } from '@/types/post';
import { Card, Chip, Text } from '@/components/ui';
import type { ChipVariant } from '@/components/ui/Chip';
import clockIcon from '@/assets/clock.svg';
import commentsIcon from '@/assets/message-circle-more.svg';

export type PostCardProps = {
  post: PostSummary;
  onClick?: () => void;
};

function getChipVariant(categoryName: string): ChipVariant {
  const normalized = categoryName.trim().toLowerCase();

  if (normalized === 'events' || normalized === 'event') {
    return 'event';
  }

  if (
    normalized === 'lost & found' ||
    normalized === 'lost and found' ||
    normalized === 'lost-found'
  ) {
    return 'lostFound';
  }

  if (normalized === 'recommendations' || normalized === 'recommendation') {
    return 'recommendation';
  }

  if (normalized === 'help requests' || normalized === 'help request') {
    return 'helpRequest';
  }

  return 'default';
}

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

  const chipVariant = getChipVariant(post.categoryName);

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="w-full p-6 hover:bg-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <Text as="h2" variant="bodyBase" className="text-primary">
              {post.title}
            </Text>
            <Text variant="bodySmRegular" className="text-secondary">
              {preview}
            </Text>
            <div className="mt-2 border-t border-default pt-2">
              <div className="flex items-center gap-4">
                <Text variant="bodySmRegular" className="text-secondary">
                  {post.authorName}
                </Text>
                <div className="flex items-center gap-2 text-muted">
                  <img
                    src={clockIcon}
                    alt=""
                    aria-hidden="true"
                    className="size-4"
                  />
                  <Text
                    as="span"
                    variant="bodySmRegular"
                    className="text-muted"
                  >
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Chip variant={chipVariant}>{post.categoryName}</Chip>
            <div className="flex items-center gap-1 text-muted">
              <img
                src={commentsIcon}
                alt=""
                aria-hidden="true"
                className="size-4"
              />
              <Text as="span" variant="bodySmRegular" className="text-muted">
                {post.commentCount.toString()}
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}
