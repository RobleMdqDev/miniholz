// Tipos y constantes del carrito. Este módulo lo importan también componentes
// de cliente, así que no puede tocar Prisma: las consultas viven en
// `cart-queries.ts`.

export type CartItemInput = {
  variantId: string;
  quantity: number;
  personalizationText: string;
};

export type CartLine = {
  variantId: string;
  personalizationText: string;
  /** Cantidad efectiva: nunca supera el stock disponible. */
  quantity: number;
  /** Lo que el cliente había pedido, para poder avisarle si se recortó. */
  requestedQuantity: number;
  stock: number;
  productName: string;
  productSlug: string;
  variantName: string;
  /** Los productos sin opciones reales no muestran el nombre de la variante. */
  showVariantName: boolean;
  unitPrice: number;
  subtotal: number;
  image: { url: string; alt: string | null } | null;
  /** Reglas de personalización del producto, revalidadas al crear la orden. */
  personalizationRequired: boolean;
  personalizationMaxLength: number | null;
};

export type ResolvedCart = {
  lines: CartLine[];
  subtotal: number;
  itemCount: number;
  /** Ítems que ya no existen o se quedaron sin stock y hay que descartar. */
  unavailableCount: number;
};

export const MAX_QUANTITY_PER_LINE = 20;

export function cartItemKey(variantId: string, personalizationText: string) {
  return `${variantId}\u0000${personalizationText}`;
}

/**
 * Suma el carrito de invitado sobre el que ya estaba guardado en la base.
 * Las líneas se identifican por variante + texto de personalización, así que
 * el mismo producto con dos nombres grabados distintos son dos líneas.
 */
export function mergeCartItems(
  stored: CartItemInput[],
  guest: CartItemInput[],
): CartItemInput[] {
  const merged = new Map<string, CartItemInput>();

  for (const item of stored) {
    merged.set(cartItemKey(item.variantId, item.personalizationText), { ...item });
  }

  for (const item of guest) {
    const key = cartItemKey(item.variantId, item.personalizationText);
    const existing = merged.get(key);
    merged.set(key, {
      ...item,
      quantity: Math.min((existing?.quantity ?? 0) + item.quantity, MAX_QUANTITY_PER_LINE),
    });
  }

  return [...merged.values()];
}
