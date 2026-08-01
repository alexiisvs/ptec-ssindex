import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ApiError, createApiClient, publicApi } from "../api/client";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { AuthContext, type AuthContextValue } from "./authContextValue";

function sessionUsername(session: Session): string | null {
  const metadata: unknown = session.user.user_metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const username = (metadata as Record<string, unknown>).username;
  return typeof username === "string" ? username : null;
}

async function ensureProfile(session: Session): Promise<void> {
  const api = createApiClient(session.access_token);
  try {
    await api.getProfile();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const username = sessionUsername(session);
    if (!username) {
      throw new Error("Tu cuenta no tiene un username válido.");
    }
    await api.saveProfile(username);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      authenticating,
      session,
      user: session?.user ?? null,
      async signIn(email, password) {
        if (!supabase) throw new Error("Supabase no está configurado.");
        setAuthenticating(true);
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          try {
            await ensureProfile(data.session);
          } catch (profileError) {
            await supabase.auth.signOut();
            throw profileError;
          }
        } finally {
          setAuthenticating(false);
        }
      },
      async signUp({ email, password, username }) {
        if (!supabase) throw new Error("Supabase no está configurado.");
        setAuthenticating(true);
        try {
          const availability = await publicApi.usernameAvailability(username);
          if (!availability.available) {
            throw new ApiError(
              409,
              "username_taken",
              "Username is already in use",
            );
          }
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } },
          });
          if (error) throw error;
          if (data.session) {
            try {
              await createApiClient(data.session.access_token).saveProfile(
                username,
              );
            } catch (profileError) {
              await supabase.auth.signOut();
              throw profileError;
            }
          }

          return { requiresEmailConfirmation: data.session === null };
        } finally {
          setAuthenticating(false);
        }
      },
      async signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [authenticating, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
