import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { syncMercadoPagoPayment } from "@/lib/mercadopago-orders";
import { verifyWebhookSignature } from "@/lib/mercadopago";

/**
 * Notificaciones de pago de Mercado Pago.
 *
 * Reglas del endpoint:
 * - Se valida la firma `x-signature` antes de tocar nada.
 * - El cuerpo solo se usa para saber *qué* pago mirar; el estado real se
 *   consulta contra la API de MP (`syncMercadoPagoPayment`).
 * - Todo lo que se ignora a propósito responde 200: un código de error hace
 *   que MP reintente la misma notificación durante días.
 */

type WebhookBody = {
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string | number };
};

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  let body: WebhookBody = {};
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    // Algunas notificaciones viejas (IPN) llegan sin cuerpo, solo con query.
  }

  // La firma se calcula sobre el `data.id` de la query string, que es donde MP
  // lo manda; el cuerpo es el respaldo para el formato IPN.
  const dataId =
    searchParams.get("data.id") ?? searchParams.get("id") ?? stringOrNull(body.data?.id);

  const topic = body.type ?? body.topic ?? searchParams.get("type") ?? searchParams.get("topic");

  const signature = verifyWebhookSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!signature.ok) {
    // El motivo solo no alcanza para diagnosticar: un `SignatureMismatch` puede
    // ser un secret equivocado o un formato de notificación cuyo id no va en el
    // manifiesto (las IPN mandan `topic`+`id` en vez de `data.id`). Se registra
    // de dónde salió cada dato, nunca el secret ni la firma recibida.
    console.warn(
      `[mercadopago] notificación rechazada por firma inválida: ${signature.reason}` +
        ` | topic=${topic ?? "(ninguno)"}` +
        ` dataId=${dataId ?? "(ninguno)"}` +
        ` query=[${[...searchParams.keys()].join(",") || "vacía"}]` +
        ` x-request-id=${request.headers.get("x-request-id") ? "presente" : "ausente"}`,
    );
    return Response.json({ error: "Firma inválida." }, { status: 401 });
  }
  if (topic !== "payment") {
    // `merchant_order`, `plan`, `subscription`… no se usan en esta tienda.
    return Response.json({ ignored: topic ?? "unknown" });
  }

  if (!dataId) {
    return Response.json({ error: "Falta el id del pago." }, { status: 400 });
  }

  let result;
  try {
    result = await syncMercadoPagoPayment(dataId);
  } catch (error) {
    // Un 500 le pide a Mercado Pago que reintente: es lo que queremos si la
    // API de MP o la base fallaron de forma transitoria.
    console.error(`[mercadopago] error sincronizando el pago ${dataId}`, error);
    return Response.json({ error: "No se pudo procesar la notificación." }, { status: 500 });
  }

  if (!result.ok) {
    // El pago no existe o no corresponde a un pedido nuestro: no hay nada que
    // reintentar, así que se confirma la recepción igual.
    console.warn(`[mercadopago] notificación sin efecto (${result.reason}) para el pago ${dataId}`);
    return Response.json({ ignored: result.reason });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${result.orderId}`);
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${result.orderId}`);

  return Response.json({ orderId: result.orderId, paymentStatus: result.paymentStatus });
}

function stringOrNull(value: string | number | undefined): string | null {
  return value === undefined ? null : String(value);
}
