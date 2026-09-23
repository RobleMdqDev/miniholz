import { z } from "zod";

export const contactSubjectSchema = z.enum([
  "consulta",
  "pedido",
  "personalizado",
  "arrepentimiento",
]);

export type ContactSubject = z.infer<typeof contactSubjectSchema>;

export const CONTACT_SUBJECT_LABELS: Record<ContactSubject, string> = {
  consulta: "Una consulta",
  pedido: "Mi pedido",
  personalizado: "Un pedido especial",
  arrepentimiento: "Arrepentimiento de compra",
};

export const contactSchema = z.object({
  subject: contactSubjectSchema,
  name: z
    .string()
    .trim()
    .min(2, { error: "Contanos tu nombre." })
    .max(80, { error: "El nombre es demasiado largo." }),
  /**
   * Obligatorio, a diferencia del envío por WhatsApp: es la única forma de
   * contestarle a alguien que escribió por acá.
   */
  email: z.email({ error: "Ingresá un email válido." }).trim().toLowerCase(),
  orderNumber: z.string().trim().max(20).optional(),
  message: z
    .string()
    .trim()
    .min(10, { error: "Escribí un poco más para que podamos ayudarte." })
    .max(2000, { error: "El mensaje es demasiado largo." }),
});

export type ContactInput = z.infer<typeof contactSchema>;
