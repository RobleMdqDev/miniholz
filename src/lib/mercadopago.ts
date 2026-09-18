import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  MPNotFoundError,
  Payment,
  Preference,
  WebhookSignatureValidator,
} from "mercadopago";
import type { PaymentStatus } from "@/generated/prisma/enums";

/**
 * Capa fina sobre la API de Mercado Pago (Checkout Pro). Acá no se toca la
 * base: la sincronización de un pago con su pedido vive en
 * `mercadopago-orders.ts`, para que este archivo se pueda leer (y probar)
 * como lo que es, un cliente HTTP.
 */

/** Ventana de tolerancia del timestamp de la firma; acota los replays. */
const SIGNATURE_TOLERANCE_SECONDS = 300;

export function isMercadoPagoEnabled(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN: el pago con tarjeta está sin configurar.");
  }
  return token;
}

/** El cliente se arma por llamada: es un objeto de configuración, no un pool. */
function client(): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken: accessToken(),
    options: { timeout: 10_000 },
  });
}

export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Mercado Pago rechaza `notification_url` y `auto_return` cuando apuntan a una
 * URL que no puede alcanzar. En desarrollo la base es `localhost`, así que esos
 * dos campos se omiten y el pago se sincroniza al volver de MP (ver
 * `syncMercadoPagoPayment`), que es lo que permite probar sin túnel.
 */
export function isPubliclyReachable(): boolean {
  try {
    const { hostname } = new URL(getBaseUrl());
    return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "[::1]";
  } catch {
    return false;
  }
}

