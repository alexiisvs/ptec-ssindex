import { Cat, LogOut, UserRound } from "lucide-react";
import { useState } from "react";

import { authErrorMessage } from "../auth/authErrors";
import { useAuth } from "../auth/useAuth";

export function AccountPage() {
  const { user, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const username =
    typeof user?.user_metadata.username === "string"
      ? user.user_metadata.username
      : "Sin username";

  async function handleSignOut() {
    setError(null);
    try {
      await signOut();
    } catch (signOutError) {
      setError(authErrorMessage(signOutError));
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <Cat size={24} />
          <strong>SSCatFacts</strong>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void handleSignOut()}
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </header>
      <main className="account-page">
        <div className="section-heading">
          <UserRound size={24} />
          <div>
            <h1>Tu cuenta</h1>
            <p>Sesión administrada por Supabase.</p>
          </div>
        </div>
        <dl className="account-details">
          <div>
            <dt>Username</dt>
            <dd>{username}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{user?.email}</dd>
          </div>
        </dl>
        {error && <div className="form-alert">{error}</div>}
      </main>
    </div>
  );
}
