import { z } from "zod";

const requiredText = (field: string, max = 80) =>
  z
    .string()
    .trim()
    .min(2, { error: `Completá ${field}.` })
    .max(max, { error: `${field} es demasiado largo.` });

export const shippingAddressSchema = z.object({
  fullName: requiredText("el nombre y apellido"),
  phone: z
    .string()
    .trim()
    .min(6, { error: "Completá un teléfono de contacto." })
    .max(30, { error: "El teléfono es demasiado largo." }),
  street: requiredText("la calle"),
  number: z
    .string()
    .trim()
    .min(1, { error: "Completá la altura." })
    .max(20, { error: "La altura es demasiado larga." }),
  city: requiredText("la localidad"),
  province: requiredText("la provincia"),
  postalCode: z
    .string()
    .trim()
    .min(3, { error: "Completá el código postal." })
    .max(12, { error: "El código postal es demasiado largo." }),
  notes: z.string().trim().max(500, { error: "La nota es demasiado larga." }).optional(),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

export const checkoutPaymentMethodSchema = z.enum(["MERCADOPAGO", "TRANSFER", "WHATSAPP"]);

export type CheckoutPaymentMethod = z.infer<typeof checkoutPaymentMethodSchema>;

export const checkoutSchema = shippingAddressSchema.extend({
  email: z.email({ error: "Ingresá un email válido." }).trim().toLowerCase(),
  paymentMethod: checkoutPaymentMethodSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
