import { z } from "zod";

const email = z.string().trim().email("Ingresa un correo válido.");
const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.");

const username = z
  .string()
  .trim()
  .min(3, "El username debe tener al menos 3 caracteres.")
  .max(30, "El username puede tener hasta 30 caracteres.")
  .regex(/^[A-Za-z0-9_]+$/, "Usa solo letras, números y guion bajo.");

export const loginSchema = z.object({
  email,
  password,
});

export const registerSchema = z
  .object({
    username,
    email,
    password,
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirmation"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

export const profileSchema = z.object({ username });
export type ProfileValues = z.infer<typeof profileSchema>;
