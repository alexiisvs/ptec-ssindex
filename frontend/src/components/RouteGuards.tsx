import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export function LoadingScreen() {
  return (
    <main className="status-page" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>Cargando sesión...</p>
    </main>
  );
}

export function ConfigurationScreen() {
  return (
    <main className="status-page">
      <div className="configuration-message">
        <h1>Falta configurar Supabase</h1>
        <p>
          Completa <code>VITE_SUPABASE_URL</code> y{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> en tu archivo <code>.env</code>.
        </p>
      </div>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!configured) return <ConfigurationScreen />;
  return session ? children : <Navigate to="/login" replace />;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!configured) return <ConfigurationScreen />;
  return session ? <Navigate to="/app" replace /> : children;
}
