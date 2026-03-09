import type { AuthContextValue } from '@/context';
import { useAuthContext } from '@/context';

export const useAuth = (): AuthContextValue => useAuthContext();
