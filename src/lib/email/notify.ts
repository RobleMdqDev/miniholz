import { prisma } from "@/lib/prisma";
import {
  sendAdminNewOrder,
  sendOrderConfirmation,
  sendOrderShipped,
  sendPaymentApproved,
  sendShippingQuoted,
  type OrderEmailData,
} from "./orders";

/**
 * El puente entre lo que pasa con un pedido y los correos que eso dispara.
 *
 * Todas las funciones de acá:
 *
 * - **Reciben un id y leen el pedido ellas mismas.** Los llamadores son Server
 *   Actions y webhooks que ya hicieron su trabajo; no tienen por qué cargar con
 *   armar el objeto que necesita un correo.
 * - **No lanzan nunca.** Se invocan con `void` y sin `await`: un correo no puede
 *   hacer fallar una compra ni devolverle un error al comprador. Lo que falla
 *   queda en el log.
 */

const emailOrderSelect = {
  id: true,
  orderNumber: true,
  guestEmail: true,
  guestName: true,
  shippingAddress: true,
  subtotal: true,
  shippingCost: true,
  total: true,
  paymentMethod: true,
  user: { select: { name: true, email: true } },
  items: {
    select: {
      productName: true,
      variantName: true,
      personalizationText: true,
      quantity: true,
      subtotal: true,
    },
  },
} as const;

async function loadOrder(orderId: string): Promise<OrderEmailData | null> {
  return prisma.order.findUnique({ where: { id: orderId }, select: emailOrderSelect });
}

/** Envuelve cualquier envío para que un error nunca escape hacia el llamador. */
async function safely(label: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (cause) {
    console.error(`[email] falló el aviso "${label}"`, cause);
  }
}

export async function notifyOrderCreated(orderId: string): Promise<void> {
  await safely("pedido creado", async () => {
    const order = await loadOrder(orderId);
    if (!order) return;
    // En paralelo: son destinatarios distintos y ninguno depende del otro.
    await Promise.all([sendOrderConfirmation(order), sendAdminNewOrder(order)]);
  });
}

export async function notifyShippingQuoted(orderId: string): Promise<void> {
  await safely("envío cotizado", async () => {
    const order = await loadOrder(orderId);
    if (!order || order.shippingCost <= 0) return;
    await sendShippingQuoted(order);
  });
}

export async function notifyPaymentApproved(orderId: string): Promise<void> {
  await safely("pago acreditado", async () => {
    const order = await loadOrder(orderId);
    if (!order) return;
    await sendPaymentApproved(order);
  });
}

export async function notifyOrderShipped(orderId: string): Promise<void> {
  await safely("pedido despachado", async () => {
    const order = await loadOrder(orderId);
    if (!order) return;
    await sendOrderShipped(order);
  });
}
