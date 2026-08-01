import { Cat } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-brand">
        <header className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Cat size={24} strokeWidth={2} />
          </span>
          <div>
            <strong id="auth-brand">SSCatFacts</strong>
            <span>Tu colección de datos felinos</span>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
