import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;

  const baseClassName = [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'disabled:cursor-not-allowed disabled:opacity-60',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]',
    fullWidth ? 'w-full' : null,
  ]
    .filter(Boolean)
    .join(' ');

  const sizeClassName =
    size === 'sm' ? 'h-9 text-body-sm px-4' : 'h-[41px] text-body-sm';

  const variantClassName = (() => {
    switch (variant) {
      case 'primary':
        return 'btn-primary-token';
      case 'secondary':
        return [
          'rounded-button border border-default bg-surface text-primary',
          'hover:bg-overlay',
        ].join(' ');
      case 'ghost':
        return [
          'rounded-button bg-transparent text-primary',
          'hover:bg-overlay',
        ]
          .filter(Boolean)
          .join(' ');
      case 'link':
        return 'bg-transparent p-0 text-accent underline';
    }
  })();

  const buttonClassName = [
    baseClassName,
    sizeClassName,
    variantClassName,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      className={buttonClassName}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {leftIcon ? <span className="h-4 w-4">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="h-4 w-4">{rightIcon}</span> : null}
    </button>
  );
}
