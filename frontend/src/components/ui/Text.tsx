import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

export type TextVariant =
  | 'bodySm'
  | 'bodySmRegular'
  | 'bodyBase'
  | 'cardTitle'
  | 'headingAuth';

type TextOwnProps = {
  variant?: TextVariant;
  className?: string;
  children: ReactNode;
};

type TextProps<C extends ElementType> = TextOwnProps & {
  as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof TextOwnProps | 'as' | 'children'>;

export function Text<C extends ElementType = 'p'>({
  as,
  variant = 'bodyBase',
  className,
  children,
  ...props
}: TextProps<C>) {
  const Component = as ?? 'p';

  const variantClassName = (() => {
    switch (variant) {
      case 'bodySm':
        return 'text-body-sm';
      case 'bodySmRegular':
        return 'text-body-sm-regular';
      case 'bodyBase':
        return 'text-body-base';
      case 'cardTitle':
        return 'text-card-title';
      case 'headingAuth':
        return 'text-heading-auth';
    }
  })();

  const textClassName = [variantClassName, className].filter(Boolean).join(' ');

  return (
    <Component {...props} className={textClassName}>
      {children}
    </Component>
  );
}
