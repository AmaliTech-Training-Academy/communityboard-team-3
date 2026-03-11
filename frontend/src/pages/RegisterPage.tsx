import { RegisterForm } from '@/components/features/auth/containers/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="bg-page flex min-h-screen justify-center px-6 py-10">
      <div className="flex w-full max-w-[428px] items-start">
        <RegisterForm />
      </div>
    </main>
  );
}
