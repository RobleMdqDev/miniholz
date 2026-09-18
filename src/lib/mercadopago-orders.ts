import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { parseShippingAddress } from "@/lib/orders";
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
export async function syncMercadoPagoPayment(
  paymentId: string | number,
): Promise<PaymentSyncResult> {
  const payment = await getMercadoPagoPayment(paymentId);
  if (!payment?.orderId) return { ok: false, reason: "payment_not_found" };

  const order = await prisma.order.findUnique({
    where: { id: payment.orderId },
    select: { id: true, orderNumber: true, status: true, paymentStatus: true, paymentMethod: true },
  });
  if (!order) return { ok: false, reason: "order_not_found" };
  if (order.paymentMethod !== "MERCADOPAGO") return { ok: false, reason: "wrong_method" };

  const paymentStatus = mapPaymentStatus(payment.status);

  // Checkout Pro deja reintentar tras un rechazo, así que sobre un mismo pedido
  // conviven varios pagos. Si ya hay uno acreditado, el aviso tardío de otro
  // intento fallido no puede pisarlo (solo una devolución cambia ese estado).
  const alreadyApproved = order.paymentStatus === "APPROVED";
  if (alreadyApproved && paymentStatus !== "APPROVED" && paymentStatus !== "REFUNDED") {
    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus, mpPaymentId: payment.id },
    });

    // El pedido pasa a PAID solo si seguía esperando el pago: si el admin ya lo
    // movió a "en preparación" o "enviado", una notificación repetida no lo
    // hace retroceder.
    if (paymentStatus === "APPROVED") {
      await tx.order.updateMany({
        where: { id: order.id, status: "PENDING_PAYMENT" },
        data: { status: "PAID" },
      });
    }
  });

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    select: { status: true, paymentStatus: true },
  });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: updated.paymentStatus,
    orderStatus: updated.status,
  };
}
