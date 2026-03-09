import type { InputHTMLAttributes, ReactNode } from 'react';

type AuthTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
  rightIconAriaLabel?: string;
};

export function AuthTextField({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconClick,
  rightIconAriaLabel,
  className,
  ...inputProps
}: AuthTextFieldProps) {
  const hasError = Boolean(error);
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

  return (
    <div className="w-full space-y-2">
      <label className="block text-body-sm text-primary">{label}</label>

      <div className={fieldClassName}>
        {leftIcon ? (
          <span className="h-4 w-4 text-muted">{leftIcon}</span>
        ) : null}
        <input
          {...inputProps}
          className={inputClassName}
          aria-invalid={hasError}
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
        <p className="text-body-sm-regular text-danger">{error}</p>
      ) : helperText ? (
        <p className="text-body-sm-regular text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
}
