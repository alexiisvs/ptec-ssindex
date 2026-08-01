import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { authErrorMessage } from "../auth/authErrors";
import { loginSchema, type LoginValues } from "../auth/authSchemas";
import {
  getLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
  type LoginRateLimit,
} from "../auth/loginRateLimit";
import { useAuth } from "../auth/useAuth";
import { AuthShell } from "../components/AuthShell";
import { PasswordField } from "../components/PasswordField";

function blockedMessage(blockedUntil: number, now: number): string {
  const seconds = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = String(seconds % 60).padStart(2, "0");
  return `Demasiados intentos. Intenta nuevamente en ${minutesPart}:${secondsPart}.`;
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [rateLimit, setRateLimit] = useState<LoginRateLimit>(() =>
    getLoginRateLimit(window.localStorage),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const blocked = Boolean(
    rateLimit.blockedUntil && rateLimit.blockedUntil > now,
  );
  const cooldownMessage = useMemo(
    () =>
      rateLimit.blockedUntil && blocked
        ? blockedMessage(rateLimit.blockedUntil, now)
        : null,
    [blocked, now, rateLimit.blockedUntil],
  );

  useEffect(() => {
    if (!blocked) return;
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setRateLimit(getLoginRateLimit(window.localStorage, currentTime));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [blocked]);

  const submit = handleSubmit(async ({ email, password }) => {
    if (blocked) return;
    setFormError(null);
    try {
      await signIn(email, password);
      resetLoginRateLimit(window.localStorage);
      void navigate("/app", { replace: true });
    } catch (error) {
      const nextRateLimit = recordFailedLogin(window.localStorage);
      setRateLimit(nextRateLimit);
      setNow(Date.now());
      setFormError(authErrorMessage(error));
    }
  });

  return (
    <AuthShell>
      <div className="auth-heading">
        <h1>Iniciar sesión</h1>
        <p>Accede a tus facts guardados.</p>
      </div>

      <form onSubmit={(event) => void submit(event)} noValidate>
        <div className="field">
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && (
            <span className="field-error">{errors.email.message}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <PasswordField
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <span className="field-error">{errors.password.message}</span>
          )}
        </div>

        {(cooldownMessage || formError) && (
          <div className="form-alert" role="alert">
            {cooldownMessage || formError}
            {!blocked && formError && rateLimit.remainingAttempts > 0 && (
              <span> Te quedan {rateLimit.remainingAttempts} intentos.</span>
            )}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting || blocked}
        >
          <LogIn size={18} />
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="auth-switch">
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </AuthShell>
  );
}
