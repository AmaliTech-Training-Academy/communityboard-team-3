import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type AuthSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function AuthSubmitButton({
  children,
  loading = false,
  disabled,
  className,
  ...props
}: AuthSubmitButtonProps) {
  const isDisabled = disabled || loading;
  const buttonClassName = [
    'btn-primary-token text-body-sm flex h-[41px] w-full items-center justify-center gap-2',
    'disabled:cursor-not-allowed disabled:opacity-60',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button {...props} disabled={isDisabled} className={buttonClassName}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
