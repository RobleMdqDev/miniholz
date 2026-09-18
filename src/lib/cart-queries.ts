import { prisma } from "@/lib/prisma";
import { variantPriceCents } from "@/lib/pricing";
import {
  MAX_QUANTITY_PER_LINE,
  type CartItemInput,
  type CartLine,
  type ResolvedCart,
} from "@/lib/cart";

/**
 * Convierte los ítems guardados en el cliente (solo ids y cantidades) en líneas
 * con nombre, precio, stock e imagen actuales. Los precios se leen siempre de
 * la base, nunca del localStorage, para que un cambio de precio del admin se
 * refleje en el carrito.
 */
export async function resolveCartLines(items: CartItemInput[]): Promise<ResolvedCart> {
  const variantIds = [...new Set(items.map((item) => item.variantId))];
  if (variantIds.length === 0) {
    return { lines: [], subtotal: 0, itemCount: 0, unavailableCount: 0 };
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, product: { isActive: true } },
    select: {
      id: true,
      name: true,
      stock: true,
      priceOverride: true,
      product: {
        select: {
          name: true,
          slug: true,
          basePrice: true,
          personalizationRequired: true,
          personalizationMaxLength: true,
          images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 1 },
          _count: { select: { variants: true } },
        },
      },
    },
  });

  const byId = new Map(variants.map((variant) => [variant.id, variant]));
  const lines: CartLine[] = [];
  let unavailableCount = 0;

  for (const item of items) {
    const variant = byId.get(item.variantId);
    if (!variant || variant.stock <= 0) {
      unavailableCount += 1;
      continue;
    }

    const requestedQuantity = Math.min(Math.max(1, item.quantity), MAX_QUANTITY_PER_LINE);
    const quantity = Math.min(requestedQuantity, variant.stock);
    const unitPrice = variantPriceCents(variant.product.basePrice, variant.priceOverride);

    lines.push({
      variantId: variant.id,
      personalizationText: item.personalizationText,
      quantity,
      requestedQuantity,
      stock: variant.stock,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      variantName: variant.name,
      showVariantName: variant.product._count.variants > 1,
      unitPrice,
      subtotal: unitPrice * quantity,
      image: variant.product.images[0] ?? null,
      personalizationRequired: variant.product.personalizationRequired,
      personalizationMaxLength: variant.product.personalizationMaxLength,
    });
  }

  return {
    lines,
    subtotal: lines.reduce((total, line) => total + line.subtotal, 0),
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    unavailableCount,
  };
}
