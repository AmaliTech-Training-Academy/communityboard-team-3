import type { Category } from '@/types/category';
import {
  PostFormModal,
  type PostFormModalValues,
} from '@/components/features/posts/PostFormModal';

export type EditPostModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  categories: Category[];
  initialValues: PostFormModalValues;
  onClose: () => void;
  onSubmit: (values: PostFormModalValues) => Promise<void> | void;
};

export function EditPostModal({
  isOpen,
  isSubmitting = false,
  categories,
  initialValues,
  onClose,
  onSubmit,
}: Readonly<EditPostModalProps>) {
  return (
    <PostFormModal
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      categories={categories}
      titleLabel="Edit Post"
      submitLabel="Save changes"
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
