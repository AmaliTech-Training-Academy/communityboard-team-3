import { Link } from 'react-router';

type AuthSwitchLinkProps = {
  prompt: string;
  to: string;
  cta: string;
};

export function AuthSwitchLink({ prompt, to, cta }: AuthSwitchLinkProps) {
  return (
    <p className="text-body-sm text-secondary text-center">
      {prompt}{' '}
      <Link to={to} className="text-accent underline">
        {cta}
      </Link>
    </p>
  );
}
