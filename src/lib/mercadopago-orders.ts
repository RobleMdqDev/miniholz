import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { parseShippingAddress } from "@/lib/orders";
import { recordOrderEvent, type OrderEventActor } from "@/lib/order-events";
import { notifyPaymentApproved } from "@/lib/email/notify";
import {
  createOrderPreference,
  getMercadoPagoPayment,
  getPreferenceInitPoint,
  isMercadoPagoEnabled,
  mapPaymentStatus,
} from "@/lib/mercadopago";

/**
 * El puente entre Mercado Pago y los pedidos: arma el link de pago de una
 * orden y aplica a la base el resultado de un pago.
 */

const preferenceOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  shippingCost: true,
  mpPreferenceId: true,
  paymentMethod: true,
  shippingAddress: true,
  guestEmail: true,
  guestName: true,
  guestPhone: true,
  user: { select: { name: true, email: true, phone: true } },
  items: {
    select: {
      id: true,
      productName: true,
      variantName: true,
      personalizationText: true,
      unitPrice: true,
      quantity: true,
    },
  },
} as const;

export type CheckoutUrlResult =
  | { ok: true; initPoint: string }
  | { ok: false; error: string };

/**
 * Devuelve el link de Checkout Pro del pedido. Reutiliza la preferencia ya
 * creada si sigue viva (así volver a la página no genera una nueva) y crea una
 * nueva si no existe o si Mercado Pago ya no la reconoce — pasa al cambiar las
 * credenciales de prueba por las de producción.
 */
export async function getOrderCheckoutUrl(orderId: string): Promise<CheckoutUrlResult> {
  if (!isMercadoPagoEnabled()) {
    return { ok: false, error: "El pago con tarjeta todavía no está configurado." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: preferenceOrderSelect,
  });
  if (!order) return { ok: false, error: "El pedido no existe." };
  if (order.paymentMethod !== "MERCADOPAGO") {
    return { ok: false, error: "Este pedido no se paga con Mercado Pago." };
  }

  if (order.mpPreferenceId) {
    try {
      const initPoint = await getPreferenceInitPoint(order.mpPreferenceId);
      if (initPoint) return { ok: true, initPoint };
    } catch {
      // La preferencia guardada ya no sirve: se arma una nueva más abajo.
    }
  }

  const address = parseShippingAddress(order.shippingAddress);

  try {
    const { preferenceId, initPoint } = await createOrderPreference({
      id: order.id,
      orderNumber: order.orderNumber,
      shippingCost: order.shippingCost,
      items: order.items,
      payer: {
        name: address?.fullName ?? order.guestName ?? order.user?.name ?? "",
        email: order.guestEmail ?? order.user?.email ?? "",
        phone: address?.phone ?? order.guestPhone ?? order.user?.phone ?? "",
        // Mercado Pago la usa para prevención de fraude. Sale del snapshot del
        // pedido, no de la libreta del cliente, que pudo cambiar desde la compra.
        address: address
          ? {
              streetName: address.street,
              streetNumber: address.number,
              zipCode: address.postalCode,
            }
          : null,
      },
    });

    await prisma.order.update({ where: { id: order.id }, data: { mpPreferenceId: preferenceId } });
    return { ok: true, initPoint };
  } catch (error) {
    console.error("[mercadopago] no se pudo crear la preferencia", error);
    return {
      ok: false,
      error: "No pudimos abrir el pago con Mercado Pago. Probá de nuevo en un momento.",
    };
  }
}

export type PaymentSyncResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: number;
      paymentStatus: PaymentStatus;
      orderStatus: OrderStatus;
    }
  | { ok: false; reason: "payment_not_found" | "order_not_found" | "wrong_method" };

/**
 * Trae el pago de la API de Mercado Pago y lo aplica al pedido. Nunca se confía
 * en lo que llega en la notificación (ni en los parámetros de la URL de
 * retorno): el estado sale siempre de consultar el pago por su id.
 *
 * Se llama desde el webhook y también desde las páginas de retorno, porque en
 * desarrollo MP no puede alcanzar `localhost` y el webhook nunca llega.
 */
/** Lo que se lee del pedido con la fila ya bloqueada. */
type LockedOrder = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  mpPaymentId: string | null;
};

