import { AuthError } from "@supabase/supabase-js";

import { ApiError, apiErrorMessage } from "../api/client";

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return apiErrorMessage(error);
  if (!(error instanceof AuthError)) {
    return error instanceof Error
      ? error.message
      : "No se pudo completar la solicitud.";
  }

  if (error.status === 429)
    return "Demasiados intentos. Espera antes de volver a intentar.";
  if (error.message === "Invalid login credentials")
    return "Correo o contraseña incorrectos.";
  if (error.message === "Email not confirmed")
    return "Confirma tu correo antes de ingresar.";
  if (error.message.includes("already registered"))
    return "Ya existe una cuenta con este correo.";
  return "No se pudo completar la autenticación.";
}
