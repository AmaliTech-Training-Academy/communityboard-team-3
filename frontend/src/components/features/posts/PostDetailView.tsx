import { Trash2 } from 'lucide-react';
import { Button, Chip, Text } from '@/components/ui';
import houseIcon from '@/assets/house.svg';
import chevronRightIcon from '@/assets/chevron-right.svg';
import clockIcon from '@/assets/clock.svg';
import penIcon from '@/assets/pen.svg';
import trashIcon from '@/assets/trash-2.svg';
import emptyIllustration from '@/assets/Messages 03.svg';
import type { Comment } from '@/types/comment';
import type { ChipVariant } from '@/components/ui/Chip';

export type PostDetailViewProps = {
  title: string;
  content: string;
  authorName: string;
  createdRelative: string;
  updatedRelative?: string | null;
  categoryLabel: string;
  chipVariant: ChipVariant;
  comments: Comment[] | null;
  isCommentsLoading: boolean;
  getCommentTimeLabel: (iso: string) => string;
  commentDraft: string;
  commentError?: string | null;
  onCommentDraftChange: (next: string) => void;
  onAddComment: () => void;
  isAuthenticated: boolean;
  isSubmittingComment: boolean;
  onRequestLogin?: () => void;
  currentUserName?: string | null;
  isAdmin?: boolean;
  onDeleteComment?: (commentId: number) => void;
  onBackHome: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
};

