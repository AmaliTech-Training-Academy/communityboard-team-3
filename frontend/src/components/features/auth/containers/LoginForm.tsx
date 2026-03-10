import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AuthCard,
  AuthSubmitButton,
  AuthSwitchLink,
  AuthTextField,
} from '@/components/features/auth/components';
import pingLogo from '@/assets/ping-logo.svg';
import {
  loginSchema,
  type LoginSchema,
} from '@/components/features/auth/schemas';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: LoginSchema) => {
    try {
      await login({
        email: values.email,
        password: values.password,
      });

      void navigate('/');
    } catch {
      //
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue"
      logo={
        <img
          src={pingLogo}
          alt="Ping logo"
          className="h-full w-full object-contain"
        />
      }
    >
      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        className="gap-auth-section flex w-full flex-col"
      >
        <div className="flex flex-col gap-4">
          <AuthTextField
            label="Email"
            type="email"
            placeholder="your@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <AuthTextField
            label="Password"
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="Enter password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              isPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )
            }
            onRightIconClick={() => {
              setIsPasswordVisible((prev) => !prev);
            }}
            rightIconAriaLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
        </div>

        <div className="flex flex-col gap-5">
          <AuthSubmitButton type="submit" loading={isLoading}>
            Log in
          </AuthSubmitButton>
          <AuthSwitchLink
            prompt="Don’t have an account?"
            to="/register"
            cta="Register"
          />
        </div>
      </form>
    </AuthCard>
  );
}