/** MP trabaja en unidades de moneda; la base guarda centavos. */
function toAmount(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Categoría de los ítems, de la lista cerrada de Mercado Pago
 * (`GET https://api.mercadopago.com/item_categories`). Es genérica: las cinco
 * categorías de la tienda —mesas y sillas, percheros, guardado, organización,
 * decoración— caen todas en "Home & Garden", así que va una constante y no un
 * mapa que devolvería siempre lo mismo. Si algún día entra un rubro que no sea
 * mobiliario, acá se decide.
 */
const ITEM_CATEGORY_ID = "home";

/**
 * Mercado Pago pondera nombre y apellido por separado para prevención de
 * fraude. El checkout pide un solo campo, así que se parte por el primer
 * espacio: lo demás es apellido. Con un solo token no se manda apellido, que es
 * preferible a mandar uno inventado.
 */
function splitFullName(fullName: string): { name: string; surname?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { name: fullName.trim() };
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

export type PreferenceOrder = {
  id: string;
  orderNumber: number;
  shippingCost: number;
  items: {
    id: string;
    productName: string;
    variantName: string | null;
    personalizationText: string;
    unitPrice: number;
    quantity: number;
  }[];
  payer: {
    name: string;
    email: string;
    phone: string;
    /** Del snapshot de envío del pedido. `null` si no se pudo interpretar. */
    address: { streetName: string; streetNumber: string; zipCode: string } | null;
  };
};

export type CheckoutPreference = { preferenceId: string; initPoint: string };

export async function createOrderPreference(order: PreferenceOrder): Promise<CheckoutPreference> {
  const baseUrl = getBaseUrl();
  const publicUrls = isPubliclyReachable();
  const payerName = splitFullName(order.payer.name);

  const response = await new Preference(client()).create({
    body: {
      items: order.items.map((item) => ({
        id: item.id,
        title: [item.productName, item.variantName].filter(Boolean).join(" · "),
        // Siempre viaja una descripción: sin ella, el resumen del pago le llega
        // al comprador con el título pelado.
        description: item.personalizationText
          ? `Grabado: ${item.personalizationText}`
          : (item.variantName ?? item.productName),
        category_id: ITEM_CATEGORY_ID,
        quantity: item.quantity,
        currency_id: "ARS",
        unit_price: toAmount(item.unitPrice),
      })),
      // El envío se cotiza después de la compra: solo viaja si el admin ya lo
      // cargó en el pedido (caso de un pago retomado más tarde).
      ...(order.shippingCost > 0
        ? { shipments: { cost: toAmount(order.shippingCost), mode: "not_specified" } }
        : {}),
      payer: {
        ...payerName,
        email: order.payer.email,
        phone: { number: order.payer.phone },
        ...(order.payer.address
          ? {
              address: {
                zip_code: order.payer.address.zipCode,
                street_name: order.payer.address.streetName,
                street_number: order.payer.address.streetNumber,
              },
            }
          : {}),
      },
      // La referencia externa es lo que ata el pago al pedido en el webhook.
      external_reference: order.id,
      metadata: { order_id: order.id, order_number: order.orderNumber },
      statement_descriptor: "MINIHOLZ",
      back_urls: {
        success: `${baseUrl}/checkout/exito`,
        pending: `${baseUrl}/checkout/pendiente`,
        failure: `${baseUrl}/checkout/fallo`,
      },
      ...(publicUrls
        ? {
            auto_return: "approved",
            notification_url: `${baseUrl}/api/mercadopago/webhook`,
          }
        : {}),
    },
    // Reintentar el alta del pedido no debe generar dos preferencias. El total
    // entra en la clave para que un envío cargado después sí arme una nueva.
    requestOptions: { idempotencyKey: `order-${order.id}-${order.shippingCost}` },
  });

  const preferenceId = response.id;
  const initPoint = response.init_point;
  if (!preferenceId || !initPoint) {
    throw new Error("Mercado Pago no devolvió el link de pago.");
  }

  return { preferenceId, initPoint };
}

export async function getPreferenceInitPoint(preferenceId: string): Promise<string | null> {
  const response = await new Preference(client()).get({ preferenceId });
  return response.init_point ?? null;
}

export type MercadoPagoPayment = {
  id: string;
  status: string;
  statusDetail: string | null;
  orderId: string | null;
};

/**
 * Devuelve `null` cuando el pago no existe. Esa distinción importa: el webhook
 * traduce el `null` a un `200` (no hay nada que reintentar), mientras que una
 * excepción se convierte en un `500` que le pide a MP que reintente durante
 * días. El simulador de notificaciones del panel manda ids inventados.
 */
export async function getMercadoPagoPayment(
  paymentId: string | number,
): Promise<MercadoPagoPayment | null> {
  let payment;
  try {
    payment = await new Payment(client()).get({ id: paymentId });
  } catch (error) {
    if (error instanceof MPNotFoundError) return null;
    throw error;
  }
  if (!payment?.id || !payment.status) return null;

  return {
    id: String(payment.id),
    status: payment.status,
    statusDetail: payment.status_detail ?? null,
    orderId: payment.external_reference ?? null,
  };
}

/**
 * Traduce el estado de Mercado Pago al enum propio. `authorized` (importe
 * retenido pero no capturado) se trata como en proceso: la plata todavía no
 * está acreditada.
 */
export function mapPaymentStatus(mpStatus: string): PaymentStatus {
  switch (mpStatus) {
    case "approved":
      return "APPROVED";
    case "pending":
    case "in_process":
    case "authorized":
      return "IN_PROCESS";
    case "rejected":
    case "cancelled":
      return "REJECTED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

export type WebhookSignatureCheck =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Claves con las que se acepta una firma. `MERCADOPAGO_WEBHOOK_SECRET` admite
 * **varias separadas por coma** porque la clave es por *aplicación*, y una misma
 * tienda recibe avisos de más de una:
 *
 * - Los pagos de prueba los crea la aplicación del usuario de prueba que Mercado
 *   Pago provisiona solo, que tiene su propia clave.
 * - Los pagos reales los crea la aplicación propia, con otra.
 *
 * Con una sola clave, la mitad de las notificaciones se rechaza con `401` — y en
 * el traspaso a producción se rechazarían todas durante un rato. Nada se relaja:
 * cada clave se valida igual, solo se prueban varias.
 */
function webhookSecrets(): string[] {
  return (process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "")
    .split(",")
    .map((secret) => secret.trim())
    .filter(Boolean);
}

/**
 * Valida la firma `x-signature` de una notificación. El validador del SDK
 * recalcula el HMAC-SHA256 y compara en tiempo constante.
 *
 * Sin ninguna clave configurada no hay forma de distinguir una notificación real
 * de una inventada, así que en producción se rechaza. En desarrollo se deja
 * pasar con una advertencia para poder probar el webhook con `curl`.
 */
export function verifyWebhookSignature(input: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}): WebhookSignatureCheck {
  const secrets = webhookSecrets();

  if (secrets.length === 0) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "MissingWebhookSecret" };
    }
    console.warn(
      "[mercadopago] MERCADOPAGO_WEBHOOK_SECRET sin configurar: la firma del webhook no se valida.",
    );
    return { ok: true };
  }

  let firstReason: string | null = null;

  for (const secret of secrets) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: input.signature,
        xRequestId: input.requestId,
        dataId: input.dataId,
        secret,
        toleranceSeconds: SIGNATURE_TOLERANCE_SECONDS,
      });
      return { ok: true };
    } catch (error) {
      if (!(error instanceof InvalidWebhookSignatureError)) throw error;
      firstReason ??= error.reason;
      // Un header ausente o un timestamp fuera de ventana no dependen de la
      // clave: seguir probando no puede cambiar el resultado.
      if (error.reason !== "SignatureMismatch") break;
    }
  }

  const reason = firstReason ?? "SignatureMismatch";
  return {
    ok: false,
    reason: secrets.length > 1 ? `${reason} (${secrets.length} claves probadas)` : reason,
  };
}
