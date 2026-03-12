import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppShell } from '@/layout/AppShell';
import { Button, Text } from '@/components/ui';
import { PageLoader } from '@/components/ui/PageLoader';
import { useCategories } from '@/hooks/useCategories';
import { usePostQuery } from '@/hooks/usePostQuery';
import { postService } from '@/services/postService';
import { useToast } from '@/hooks/useToast';
import houseIcon from '@/assets/house.svg';
import chevronRightIcon from '@/assets/chevron-right.svg';
import type { Category } from '@/types/category';

type EditPostFormValues = {
  title: string;
  content: string;
  categoryId: number | '';
};

type EditPostFormErrors = {
  title?: string;
  content?: string;
  category?: string;
};

function EditPostForm({
  categories,
  isSubmitting,
  initialValues,
  onCancel,
  onSubmit,
}: Readonly<{
  categories: Category[];
  isSubmitting: boolean;
  initialValues: { title: string; content: string; categoryId: number | null };
  onCancel: () => void;
  onSubmit: (values: {
    title: string;
    content: string;
    categoryId: number | null;
  }) => Promise<void> | void;
}>) {
  const [values, setValues] = useState<EditPostFormValues>({
    title: initialValues.title,
    content: initialValues.content,
    categoryId: initialValues.categoryId ?? '',
  });
  const [errors, setErrors] = useState<EditPostFormErrors>({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    setValues({
      title: initialValues.title,
      content: initialValues.content,
      categoryId: initialValues.categoryId ?? '',
    });
    setErrors({});
    setIsCategoryOpen(false);
  }, [initialValues]);

  const disableForm = isSubmitting;

  const selectedCategoryLabel =
    typeof values.categoryId === 'number'
      ? categories.find((category) => category.id === values.categoryId)?.name
      : '';

  const handleSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const nextErrors: EditPostFormErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = 'Title is required.';
    }
    if (!values.categoryId) {
      nextErrors.category = 'Category is required.';
    }
    if (!values.content.trim()) {
      nextErrors.content = 'Content is required.';
    }

    setErrors(nextErrors);

    const hasErrors = Object.keys(nextErrors).length > 0;
    if (hasErrors) return;

    await onSubmit({
      title: values.title.trim(),
      content: values.content.trim(),
      categoryId:
        typeof values.categoryId === 'number' ? values.categoryId : null,
    });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="space-y-2">
        <label
          htmlFor="edit-post-title-page"
          className="block text-body-sm text-primary"
        >
          Post Title
        </label>
        <div className="input-token flex items-center gap-[10px]">
          <input
            id="edit-post-title-page"
            type="text"
            className="w-full bg-transparent text-body-sm-regular text-primary outline-none placeholder:text-muted"
            placeholder="Enter a clear, descriptive title"
            value={values.title}
            onChange={(event) => {
              const next = { ...values, title: event.target.value };
              setValues(next);
              setErrors((current) => ({ ...current, title: undefined }));
            }}
            disabled={disableForm}
            aria-invalid={Boolean(errors.title)}
          />
        </div>
        {errors.title ? (
          <p className="text-body-sm-regular text-danger">{errors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="edit-post-category-page"
          className="block text-body-sm text-primary"
        >
          Category
        </label>
        <div className="relative" id="edit-post-category-page">
          <button
            type="button"
            className="input-token flex w-full items-center justify-between gap-[10px] px-4 py-3 text-left"
            onClick={() => {
              if (disableForm) return;
              setIsCategoryOpen((previous) => !previous);
            }}
            disabled={disableForm}
            aria-haspopup="listbox"
            aria-expanded={isCategoryOpen}
          >
            <span className="text-body-sm-regular text-primary">
              {selectedCategoryLabel || 'Select'}
            </span>
            <span className="pointer-events-none h-4 w-4 text-muted">
              <img
                src={chevronRightIcon}
                alt=""
                className={`h-4 w-4 transition-transform ${
                  isCategoryOpen ? '-rotate-90' : 'rotate-90'
                }`}
              />
            </span>
          </button>

          {isCategoryOpen ? (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-default bg-surface py-1 shadow-md">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="flex w-full items-center px-4 py-2 text-left text-body-sm-regular text-primary hover:bg-overlay"
                  onClick={() => {
                    setValues((current) => ({
                      ...current,
                      categoryId: category.id,
                    }));
                    setErrors((current) => ({
                      ...current,
                      category: undefined,
                    }));
                    setIsCategoryOpen(false);
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {errors.category ? (
          <p className="text-body-sm-regular text-danger">{errors.category}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="edit-post-content-page"
          className="block text-body-sm text-primary"
        >
          Content
        </label>
        <div className="rounded-lg border border-default bg-overlay px-4 py-3">
          <textarea
            id="edit-post-content-page"
            className="h-40 w-full resize-none bg-transparent text-body-sm-regular text-secondary outline-none"
            placeholder="Share the details of your post..."
            value={values.content}
            onChange={(event) => {
              const next = { ...values, content: event.target.value };
              setValues(next);
              setErrors((current) => ({ ...current, content: undefined }));
            }}
            disabled={disableForm}
            aria-invalid={Boolean(errors.content)}
          />
        </div>
        {errors.content ? (
          <p className="text-body-sm-regular text-danger">{errors.content}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={disableForm}
          className="sm:w-[160px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={disableForm}
          className="sm:w-[160px]"
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}

export default function EditPostPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();

  const postId = useMemo(() => {
    if (!id) return null;
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [id]);

  const { data: post, isLoading: isPostLoading } = usePostQuery(postId);
  const { data: categories } = useCategories();
  const [isUpdating, setIsUpdating] = useState(false);

  if (isPostLoading) {
    return <PageLoader label="Loading post..." />;
  }

  if (!post || postId === null) {
    return (
      <AppShell>
        <Text variant="bodyBase" className="text-primary">
          Post not found.
        </Text>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="space-y-6">
        {/* Breadcrumb card */}
        <div className="inline-flex items-center gap-4 rounded-lg border border-default bg-page px-5 py-3">
          <button
            type="button"
            className="flex items-center gap-2 text-body-sm-regular text-primary"
            onClick={() => {
              void navigate(`/posts/${postId.toString()}`);
            }}
          >
            <img src={houseIcon} alt="" className="h-5 w-5" />
            <span>Post</span>
          </button>
          <img src={chevronRightIcon} alt="" className="h-5 w-5 text-muted" />
          <Text variant="bodySmRegular" className="text-primary">
            Edit Post
          </Text>
        </div>

        {/* Heading */}
        <Text
          as="h1"
          variant="bodyBase"
          className="text-primary text-xl font-semibold leading-8"
        >
          Edit Post
        </Text>

        {/* Form */}
        <EditPostForm
          categories={categories ?? []}
          isSubmitting={isUpdating}
          initialValues={{
            title: post.title,
            content: post.content,
            categoryId: post.categoryId,
          }}
          onCancel={() => {
            void navigate(`/posts/${postId.toString()}`);
          }}
          onSubmit={async (values) => {
            try {
              setIsUpdating(true);
              await postService.updatePost(postId, values);
              toast.success({ title: 'Post updated' });
              void navigate(`/posts/${postId.toString()}`);
            } catch {
              toast.error({
                title: 'Unable to update post',
                description: 'Please try again later.',
              });
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      </section>
    </AppShell>
  );
}
