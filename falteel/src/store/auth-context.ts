// Caminho: ./src/store/auth-context.ts
import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
