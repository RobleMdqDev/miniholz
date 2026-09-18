import type { Prisma } from "@/generated/prisma/client";
import type { OrderEventType, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

/**
 * Bitácora de auditoría de pedidos.
 *
 * Dos reglas sostienen el diseño, y conviene no aflojarlas:
 *
 * 1. Se asientan **transiciones, no recepciones**. Mercado Pago manda varios
 *    avisos por pago y los reintenta; la sincronización es idempotente, así que
 *    la mayoría no mueve nada. Escribir una fila por aviso multiplicaría el
 *    volumen sin agregar información.
 * 2. No se guarda el cuerpo de la notificación. MP es la fuente de verdad del
 *    pago y siempre se puede reconsultar por `mpPaymentId`; el payload completo
 *    inflaría cada fila por datos que ya viven en otro lado.
 */

/** Quién provocó el cambio. `admin:<userId>` es lo que da trazabilidad real. */
export type OrderEventActor = "webhook" | "return" | "system" | `admin:${string}`;

export type OrderEventInput = {
  orderId: string;
  type: OrderEventType;
  actor: OrderEventActor;
  /** Se omite cuando ese eje no se movió: un cambio de envío no toca estados. */
  status?: { from?: OrderStatus; to: OrderStatus };
  paymentStatus?: { from?: PaymentStatus; to: PaymentStatus };
  mpPaymentId?: string | null;
  detail?: string | null;
};

/**
 * Recibe el cliente de la transacción a propósito: el asiento y el cambio que
 * describe tienen que entrar o fallar juntos. Si se escribieran por separado,
 * la bitácora podría terminar contando una historia distinta a la de `Order`,
 * que es justo lo que uno va a buscar cuando hay un reclamo.
 */
export async function recordOrderEvent(
  tx: Prisma.TransactionClient,
  input: OrderEventInput,
): Promise<void> {
  await tx.orderEvent.create({
    data: {
      orderId: input.orderId,
      type: input.type,
      actor: input.actor,
      fromStatus: input.status?.from ?? null,
      toStatus: input.status?.to ?? null,
      fromPaymentStatus: input.paymentStatus?.from ?? null,
      toPaymentStatus: input.paymentStatus?.to ?? null,
      mpPaymentId: input.mpPaymentId ?? null,
      detail: input.detail ?? null,
    },
  });
}
