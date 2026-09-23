import { esc, renderEmail } from "./layout";
import { sendAdminEmail, type SendResult } from "./send";

/**
 * La consulta que alguien deja en /contacto, reenviada a la casilla interna.
 *
 * El mensaje lo escribe un desconocido, así que todo lo que entra se escapa
 * antes de meterlo en el HTML. No es paranoia: el destino es una bandeja real
 * que alguien va a abrir.
 */
export async function sendContactMessage(input: {
  /** Identificador del envío, para la clave de idempotencia. */
  id: string;
  subject: string;
  name: string;
  email: string;
  orderNumber?: string;
  message: string;
}): Promise<SendResult> {
  const lineas = [
    `<strong>${esc(input.name || "Sin nombre")}</strong> — ${esc(input.email)}`,
    input.orderNumber ? `Pedido n.º ${esc(input.orderNumber)}` : null,
  ].filter(Boolean) as string[];

  return sendAdminEmail({
    subject: `Consulta web: ${input.subject}`,
    idempotencyKey: `consulta-web/${input.id}`,
    html: renderEmail({
      heading: `Consulta desde el sitio`,
      body: [
        ...lineas,
        // `white-space: pre-wrap` conserva los saltos de línea que escribió la
        // persona sin que haya que convertirlos a <br> a mano.
        `<span style="display:block;margin-top:12px;padding:14px;background:#faf7f2;border-radius:10px;white-space:pre-wrap">${esc(input.message)}</span>`,
      ],
      footnote: `Para responder, escribí directamente a ${esc(input.email)}.`,
    }),
    text: [
      `Consulta desde el sitio — ${input.subject}`,
      "",
      `Nombre: ${input.name || "sin nombre"}`,
      `Mail: ${input.email}`,
      input.orderNumber ? `Pedido: ${input.orderNumber}` : "",
      "",
      input.message,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
