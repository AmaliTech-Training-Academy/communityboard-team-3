import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Chip, Skeleton, Text, TextField } from '@/components/ui';
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
  onUpdateComment?: (commentId: number, content: string) => void;
  onBackHome: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
};

function getInitials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase().slice(0, 2);
}

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
  onUpdateComment,
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
  const loadingCommentKeys = Array.from(
    { length: 3 },
    (_, i) => `comment-skel-${String(i)}`,
  );

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState('');

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

      <section className="flex flex-col">
        {/* Post details block */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <Text as="h1" variant="headingAuth" className="text-primary">
                {title}
              </Text>
            </div>

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
          </div>

          <Text variant="bodyBase" className="text-secondary font-normal">
            {content}
          </Text>

          <div className="flex h-5 items-center gap-4">
            <div className="flex h-5 items-start">
              <Text as="span" variant="bodySm" className="text-secondary">
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
          <div className="mt-10 flex flex-col items-end gap-[11px]">
            <div className="h-[218px] w-full rounded-lg border border-strong bg-overlay px-4 py-3">
              <textarea
                value={commentDraft}
                onChange={(event) => {
                  onCommentDraftChange(event.target.value);
                }}
                className="h-full w-full resize-none bg-transparent text-[14px] font-normal leading-[1.5] text-secondary outline-none placeholder:text-secondary"
                placeholder="Share your thoughts..."
                aria-invalid={Boolean(commentError)}
              />
            </div>

            {commentError ? (
              <Text variant="bodySmRegular" className="self-start text-danger">
                {commentError}
              </Text>
            ) : null}

            <Button
              type="button"
              variant="primary"
              className="h-[41px] w-[345px] px-5 py-2.5"
              onClick={onAddComment}
              disabled={isSubmittingComment || !commentDraft.trim()}
            >
              {isSubmittingComment ? 'Adding comment...' : 'Add comment'}
            </Button>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-3 rounded-lg border border-dashed border-default bg-overlay px-5 py-4">
            <Text variant="bodyBase" className="text-secondary font-normal">
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
        <section className="mt-5 space-y-10">
          <div className="flex items-center gap-[6px] text-[24px] font-bold leading-[1.5] tracking-[-0.24px] text-secondary">
            <h2>Comments</h2>
            <span>({totalComments})</span>
          </div>

          {isCommentsLoading ? (
            <div className="flex flex-col">
              {loadingCommentKeys.map((key) => (
                <div
                  key={key}
                  className="flex flex-col gap-4 border-t border-default py-6 md:flex-row md:items-start md:justify-between"
                >
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton variant="avatar" className="h-12 w-12" />
                      <div className="flex flex-col gap-[6px]">
                        <Skeleton className="h-4 w-32 rounded-[999px]" />
                        <Skeleton className="h-3 w-20 rounded-[999px]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full max-w-[720px] rounded-[999px]" />
                      <Skeleton className="h-3 w-full max-w-[560px] rounded-[999px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="flex flex-col">
              {commentList.map((comment) => {
                const initials = getInitials(comment.authorName);

                const canManageComment =
                  Boolean(currentUserName) &&
                  (isAdmin || comment.authorName === currentUserName);

                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className="group flex flex-col gap-4 border-t border-default py-6 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="flex flex-1 flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c3c3c2]">
                          <span className="text-[16px] font-medium leading-[16px] text-[#222220]">
                            {initials}
                          </span>
                        </div>
                        <div className="flex flex-col gap-[6px]">
                          <Text className="text-[16px] font-semibold leading-[16px] text-[color:var(--color-primary-900)]">
                            {comment.authorName}
                          </Text>
                          <Text className="text-[14px] font-normal leading-[14px] text-secondary">
                            {getCommentTimeLabel(comment.createdAt)}
                          </Text>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col gap-4">
                          <div className="w-full max-w-[421px]">
                            <TextField
                              aria-label="Edit comment"
                              value={editingDraft}
                              onChange={(event) => {
                                setEditingDraft(event.target.value);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                  setEditingCommentId(null);
                                  setEditingDraft('');
                                  return;
                                }

                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  if (!editingDraft.trim()) return;
                                  onUpdateComment?.(
                                    comment.id,
                                    editingDraft.trim(),
                                  );
                                  setEditingCommentId(null);
                                  setEditingDraft('');
                                }
                              }}
                              className="text-secondary"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="primary"
                            className="w-[136px]"
                            disabled={
                              isSubmittingComment || !editingDraft.trim()
                            }
                            onClick={() => {
                              if (!editingDraft.trim()) return;
                              onUpdateComment?.(
                                comment.id,
                                editingDraft.trim(),
                              );
                              setEditingCommentId(null);
                              setEditingDraft('');
                            }}
                          >
                            Save Changes
                          </Button>
                        </div>
                      ) : (
                        <Text
                          variant="bodyBase"
                          className="text-secondary font-normal"
                        >
                          {comment.content}
                        </Text>
                      )}
                    </div>

                    {canManageComment && !isEditing ? (
                      <div className="mt-2 flex items-center gap-4 md:mt-0">
                        <button
                          type="button"
                          aria-label="Edit comment"
                          className="inline-flex h-6 w-6 items-center justify-center"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingDraft(comment.content);
                          }}
                        >
                          <img src={penIcon} alt="" className="h-5 w-5" />
                        </button>
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
