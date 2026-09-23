import { Resend } from "resend";

/**
 * Configuración del envío de correo. Acá no se arma ningún mensaje: esto es
 * solo el cliente y las direcciones.
 *
 * ## Por qué el remitente es "no-responder" pero las respuestas sí llegan
 *
 * El dominio **no tiene casilla**: no hay registros MX en la raíz, así que un
 * mail enviado a `algo@miniholz.com.ar` rebota. Por eso el remitente avisa que
 * no se responde.
 *
 * Pero `Reply-To` no necesita que el dominio reciba: apunta a donde uno quiera.
 * Va al Gmail de la tienda, que ya existe. Así el remitente se ve profesional,
 * no hace falta contratar ninguna casilla, y al cliente que igual aprieta
 * "Responder" —porque siempre hay alguien que lo hace— el mensaje le llega en
 * vez de rebotarle.
 */

/** Sin API key no se manda nada y la app sigue andando igual. */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function resendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY.");
  return new Resend(key);
}

function emailDomain(): string {
  return process.env.RESEND_EMAIL_DOMAIN || "miniholz.com.ar";
}

/** Remitente de los correos que van al cliente. */
export function fromAddress(): string {
  return process.env.EMAIL_FROM || `MiniHolz <no-responder@${emailDomain()}>`;
}

/** Remitente de los avisos internos. Se distingue del anterior para poder
 *  filtrarlos en la bandeja sin mirar el asunto. */
export function adminFromAddress(): string {
  return process.env.EMAIL_ADMIN_FROM || `MiniHolz · Avisos <administracion@${emailDomain()}>`;
}

/** A dónde van las respuestas de los clientes y los avisos internos. */
export function replyToAddress(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined;
}

export function adminAddress(): string | undefined {
  return process.env.EMAIL_ADMIN || process.env.EMAIL_REPLY_TO || undefined;
}
