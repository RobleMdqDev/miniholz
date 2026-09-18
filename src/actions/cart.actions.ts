"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergeCartItems, type CartItemInput, type ResolvedCart } from "@/lib/cart";
import { resolveCartLines } from "@/lib/cart-queries";
import { cartItemsSchema } from "@/lib/validations/cart";

/** Resuelve nombres, precios, stock e imágenes actuales de los ítems del cliente. */
export async function getCartLines(items: CartItemInput[]): Promise<ResolvedCart> {
  const parsed = cartItemsSchema.safeParse(items);
  if (!parsed.success) {
    return { lines: [], subtotal: 0, itemCount: 0, unavailableCount: 0 };
  }
  return resolveCartLines(parsed.data);
}

/**
 * Persiste el carrito del usuario logueado. Reemplaza el contenido completo:
 * la fuente de verdad durante la sesión es el store del cliente, y la tabla
 * `Cart` existe para no perder el carrito al cambiar de dispositivo.
 * Para invitados no hace nada (su carrito vive en localStorage).
 */
export async function syncCart(items: CartItemInput[]): Promise<void> {
  const session = await auth();
  if (!session) return;

  const parsed = cartItemsSchema.safeParse(items);
  if (!parsed.success) return;

  const validItems = await keepExistingVariants(parsed.data);

  await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
      select: { id: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    if (validItems.length > 0) {
      await tx.cartItem.createMany({
        data: validItems.map((item) => ({
          cartId: cart.id,
          productVariantId: item.variantId,
          quantity: item.quantity,
          personalizationText: item.personalizationText,
        })),
      });
    }
  });
}

/**
 * Se llama al detectar que cambió el usuario logueado: suma el carrito que el
 * cliente traía como invitado al que tenía guardado en la base y devuelve el
 * resultado, que el store adopta. Así no se pierde lo agregado antes de entrar.
 */
export async function mergeGuestCart(items: CartItemInput[]): Promise<CartItemInput[]> {
  const session = await auth();
  if (!session) return [];

  const parsed = cartItemsSchema.safeParse(items);
  const guestItems = parsed.success ? parsed.data : [];

  const stored = await prisma.cartItem.findMany({
    where: { cart: { userId: session.user.id } },
    select: { productVariantId: true, quantity: true, personalizationText: true },
  });

  const merged = mergeCartItems(
    stored.map((item) => ({
      variantId: item.productVariantId,
      quantity: item.quantity,
      personalizationText: item.personalizationText,
    })),
    guestItems,
  );

  const result = await keepExistingVariants(merged);
  await syncCart(result);
  return result;
}

/** Descarta ítems cuya variante se borró o cuyo producto se desactivó. */
async function keepExistingVariants(items: CartItemInput[]): Promise<CartItemInput[]> {
  if (items.length === 0) return [];
  const existing = await prisma.productVariant.findMany({
    where: { id: { in: items.map((item) => item.variantId) }, product: { isActive: true } },
    select: { id: true },
  });
  const ids = new Set(existing.map((variant) => variant.id));
  return items.filter((item) => ids.has(item.variantId));
}
