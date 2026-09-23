"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCartLines } from "@/lib/cart-queries";
import type { CartItemInput, CartLine } from "@/lib/cart";
import { cartItemsSchema } from "@/lib/validations/cart";
import {
  checkoutSchema,
  type CheckoutInput,
  type CheckoutPaymentMethod,
} from "@/lib/validations/checkout";
import { serializeShippingAddress } from "@/lib/orders";
import { isMercadoPagoEnabled } from "@/lib/mercadopago";
import { recordOrderEvent } from "@/lib/order-events";
import { notifyOrderCreated } from "@/lib/email/notify";

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: number; paymentMethod: CheckoutPaymentMethod }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const ORDER_NUMBER_RETRIES = 3;

export async function createOrder(
  input: CheckoutInput,
  items: CartItemInput[],
): Promise<CreateOrderResult> {
  const checkout = checkoutSchema.safeParse(input);
  if (!checkout.success) {
    return {
      ok: false,
      error: "Revisá los datos de envío.",
      fieldErrors: checkout.error.flatten().fieldErrors,
    };
  }

  // Sin credenciales no hay link de pago, y el pedido quedaría en un limbo del
  // que el cliente no puede salir: mejor no crearlo.
  if (checkout.data.paymentMethod === "MERCADOPAGO" && !isMercadoPagoEnabled()) {
    return { ok: false, error: "El pago con tarjeta no está disponible en este momento." };
  }

  const parsedItems = cartItemsSchema.safeParse(items);
  if (!parsedItems.success) {
    return { ok: false, error: "Revisá las cantidades del carrito e intentá de nuevo." };
  }
  if (parsedItems.data.length === 0) {
    return { ok: false, error: "Tu carrito está vacío." };
  }

  // Precios, nombres y stock salen siempre de la base: lo que manda el cliente
  // son solo ids y cantidades.
  const cart = await resolveCartLines(parsedItems.data);
  if (cart.lines.length === 0) {
    return { ok: false, error: "Los productos de tu carrito ya no están disponibles." };
  }

  const personalizationError = findPersonalizationError(cart.lines);
  if (personalizationError) {
    return { ok: false, error: personalizationError };
  }

  const session = await auth();
  const { email, paymentMethod, ...address } = checkout.data;

  for (let attempt = 1; attempt <= ORDER_NUMBER_RETRIES; attempt++) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        for (const line of cart.lines) {
          // Update condicional atómico: si dos compradores se pelean la última
          // unidad, solo uno consigue count === 1 y el otro aborta la transacción.
          const updated = await tx.productVariant.updateMany({
            where: { id: line.variantId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new InsufficientStockError(line.productName);
          }
        }

        // SQLite no admite autoincrement fuera del @id; el número visible se
        // calcula acá y el índice único sobre `orderNumber` evita duplicados.
        const last = await tx.order.aggregate({ _max: { orderNumber: true } });
        const orderNumber = (last._max.orderNumber ?? 0) + 1;

        const created = await tx.order.create({
          data: {
            orderNumber,
            userId: session?.user.id ?? null,
            guestEmail: session ? null : email,
            guestName: session ? null : address.fullName,
            guestPhone: session ? null : address.phone,
            shippingAddress: serializeShippingAddress(address),
            subtotal: cart.subtotal,
            // El envío se cotiza después de la compra; el admin lo completa.
            shippingCost: 0,
            total: cart.subtotal,
            paymentMethod,
            notes: address.notes || null,
            items: {
              create: cart.lines.map((line) => ({
                productVariantId: line.variantId,
                productName: line.productName,
                variantName: line.showVariantName ? line.variantName : null,
                personalizationText: line.personalizationText,
                unitPrice: line.unitPrice,
                quantity: line.quantity,
                subtotal: line.subtotal,
              })),
            },
          },
          select: { id: true, orderNumber: true },
        });

        await recordOrderEvent(tx, {
          orderId: created.id,
          type: "CREATED",
          actor: "system",
          status: { to: "PENDING_PAYMENT" },
          paymentStatus: { to: "PENDING" },
          detail: `Checkout: ${paymentMethod}`,
        });

        return created;
      });

      if (session) {
        // El carrito guardado ya se convirtió en pedido.
        await prisma.cartItem.deleteMany({ where: { cart: { userId: session.user.id } } });
      }

      // Después de la transacción y sin await: el pedido ya está confirmado y
      // el comprador no tiene que esperar a que salga un correo para ver su
      // pantalla. Si el envío falla, queda en el log y la compra sigue en pie.
      void notifyOrderCreated(order.id);

      return { ok: true, orderId: order.id, orderNumber: order.orderNumber, paymentMethod };
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        return {
          ok: false,
          error: `Nos quedamos sin stock de "${error.productName}" mientras comprabas. Ajustá el carrito e intentá de nuevo.`,
        };
      }
      if (isDuplicateOrderNumber(error) && attempt < ORDER_NUMBER_RETRIES) {
        continue;
      }
      throw error;
    }
  }

  return { ok: false, error: "No pudimos registrar el pedido. Intentá de nuevo." };
}

class InsufficientStockError extends Error {
  constructor(readonly productName: string) {
    super(`Sin stock: ${productName}`);
  }
}

function isDuplicateOrderNumber(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function findPersonalizationError(lines: CartLine[]): string | null {
  for (const line of lines) {
    const text = line.personalizationText.trim();
    if (line.personalizationRequired && !text) {
      return `Falta completar la personalización de "${line.productName}".`;
    }
    if (line.personalizationMaxLength && text.length > line.personalizationMaxLength) {
      return `La personalización de "${line.productName}" supera los ${line.personalizationMaxLength} caracteres.`;
    }
  }
  return null;
}
