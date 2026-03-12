import { Button, type ButtonProps } from '@/components/ui';

type AuthSubmitButtonProps = Omit<ButtonProps, 'variant' | 'fullWidth'> & {
  loading?: boolean;
};

export function AuthSubmitButton({
  loading = false,
  className,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button
      {...props}
      loading={loading}
      variant="primary"
      fullWidth
      className={className}
    />
  );
}
