"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/enums";
import { assertAdmin, type ActionResult } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { pesosToCents } from "@/lib/pricing";
import { MANUAL_ORDER_STATUSES } from "@/lib/order-labels";

const statusSchema = z.enum(MANUAL_ORDER_STATUSES);
const shippingCostSchema = z
  .number({ error: "Ingresá un costo válido." })
  .min(0, { error: "El costo no puede ser negativo." })
  .max(9_999_999);

function revalidateOrder(orderId: string) {
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${orderId}`);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  await assertAdmin();

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Estado inválido." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!order) return { ok: false, error: "El pedido no existe." };

  if (order.status === "CANCELLED") {
    return {
      ok: false,
      error:
        "El pedido está cancelado y su stock ya se repuso. Para retomarlo hay que crear un pedido nuevo.",
    };
  }

  const nextStatus: OrderStatus = parsed.data;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      // Marcar el pedido como pagado acredita también el pago: es el caso de la
      // transferencia, que el admin confirma a mano contra el comprobante.
      ...(nextStatus === "PAID" ? { paymentStatus: "APPROVED" as const } : {}),
    },
  });

  revalidateOrder(orderId);
  return { ok: true, message: "Estado actualizado." };
}

/**
 * Cancela el pedido y devuelve al stock las unidades que había descontado.
 * Es la salida manual para pedidos abandonados; un cron automático queda para
 * más adelante.
 */
export async function cancelOrderAndRestock(orderId: string): Promise<ActionResult> {
  await assertAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      items: { select: { productVariantId: true, quantity: true } },
    },
  });
  if (!order) return { ok: false, error: "El pedido no existe." };
  if (order.status === "CANCELLED") {
    return { ok: false, error: "El pedido ya estaba cancelado." };
  }

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", paymentStatus: "REJECTED" },
    });
  });

  revalidateOrder(orderId);
  revalidatePath("/productos");
  return { ok: true, message: "Pedido cancelado y stock repuesto." };
}

/** El envío se cotiza después de la compra: acá el admin lo carga en el pedido. */
export async function setOrderShippingCost(
  orderId: string,
  shippingCostInPesos: number,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = shippingCostSchema.safeParse(shippingCostInPesos);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Costo inválido." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { subtotal: true },
  });
  if (!order) return { ok: false, error: "El pedido no existe." };

  const shippingCost = pesosToCents(parsed.data);
  await prisma.order.update({
    where: { id: orderId },
    data: { shippingCost, total: order.subtotal + shippingCost },
  });

  revalidateOrder(orderId);
  return { ok: true, message: "Costo de envío actualizado." };
}
