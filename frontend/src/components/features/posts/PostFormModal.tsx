import { useEffect, useState } from 'react';
import { Button, Text } from '@/components/ui';
import closeIcon from '@/assets/x.svg';
import chevronRightIcon from '@/assets/chevron-right.svg';
import type { Category } from '@/types/category';

type PostFormValues = {
  title: string;
  content: string;
  categoryId: number | '';
};

type PostFormErrors = {
  title?: string;
  content?: string;
  category?: string;
};

export type PostFormModalValues = {
  title: string;
  content: string;
  categoryId: number | null;
};

export type PostFormModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  categories: Category[];
  titleLabel: string;
  submitLabel: string;
  initialValues?: PostFormModalValues;
  onClose: () => void;
  onSubmit: (values: PostFormModalValues) => Promise<void> | void;
};

export function PostFormModal({
  isOpen,
  isSubmitting = false,
  categories,
  titleLabel,
  submitLabel,
  initialValues,
  onClose,
  onSubmit,
}: Readonly<PostFormModalProps>) {
  const [values, setValues] = useState<PostFormValues>({
    title: '',
    content: '',
    categoryId: '',
  });

  const [errors, setErrors] = useState<PostFormErrors>({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialValues) {
      setValues({
        title: initialValues.title,
        content: initialValues.content,
        categoryId:
          typeof initialValues.categoryId === 'number'
            ? initialValues.categoryId
            : '',
      });
    } else {
      setValues({
        title: '',
        content: '',
        categoryId: '',
      });
    }
    setErrors({});
    setIsCategoryOpen(false);
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleChange =
    (field: keyof PostFormValues) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const next = {
        ...values,
        [field]: event.target.value,
      };
      setValues(next);
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    };

  const handleSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const nextErrors: PostFormErrors = {};

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
    if (hasErrors) {
      return;
    }

    await onSubmit({
      title: values.title.trim(),
      content: values.content.trim(),
      categoryId:
        typeof values.categoryId === 'number' ? values.categoryId : null,
    });
  };

  const disableForm = isSubmitting;

  const selectedCategoryLabel =
    typeof values.categoryId === 'number'
      ? categories.find((category) => category.id === values.categoryId)?.name
      : '';

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[384px] rounded-lg border border-default bg-surface px-5 py-6 shadow-lg md:max-w-[560px] md:px-6">
        <div className="flex items-start justify-between gap-4 pb-4">
          <Text
            as="h2"
            variant="bodyBase"
            className="text-primary text-xl font-semibold leading-8"
          >
            {titleLabel}
          </Text>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded-button hover:bg-overlay"
            aria-label="Close post dialog"
            disabled={disableForm}
          >
            <img src={closeIcon} alt="" className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor="post-title"
              className="block text-body-sm text-primary"
            >
              Post Title
            </label>
            <div className="input-token flex items-center gap-[10px]">
              <input
                id="post-title"
                type="text"
                className="w-full bg-transparent text-body-sm-regular text-primary outline-none placeholder:text-muted"
                placeholder="Enter a clear, descriptive title"
                value={values.title}
                onChange={handleChange('title')}
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
              htmlFor="post-category"
              className="block text-body-sm text-primary"
            >
              Category
            </label>
            <div className="relative" id="post-category">
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
                    className={`h-4 w-4 transition-transform ${isCategoryOpen ? '-rotate-90' : 'rotate-90'}`}
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
              <p className="text-body-sm-regular text-danger">
                {errors.category}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="post-content"
              className="block text-body-sm text-primary"
            >
              Content
            </label>
            <div className="rounded-lg border border-default bg-overlay px-4 py-3">
              <textarea
                id="post-content"
                className="h-40 w-full resize-none bg-transparent text-body-sm-regular text-secondary outline-none"
                placeholder="Share the details of your post..."
                value={values.content}
                onChange={handleChange('content')}
                disabled={disableForm}
                aria-invalid={Boolean(errors.content)}
              />
            </div>
            {errors.content ? (
              <p className="text-body-sm-regular text-danger">
                {errors.content}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
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
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
