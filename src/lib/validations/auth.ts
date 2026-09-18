import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email({ error: "Ingresá un email válido." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Ingresá tu contraseña." }),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Ingresá tu nombre (mínimo 2 caracteres)." })
      .max(80, { error: "El nombre es demasiado largo." }),
    email: z.email({ error: "Ingresá un email válido." }).trim().toLowerCase(),
    phone: z
      .string()
      .trim()
      .max(30, { error: "El teléfono es demasiado largo." })
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, { error: "La contraseña debe tener al menos 8 caracteres." })
      .max(72, { error: "La contraseña no puede superar los 72 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
