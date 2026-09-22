import { z } from "zod";
import { slugField } from "@/lib/validations/slug";

export const postStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export type PostStatusInput = z.infer<typeof postStatusSchema>;

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: "Completá el título de la nota." })
    .max(140, { error: "El título es demasiado largo." }),
  slug: slugField(),
  /**
   * La bajada es obligatoria y corta a propósito: es lo que se ve en el listado
   * y lo que sale como descripción en el resultado de búsqueda. Dejarla salir
   * de las primeras líneas del cuerpo daba textos cortados a la mitad.
   */
  excerpt: z
    .string()
    .trim()
    .min(20, { error: "Escribí una bajada de al menos 20 caracteres." })
    .max(200, { error: "La bajada es demasiado larga: entran hasta 200 caracteres." }),
  body: z
    .string()
    .trim()
    .min(50, { error: "La nota necesita al menos 50 caracteres." })
    .max(40_000, { error: "La nota es demasiado larga." }),
  coverUrl: z.string().trim().max(600).nullable(),
  coverAlt: z.string().trim().max(160).nullable(),
  status: postStatusSchema,
});

export type PostInput = z.infer<typeof postSchema>;
