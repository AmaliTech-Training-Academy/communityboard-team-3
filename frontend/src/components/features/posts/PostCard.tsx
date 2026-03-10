import type { PostSummary } from '@/types/post';
import { Card, Chip, Text } from '@/components/ui';
import clockIcon from '@/assets/clock.svg';
import commentsIcon from '@/assets/message-circle-more.svg';
import { formatRelativeTime } from '@/utils/date';
import {
  getCategoryDisplayName,
  getChipVariantForCategory,
} from '@/utils/postCategory';

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

  const chipVariant = getChipVariantForCategory(post.categoryName);
  const categoryLabel = getCategoryDisplayName(post.categoryName);
  const createdRelative = formatRelativeTime(post.createdAt);

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="w-full bg-surface p-6 hover:bg-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)">
        <div className="flex flex-col gap-3">
          {/* Header row: title + category badge */}
          <div className="flex items-start justify-between gap-3">
            <Text
              as="h2"
              variant="bodyBase"
              className="text-primary text-xl font-semibold leading-8"
            >
              {post.title}
            </Text>
            <Chip variant={chipVariant}>{categoryLabel}</Chip>
          </div>

          {/* Body preview */}
          <Text variant="bodyBase" className="text-secondary">
            {preview}
          </Text>

          {/* Footer row: author + time left, comments right */}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-default pt-1.5">
            <div className="flex items-center gap-4">
              <Text variant="bodySmRegular" className="text-secondary">
                {post.authorName}
              </Text>
              <div className="flex items-center gap-1">
                <img
                  src={clockIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4"
                />
                <Text as="span" variant="bodySmRegular" className="text-muted">
                  {createdRelative}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-muted">
              <img
                src={commentsIcon}
                alt=""
                aria-hidden="true"
                className="h-4 w-4"
              />
              <Text
                as="span"
                variant="bodyBase"
                className="text-secondary font-semibold leading-6"
              >
                {post.commentCount.toString()}
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}
