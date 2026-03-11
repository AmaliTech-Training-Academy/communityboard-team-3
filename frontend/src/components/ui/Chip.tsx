import type { HTMLAttributes, ReactNode } from 'react';

export type ChipVariant = 'event' | 'default';

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: ChipVariant;
  children: ReactNode;
};

export function Chip({
  variant = 'event',
  className,
  children,
  ...props
}: ChipProps) {
  const variantClassName =
    variant === 'event'
      ? 'bg-[color:var(--chip-event-bg)] text-[color:var(--chip-event-text)] border-[color:var(--chip-event-border)]'
      : 'bg-surface text-[color:var(--chip-event-text)] border-[color:var(--chip-event-border)]';

  const chipClassName = [
    'inline-flex items-center justify-center whitespace-nowrap',
    'rounded-[var(--radius-md)] border px-3 py-0.5 text-body-sm',
    variantClassName,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span {...props} className={chipClassName}>
      {children}
    </span>
  );
}
