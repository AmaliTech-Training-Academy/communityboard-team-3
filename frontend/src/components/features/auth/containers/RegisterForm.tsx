import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
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
  registerSchema,
  type RegisterSchema,
} from '@/components/features/auth/schemas';
import { useAuth } from '@/hooks/useAuth';

export function RegisterForm() {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: RegisterSchema) => {
    try {
      await registerUser({
        name: values.fullName,
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
      title="Join the Community"
      subtitle="Create an account to get started"
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
            label="Full Name"
            placeholder="e.g., John Doe"
            leftIcon={<User className="h-4 w-4" />}
            error={form.formState.errors.fullName?.message}
            {...form.register('fullName')}
          />
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
            helperText="Minimum of 6 characters including special characters"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
          <AuthTextField
            label="Confirm Password"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            placeholder="Enter password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              isConfirmPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )
            }
            onRightIconClick={() => {
              setIsConfirmPasswordVisible((prev) => !prev);
            }}
            rightIconAriaLabel={
              isConfirmPasswordVisible
                ? 'Hide confirm password'
                : 'Show confirm password'
            }
            error={form.formState.errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
        </div>

        <div className="flex flex-col gap-5">
          <AuthSubmitButton type="submit" loading={isLoading}>
            Register
          </AuthSubmitButton>
          <AuthSwitchLink
            prompt="Already have an account?"
            to="/login"
            cta="Log in"
          />
        </div>
      </form>
    </AuthCard>
  );
}
