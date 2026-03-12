import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
  logo?: ReactNode;
};

export function AuthCard({
  title,
  subtitle,
  children,
  className,
  logo,
}: Readonly<AuthCardProps>) {
  const sectionClassName = [
    'w-full max-w-[428px] rounded-card bg-surface border-default px-6 py-6 md:border md:px-8',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={sectionClassName} aria-labelledby="auth-title">
      <div className="mx-auto flex w-full max-w-[364px] flex-col items-center gap-12">
        {logo ? <div className="h-[38px] w-[100px]">{logo}</div> : null}

        <header className="w-[311px] text-center">
          <h1 id="auth-title" className="text-heading-auth">
            {title}
          </h1>
          <p className="text-body-base text-secondary">{subtitle}</p>
        </header>

        {children}
      </div>
    </section>
  );
}
