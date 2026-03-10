import type { HTMLAttributes } from 'react';

export type SkeletonVariant = 'text' | 'avatar' | 'card';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Controls the base shape of the skeleton.
   *
   * - "text": single line of text
   * - "avatar": circular avatar placeholder
   * - "card": generic rectangular block
   */
  variant?: SkeletonVariant;
};

/**
 * Generic skeleton building block.
 *
 * This component is intentionally low-level: it provides simple
 * shapes that can be composed into more specific skeleton layouts
 * (e.g. "PostCardSkeleton") once those features exist.
 */
export function Skeleton({
  variant = 'text',
  className,
  ...props
}: SkeletonProps) {
  const baseClassName =
    'animate-pulse bg-overlay/60 dark:bg-overlay/40 inline-block';

  const variantClassName = (() => {
    switch (variant) {
      case 'avatar':
        return 'h-10 w-10 rounded-full';
      case 'card':
        return 'h-24 w-full rounded-card';
      case 'text':
      default:
        return 'h-3 w-24 rounded-[999px]';
    }
  })();

  const skeletonClassName = [baseClassName, variantClassName, className]
    .filter(Boolean)
    .join(' ');

  return <div {...props} className={skeletonClassName} />;
}

