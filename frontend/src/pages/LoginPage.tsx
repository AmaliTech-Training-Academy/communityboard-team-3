import { LoginForm } from '@/components/features/auth/containers/LoginForm';

export default function LoginPage() {
  return (
    <main className="bg-page flex min-h-screen justify-center items-start md:items-center px-6 py-10 md:py-6">
      <div className="w-full max-w-[428px]">
        <LoginForm />
      </div>
    </main>
  );
}