export async function syncMercadoPagoPayment(
  paymentId: string | number,
  /** De dónde vino el aviso. Solo se usa para la bitácora. */
  actor: Extract<OrderEventActor, "webhook" | "return"> = "webhook",
): Promise<PaymentSyncResult> {
  const payment = await getMercadoPagoPayment(paymentId);
  if (!payment?.orderId) return { ok: false, reason: "payment_not_found" };

  const order = await prisma.order.findUnique({
    where: { id: payment.orderId },
    select: { id: true, orderNumber: true, paymentMethod: true },
  });
  if (!order) return { ok: false, reason: "order_not_found" };
  if (order.paymentMethod !== "MERCADOPAGO") return { ok: false, reason: "wrong_method" };

  const paymentStatus = mapPaymentStatus(payment.status);
  const detail = payment.statusDetail
    ? `Mercado Pago: ${payment.status} (${payment.statusDetail})`
    : `Mercado Pago: ${payment.status}`;

  const applied = await prisma.$transaction(async (tx) => {
    // El estado del pedido se lee acá adentro y con la fila bloqueada. La
    // vuelta del checkout y el webhook sincronizan el mismo pago a la vez —en
    // producción llegaron con seis segundos de diferencia—, y leyendo afuera
    // ambos verían el estado previo y asentarían el mismo evento dos veces.
    const rows = await tx.$queryRaw<LockedOrder[]>`
      SELECT "status", "paymentStatus", "mpPaymentId"
      FROM "Order" WHERE "id" = ${order.id} FOR UPDATE
    `;
    const current = rows[0];
    if (!current) return null;

    // Checkout Pro deja reintentar tras un rechazo, así que sobre un mismo
    // pedido conviven varios pagos. Si ya hay uno acreditado, el aviso tardío
    // de otro intento fallido no puede pisarlo: solo una devolución cambia ese
    // estado.
    const keepsApproved =
      current.paymentStatus === "APPROVED" &&
      paymentStatus !== "APPROVED" &&
      paymentStatus !== "REFUNDED";

    if (keepsApproved) {
      // El pedido no se toca, pero el intento sí se asienta: es la única traza
      // de que ese pago existió, y es justo lo que se va a buscar ante un
      // reclamo por un cargo duplicado. Se busca por `mpPaymentId` porque acá
      // no se actualiza el del pedido, así que no hay estado contra el cual
      // comparar para evitar que los reintentos de MP dupliquen la fila.
      const yaAsentado = await tx.orderEvent.findFirst({
        where: { orderId: order.id, mpPaymentId: payment.id },
        select: { id: true },
      });
      if (!yaAsentado) {
        await recordOrderEvent(tx, {
          orderId: order.id,
          type: "PAYMENT_SYNCED",
          actor,
          mpPaymentId: payment.id,
          detail: `${detail} · intento posterior a la acreditación, no modifica el pedido`,
        });
      }
      return { status: current.status, paymentStatus: current.paymentStatus };
    }

    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus, mpPaymentId: payment.id },
    });

    // El pedido pasa a PAID solo si seguía esperando el pago: si el admin ya lo
    // movió a "en preparación" o "enviado", una notificación repetida no lo
    // hace retroceder.
    let promotedToPaid = false;
    if (paymentStatus === "APPROVED") {
      const promoted = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING_PAYMENT" },
        data: { status: "PAID" },
      });
      promotedToPaid = promoted.count > 0;
    }

    // Acá se decide si el aviso merece un asiento. Mercado Pago avisa varias
    // veces por el mismo pago: un aviso que no movió nada no escribe. Un pago
    // distinto sí, aunque caiga en el mismo estado, porque es lo que
    // `Order.mpPaymentId` pierde al quedarse solo con el último intento.
    const paymentStatusChanged = paymentStatus !== current.paymentStatus;
    const isNewAttempt = payment.id !== current.mpPaymentId;
    if (paymentStatusChanged || isNewAttempt || promotedToPaid) {
      await recordOrderEvent(tx, {
        orderId: order.id,
        type: "PAYMENT_SYNCED",
        actor,
        mpPaymentId: payment.id,
        ...(paymentStatusChanged
          ? { paymentStatus: { from: current.paymentStatus, to: paymentStatus } }
          : {}),
        ...(promotedToPaid ? { status: { from: current.status, to: "PAID" as const } } : {}),
        detail,
      });
    }

    return {
      status: promotedToPaid ? ("PAID" as const) : current.status,
      paymentStatus,
    };
  });

  if (!applied) return { ok: false, reason: "order_not_found" };

  // Solo cuando el pedido *pasó* a pagado en esta pasada. La sincronización
  // corre desde el webhook y desde la vuelta del checkout, y Mercado Pago avisa
  // varias veces por el mismo pago: sin esta condición el comprador recibiría
  // el aviso de acreditación una vez por notificación.
  if (applied.status === "PAID" && applied.paymentStatus === "APPROVED") {
    void notifyPaymentApproved(order.id);
  }

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: applied.paymentStatus,
    orderStatus: applied.status,
  };
}
