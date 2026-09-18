const TRANSFER_DISCOUNT_PERCENT = 10;
const INSTALLMENTS_COUNT = 3;

export function discountPercent(basePrice: number, compareAtPrice: number | null): number | null {
  if (!compareAtPrice || compareAtPrice <= basePrice) return null;
  return Math.round((1 - basePrice / compareAtPrice) * 100);
}

export function transferPriceCents(basePrice: number): number {
  return Math.round(basePrice * (1 - TRANSFER_DISCOUNT_PERCENT / 100));
}

export function installmentAmountCents(basePrice: number): number {
  return Math.round(basePrice / INSTALLMENTS_COUNT);
}

export const installmentsCount = INSTALLMENTS_COUNT;
export const transferDiscountPercent = TRANSFER_DISCOUNT_PERCENT;

/** Precio efectivo de una variante: su override si lo tiene, si no el del producto. */
export function variantPriceCents(basePrice: number, priceOverride: number | null): number {
  return priceOverride ?? basePrice;
}

/** El admin escribe precios en pesos; la base los guarda en centavos. */
export function pesosToCents(pesos: number): number {
  return Math.round(pesos * 100);
}

export function centsToPesos(cents: number): number {
  return cents / 100;
}
