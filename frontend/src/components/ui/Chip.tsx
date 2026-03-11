import type { HTMLAttributes, ReactNode } from 'react';

export type ChipVariant =
  | 'event'
  | 'lostFound'
  | 'recommendation'
  | 'helpRequest'
  | 'default';

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: ChipVariant;
  children: ReactNode;
};

export function Chip({
  variant = 'default',
  className,
  children,
  ...props
}: ChipProps) {
  const variantClassName = (() => {
    switch (variant) {
      case 'event':
        return 'bg-[color:var(--chip-event-bg)] text-[color:var(--chip-event-text)] border-[color:var(--chip-event-border)]';
      case 'lostFound':
        return 'bg-[color:var(--chip-lost-found-bg)] text-[color:var(--chip-lost-found-text)] border-[color:var(--chip-lost-found-border)]';
      case 'recommendation':
        return 'bg-[color:var(--chip-recommendation-bg)] text-[color:var(--chip-recommendation-text)] border-[color:var(--chip-recommendation-border)]';
      case 'helpRequest':
        return 'bg-[color:var(--chip-help-request-bg)] text-[color:var(--chip-help-request-text)] border-[color:var(--chip-help-request-border)]';
      case 'default':
      default:
        return 'bg-surface text-[color:var(--color-text-primary)] border-[color:var(--color-border-default)]';
    }
  })();

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
