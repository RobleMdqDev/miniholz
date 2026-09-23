"use server";

import { randomUUID } from "node:crypto";
import { sendContactMessage } from "@/lib/email/contact";
import { isEmailEnabled } from "@/lib/email/client";
import {
  CONTACT_SUBJECT_LABELS,
  contactSchema,
  type ContactInput,
} from "@/lib/validations/contact";

export type ContactResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * La consulta del formulario de /contacto.
 *
 * A diferencia del resto de los correos de la tienda, acá el envío **sí** es el
 * resultado que espera la persona: si falla, no se puede responder "listo". Por
 * eso este es el único lugar donde un correo fallido se convierte en un error
 * visible en pantalla, con la salida por WhatsApp a mano.
 */
export async function sendContactForm(input: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (!isEmailEnabled()) {
    return {
      ok: false,
      error: "El formulario no está disponible en este momento. Escribinos por WhatsApp.",
    };
  }

  const data = parsed.data;
  const result = await sendContactMessage({
    // Un id por envío: dos consultas distintas no comparten clave de
    // idempotencia, pero un doble click sobre el mismo envío tampoco duplica,
    // porque el id se genera una sola vez por invocación.
    id: randomUUID(),
    subject: CONTACT_SUBJECT_LABELS[data.subject],
    name: data.name,
    email: data.email,
    orderNumber: data.orderNumber,
    message: data.message,
  });

  if (!result.sent) {
    return {
      ok: false,
      error: "No pudimos enviar tu mensaje. Probá por WhatsApp y te respondemos igual.",
    };
  }

  return { ok: true };
}