export function PostDetailView({
  title,
  content,
  authorName,
  createdRelative,
  updatedRelative,
  categoryLabel,
  chipVariant,
  comments,
  isCommentsLoading,
  getCommentTimeLabel,
  commentDraft,
  commentError,
  onCommentDraftChange,
  onAddComment,
  isAuthenticated,
  isSubmittingComment,
  onRequestLogin,
  currentUserName,
  isAdmin = false,
  onDeleteComment,
  onBackHome,
  canEdit = false,
  onEdit,
  canDelete = false,
  onDelete,
}: Readonly<PostDetailViewProps>) {
  const totalComments = comments?.length ?? 0;
  const hasComments = totalComments > 0;
  const showEmptyState = !isCommentsLoading && !hasComments;
  const commentList = comments ?? [];

  return (
    <>
      {/* Breadcrumb – inline width (matches Figma) */}
      <div className="inline-flex items-center gap-4 rounded-lg border border-default bg-page px-5 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-body-sm-regular text-primary"
          onClick={onBackHome}
        >
          <img src={houseIcon} alt="" className="h-5 w-5" />
          <span>Home</span>
        </button>
        <img src={chevronRightIcon} alt="" className="h-5 w-5 text-muted" />
        <Text variant="bodySmRegular" className="text-primary">
          Post Details
        </Text>
      </div>

      <section className="flex flex-col gap-10">
        {/* Post details block */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <Text as="h1" variant="headingAuth" className="text-primary">
                {title}
              </Text>
            </div>

            {(canEdit && onEdit) || (canDelete && onDelete) ? (
              <div className="flex items-center gap-2">
                <Chip variant={chipVariant}>{categoryLabel}</Chip>
                {canEdit && onEdit ? (
                  <button
                    type="button"
                    aria-label="Edit post"
                    onClick={onEdit}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-button hover:bg-overlay"
                  >
                    <img src={penIcon} alt="" className="h-5 w-5" />
                  </button>
                ) : null}
                {canDelete && onDelete ? (
                  <button
                    type="button"
                    aria-label="Delete post"
                    onClick={onDelete}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-button text-danger hover:bg-overlay"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <Text variant="bodyBase" className="text-secondary">
            {content}
          </Text>

          <div className="flex h-5 items-center gap-4">
            <div className="flex h-5 items-start">
              <Text
                as="span"
                variant="bodySmRegular"
                className="text-secondary font-medium"
              >
                {authorName}
              </Text>
            </div>
            <div className="flex h-5 items-center gap-1">
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
            {updatedRelative ? (
              <Text as="span" variant="bodySmRegular" className="text-muted">
                · Updated {updatedRelative}
              </Text>
            ) : null}
          </div>

          <div className="h-px w-full border-t border-default" />
        </div>

        {/* Comment input + button block */}
        {isAuthenticated ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-end gap-2.5">
              <div className="flex h-56 w-full flex-col items-center gap-3">
                <div className="flex-1 w-full rounded-lg border border-default bg-overlay px-4 py-3">
                  <textarea
                    value={commentDraft}
                    onChange={(event) => {
                      onCommentDraftChange(event.target.value);
                    }}
                    className="h-full w-full resize-none bg-transparent text-body-sm-regular text-secondary outline-none"
                    placeholder="Share your thoughts..."
                    aria-invalid={Boolean(commentError)}
                  />
                </div>
              </div>
              {commentError ? (
                <Text
                  variant="bodySmRegular"
                  className="self-start text-danger"
                >
                  {commentError}
                </Text>
              ) : null}
              <Button
                type="button"
                variant="primary"
                className="w-80 px-5 py-2.5"
                onClick={onAddComment}
                disabled={isSubmittingComment || !commentDraft.trim()}
              >
                {isSubmittingComment ? 'Adding comment...' : 'Add comment'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-default bg-overlay px-5 py-4">
            <Text variant="bodyBase" className="text-secondary">
              Comments are read-only for guests. Please log in to add your
              comment.
            </Text>
            <div>
              <Button
                type="button"
                variant="primary"
                className="px-5 py-2.5"
                onClick={onRequestLogin}
              >
                Log in to comment
              </Button>
            </div>
          </div>
        )}

        {/* Comments section */}
        <section className="space-y-10">
          <div className="flex items-baseline gap-1">
            <Text
              as="h2"
              variant="bodyBase"
              className="text-secondary font-bold"
            >
              Comments
            </Text>
            <Text variant="bodyBase" className="text-secondary font-bold">
              ({totalComments})
            </Text>
          </div>

          {isCommentsLoading ? (
            <Text variant="bodySmRegular" className="text-muted">
              Loading comments...
            </Text>
          ) : null}

          {showEmptyState ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <img
                src={emptyIllustration}
                alt=""
                className="h-40 w-auto md:h-48"
              />
              <Text variant="bodyBase" className="text-muted">
                No Comments yet
              </Text>
            </div>
          ) : null}

          {!isCommentsLoading && hasComments ? (
            <div className="space-y-6">
              {commentList.map((comment) => {
                const initials = comment.authorName
                  .split(' ')
                  .filter(Boolean)
                  .map((part) => part[0].toUpperCase())
                  .slice(0, 2)
                  .join('');

                const canDeleteComment =
                  Boolean(currentUserName) &&
                  (isAdmin || comment.authorName === currentUserName);

                return (
                  <div
                    key={comment.id}
                    className="group flex flex-col gap-4 border-b border-default pb-4 last:border-b-0 last:pb-0 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--badge-gray-fill,#c3c3c2) text-sm font-medium text-(--background-sidepanel-dark,#222220)">
                          {initials || '??'}
                        </div>
                        <div className="space-y-1">
                          <Text
                            variant="bodyBase"
                            className="text-primary text-sm font-semibold"
                          >
                            {comment.authorName}
                          </Text>
                          <Text
                            variant="bodySmRegular"
                            className="text-secondary"
                          >
                            {getCommentTimeLabel(comment.createdAt)}
                          </Text>
                        </div>
                      </div>
                      <Text variant="bodyBase" className="text-secondary">
                        {comment.content}
                      </Text>
                    </div>

                    {canDeleteComment ? (
                      <div className="mt-2 flex items-center gap-4 md:mt-0">
                        <button
                          type="button"
                          aria-label="Delete comment"
                          className="inline-flex h-6 w-6 items-center justify-center"
                          onClick={() => {
                            onDeleteComment?.(comment.id);
                          }}
                        >
                          <img src={trashIcon} alt="" className="h-5 w-5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      </section>
    </>
  );
}
