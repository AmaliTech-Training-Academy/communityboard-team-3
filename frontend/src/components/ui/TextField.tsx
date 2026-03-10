import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
  rightIconAriaLabel?: string;
};

export function TextField({
  id,
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconClick,
  rightIconAriaLabel,
  className,
  ...inputProps
}: TextFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  const hasError = Boolean(error);
  const messageId = `${inputId}-message`;

  const fieldClassName = [
    'flex items-center gap-[10px]',
    hasError ? 'input-token-error' : 'input-token',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClassName = [
    'w-full bg-transparent text-body-sm-regular outline-none placeholder:text-muted',
    hasError ? 'text-danger' : 'text-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const describedBy = error || helperText ? messageId : undefined;

  return (
    <div className="w-full space-y-2">
      <label htmlFor={inputId} className="block text-body-sm text-primary">
        {label}
      </label>

      <div className={fieldClassName}>
        {leftIcon ? (
          <span className="h-4 w-4 text-muted">{leftIcon}</span>
        ) : null}
        <input
          {...inputProps}
          id={inputId}
          className={inputClassName}
          aria-invalid={hasError}
          aria-describedby={describedBy}
        />
        {rightIcon ? (
          onRightIconClick ? (
            <button
              type="button"
              aria-label={rightIconAriaLabel ?? 'Toggle input visibility'}
              onClick={onRightIconClick}
              className="h-4 w-4 cursor-pointer text-muted"
            >
              {rightIcon}
            </button>
          ) : (
            <span className="h-4 w-4 text-muted">{rightIcon}</span>
          )
        ) : null}
      </div>

      {error ? (
        <p id={messageId} className="text-body-sm-regular text-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={messageId} className="text-body-sm-regular text-secondary">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
