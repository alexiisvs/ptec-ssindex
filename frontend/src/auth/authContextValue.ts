import type { Session, User } from "@supabase/supabase-js";
import { createContext } from "react";

export type SignUpInput = {
  email: string;
  password: string;
  username: string;
};

export type SignUpResult = {
  requiresEmailConfirmation: boolean;
};

export type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  authenticating: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
