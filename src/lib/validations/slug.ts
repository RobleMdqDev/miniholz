import { z } from "zod";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/slug";

/**
 * La validación de slug, en un solo lugar.
 *
 * Estaba escrita tres veces —producto, categoría y nota— con tres regex iguales
 * y tres largos distintos. Además de la duplicación, las tres validaban solo el
 * juego de caracteres y no la *forma*: `-percheros-`, `mesas--sillas` y `--`
 * pasaban las tres.
 */

/**
 * Nombres que no puede tomar el slug de un producto porque ya son un tramo de
 * ruta. Hoy `/productos/categoria/<slug>` es una ruta real, así que un producto
 * con slug `categoria` quedaría viviendo en `/productos/categoria` — una URL que
 * existe pero que nadie espera, y que se rompe sola si mañana esa sección crece.
 */
export const RESERVED_PRODUCT_SLUGS = ["categoria"] as const;

export function slugField(
  options: { max?: number; reserved?: readonly string[] } = {},
) {
  const max = options.max ?? SLUG_MAX_LENGTH;
  const reserved = options.reserved ?? [];

  return z
    .string()
    .trim()
    .min(2, { error: "Completá el slug." })
    .max(max, { error: `El slug no puede superar los ${max} caracteres.` })
    .regex(SLUG_PATTERN, {
      error:
        "Solo minúsculas, números y guiones simples, sin empezar ni terminar con guion.",
    })
    .refine((slug) => !reserved.includes(slug), {
      error: "Esa palabra está reservada por una sección del sitio. Elegí otra.",
    });
}
