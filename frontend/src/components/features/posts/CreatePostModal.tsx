import type { Category } from '@/types/category';
import {
  PostFormModal,
  type PostFormModalValues,
} from '@/components/features/posts/PostFormModal';

export type CreatePostModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (values: PostFormModalValues) => Promise<void> | void;
};

export function CreatePostModal({
  isOpen,
  isSubmitting = false,
  categories,
  onClose,
  onSubmit,
}: Readonly<CreatePostModalProps>) {
  return (
    <PostFormModal
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      categories={categories}
      titleLabel="Create New Post"
      submitLabel="Create Post"
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
