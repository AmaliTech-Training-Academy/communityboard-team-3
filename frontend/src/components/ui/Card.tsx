import type { HTMLAttributes, ReactNode } from 'react';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  const cardClassName = [
    'rounded-card bg-surface border border-default',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div {...props} className={cardClassName}>
      {children}
    </div>
  );
}
