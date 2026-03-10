import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

export type ToastProps = {
  variant: ToastVariant;
  title: string;
  description?: string;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
};

export function Toast({
  variant,
  title,
  description,
  action,
  onClose,
  className,
}: ToastProps) {
  const role = variant === 'error' ? 'alert' : 'status';

  const containerClassName = [
    // Match Figma toast layout: compact pill with subtle shadow
    'pointer-events-auto flex w-full max-w-[320px] items-center gap-[10px] p-4',
    'rounded-[var(--radius-md)] shadow-[var(--toast-shadow)]',
    variant === 'error'
      ? 'bg-danger-soft'
      : 'bg-[color:var(--toast-success-bg)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconWrapperClassName = [
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)]',
    variant === 'error'
      ? 'bg-[color:var(--form-error-border)] text-inverse'
      : 'bg-[color:var(--toast-success-icon)] text-inverse',
  ]
    .filter(Boolean)
    .join(' ');

  const titleClassName =
    variant === 'error'
      ? 'text-body-sm-regular text-danger'
      : 'text-body-sm-regular text-[color:var(--toast-success-text)]';

  const descriptionClassName =
    variant === 'error'
      ? 'text-body-sm-regular text-danger'
      : 'text-body-sm-regular text-[color:var(--toast-success-text)]';

  // Leading icon:
  // - success → check mark
  // - error → alert icon
  //
  // This makes the right-side "X" close button feel distinct,
  // so the user does not see "two cancel icons".
  const Icon = variant === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      role={role}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={containerClassName}
    >
      <div className={iconWrapperClassName}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className={titleClassName}>{title}</p>
        {description ? (
          <p className={descriptionClassName}>{description}</p>
        ) : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>

      {onClose ? (
        <button
          type="button"
          aria-label="Close notification"
          onClick={onClose}
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--toast-success-text)] hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export type ToastViewportProps = {
  children: ReactNode;
  className?: string;
};

export function ToastViewport({ children, className }: ToastViewportProps) {
  const viewportClassName = [
    'pointer-events-none fixed right-6 top-6 z-50 flex w-[calc(100%-48px)] flex-col gap-3 md:w-auto',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={viewportClassName}>{children}</div>;
}
