import {
  adminAddress,
  adminFromAddress,
  fromAddress,
  isEmailEnabled,
  replyToAddress,
  resendClient,
} from "./client";

/**
 * El único lugar por donde salen los correos.
 *
 * Dos reglas que valen para todos los llamadores:
 *
 * 1. **Nunca lanza.** Un correo es un efecto secundario de algo más importante
 *    —una compra, un cambio de estado—, y si Resend está caído la compra tiene
 *    que completarse igual. Devuelve si pudo o no, y el que llama decide si le
 *    importa (normalmente, no).
 * 2. **Siempre con clave de idempotencia.** Una Server Action se puede reejecutar
 *    y un webhook de Mercado Pago llega varias veces por el mismo pago. Sin la
 *    clave, el cliente recibe el mismo aviso tres veces. Resend la respeta
 *    durante 24 horas: mismo `idempotencyKey` con el mismo contenido devuelve la
 *    respuesta original sin volver a enviar.
 * 3. **Fuera de producción no le escribe a nadie de verdad.** Ver
 *    `resolveRecipient`.
 */

/**
 * A quién se le manda realmente.
 *
 * La clave de Resend está en los tres entornos, así que probar una compra desde
 * una máquina de desarrollo o desde un preview alcanzaría para mandarle un
 * correo real a la dirección que se haya tipeado — que puede ser la de un
 * cliente. Por eso solo producción le escribe al destinatario de verdad.
 *
 * En cualquier otro entorno el mensaje se desvía a la casilla interna y el
 * asunto lo dice, para que nadie confunda una prueba con un envío real. Si no
 * hay casilla interna configurada no se manda nada: quedarse sin la prueba es
 * preferible a escribirle a un cliente desde un entorno que no es el productivo.
 *
 * El entorno entra además en la clave de idempotencia. Sin eso habría un
 * problema silencioso: desarrollo y producción comparten la misma base, así que
 * el pedido `X` tiene el mismo id en los dos. Una prueba local de
 * `pedido-confirmado/X` dejaría esa clave usada, y el envío real de las
 * siguientes 24 horas volvería con un 409 en vez de llegarle al cliente.
 */
function resolveRecipient(
  to: string,
): { to: string; subjectPrefix: string; keyPrefix: string } | null {
  if (process.env.VERCEL_ENV === "production") {
    return { to, subjectPrefix: "", keyPrefix: "" };
  }

  const entorno = process.env.VERCEL_ENV ?? "local";
  const desvio = adminAddress();
  if (!desvio) return null;

  return { to: desvio, subjectPrefix: `[${entorno} → ${to}] `, keyPrefix: `${entorno}-` };
}

export type SendResult = { sent: boolean; id?: string; reason?: string };

type SendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** `<tipo-de-evento>/<id>`, p. ej. `pedido-confirmado/clx123`. */
  idempotencyKey: string;
  /** Los avisos internos usan otro remitente. */
  audience?: "customer" | "admin";
};

export async function sendEmail(input: SendInput): Promise<SendResult> {
  if (!isEmailEnabled()) {
    return { sent: false, reason: "email_disabled" };
  }
  if (!input.to) {
    return { sent: false, reason: "no_recipient" };
  }

  const destino = resolveRecipient(input.to);
  if (!destino) {
    console.info(`[email] omitido fuera de producción: "${input.subject}" para ${input.to}`);
    return { sent: false, reason: "non_production_no_redirect" };
  }

  const isAdmin = input.audience === "admin";

  try {
    // El SDK de Resend **no lanza excepciones**: devuelve `{ data, error }`.
    // Envolverlo en try/catch y no mirar `error` es el error clásico, así que
    // acá se hacen las dos cosas: el catch es para fallas de red.
    const { data, error } = await resendClient().emails.send(
      {
        from: isAdmin ? adminFromAddress() : fromAddress(),
        to: [destino.to],
        subject: `${destino.subjectPrefix}${input.subject}`,
        html: input.html,
        text: input.text,
        ...(replyToAddress() ? { replyTo: replyToAddress() } : {}),
      },
      { idempotencyKey: `${destino.keyPrefix}${input.idempotencyKey}` },
    );

    if (error) {
      console.error("[email] Resend rechazó el envío", {
        to: input.to,
        subject: input.subject,
        error: error.message,
      });
      return { sent: false, reason: error.message };
    }

    return { sent: true, id: data?.id };
  } catch (cause) {
    console.error("[email] no se pudo contactar a Resend", {
      to: input.to,
      subject: input.subject,
      cause,
    });
    return { sent: false, reason: "network_error" };
  }
}

/** Atajo para los avisos internos, que siempre van a la misma dirección. */
export async function sendAdminEmail(
  input: Omit<SendInput, "to" | "audience">,
): Promise<SendResult> {
  const to = adminAddress();
  if (!to) return { sent: false, reason: "no_admin_address" };
  return sendEmail({ ...input, to, audience: "admin" });
}
