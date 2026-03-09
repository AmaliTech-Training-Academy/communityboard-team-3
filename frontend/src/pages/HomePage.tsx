import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="bg-page min-h-screen p-6">
      <h1 className="text-heading-auth">Welcome</h1>
      <p className="text-body-base text-secondary">{user?.email}</p>

      <button
        type="button"
        onClick={logout}
        className="btn-primary-token text-body-sm mt-6"
      >
        Logout
      </button>
    </main>
  );
}
