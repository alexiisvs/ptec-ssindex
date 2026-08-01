import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { authErrorMessage } from "../auth/authErrors";
import { registerSchema, type RegisterValues } from "../auth/authSchemas";
import { useAuth } from "../auth/useAuth";
import { AuthShell } from "../components/AuthShell";
import { PasswordField } from "../components/PasswordField";

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const submit = handleSubmit(async ({ email, password, username }) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const result = await signUp({ email, password, username });
      if (result.requiresEmailConfirmation) {
        setSuccessMessage(
          "Cuenta creada. Revisa tu correo para confirmar el acceso.",
        );
      } else {
        void navigate("/app", { replace: true });
      }
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  });

  return (
    <AuthShell>
      <div className="auth-heading">
        <h1>Crear cuenta</h1>
        <p>Regístrate con correo, contraseña y username.</p>
      </div>

      <form onSubmit={(event) => void submit(event)} noValidate>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            {...register("username")}
          />
          {errors.username && (
            <span className="field-error">{errors.username.message}</span>
          )}
        </div>

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
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <span className="field-error">{errors.password.message}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="passwordConfirmation">Confirmar contraseña</label>
          <PasswordField
            id="passwordConfirmation"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.passwordConfirmation)}
            {...register("passwordConfirmation")}
          />
          {errors.passwordConfirmation && (
            <span className="field-error">
              {errors.passwordConfirmation.message}
            </span>
          )}
        </div>

        {formError && (
          <div className="form-alert" role="alert">
            {formError}
          </div>
        )}
        {successMessage && (
          <div className="form-success" role="status">
            {successMessage}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          <UserPlus size={18} />
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
