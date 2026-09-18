import { z } from "zod";

/** Los precios se escriben en pesos en el formulario y se guardan en centavos. */
export const priceInPesosSchema = z
  .number({ error: "Ingresá un precio válido." })
  .min(0, { error: "El precio no puede ser negativo." })
  .max(99_999_999, { error: "El precio es demasiado alto." });

export const variantSchema = z.object({
  /** Vacío en las variantes nuevas: lo asigna la base. */
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, { error: "La opción necesita un nombre." })
    .max(60, { error: "El nombre de la opción es demasiado largo." }),
  sku: z.string().trim().max(40).optional(),
  priceInPesos: priceInPesosSchema.nullable(),
  stock: z
    .number({ error: "Ingresá un stock válido." })
    .int({ error: "El stock tiene que ser un número entero." })
    .min(0, { error: "El stock no puede ser negativo." })
    .max(100_000),
});

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Completá el nombre del producto." })
      .max(120, { error: "El nombre es demasiado largo." }),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, {
        error: "El slug solo puede tener minúsculas, números y guiones.",
      })
      .min(2, { error: "Completá el slug." })
      .max(80),
    description: z
      .string()
      .trim()
      .min(10, { error: "Escribí una descripción de al menos 10 caracteres." })
      .max(4000),
    categoryId: z.string().nullable(),
    basePriceInPesos: priceInPesosSchema,
    compareAtPriceInPesos: priceInPesosSchema.nullable(),
    isActive: z.boolean(),
    personalizationLabel: z.string().trim().max(60).nullable(),
    personalizationMaxLength: z.number().int().min(1).max(200).nullable(),
    personalizationRequired: z.boolean(),
    variants: z.array(variantSchema).min(1, { error: "El producto necesita al menos una opción." }),
  })
  .refine(
    (data) =>
      data.compareAtPriceInPesos === null ||
      data.compareAtPriceInPesos > data.basePriceInPesos,
    {
      error: "El precio tachado tiene que ser mayor al precio de venta.",
      path: ["compareAtPriceInPesos"],
    },
  )
  .refine(
    (data) => new Set(data.variants.map((variant) => variant.name.toLowerCase())).size === data.variants.length,
    { error: "Hay dos opciones con el mismo nombre.", path: ["variants"] },
  )
  .refine((data) => !data.personalizationRequired || Boolean(data.personalizationLabel), {
    error: "Si la personalización es obligatoria, necesita una etiqueta.",
    path: ["personalizationLabel"],
  });

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(2, { error: "Completá el nombre de la categoría." })
    .max(60, { error: "El nombre es demasiado largo." }),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, { error: "El slug solo puede tener minúsculas, números y guiones." })
    .min(2)
    .max(60),
  position: z.number().int().min(0).max(999),
});

export const storeSettingsSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, {
      error: "Ingresá el número con código de país y sin símbolos, p. ej. 5491122334455.",
    }),
  bankAccountInfo: z
    .string()
    .trim()
    .max(600, { error: "El texto es demasiado largo." }),
  announcementText: z.string().trim().max(160).nullable(),
});
