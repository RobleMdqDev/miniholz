"use client";

import { useState } from "react";
import type { ProductDetail } from "@/lib/catalog";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { variantPriceCents } from "@/lib/pricing";
import { useCartStore } from "@/store/cart-store";
import { inputClassName, labelClassName } from "@/components/ui/form";
import { PriceDisplay } from "./PriceDisplay";

const LOW_STOCK_THRESHOLD = 3;

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const add = useCartStore((state) => state.add);

  const firstAvailable = product.variants.find((variant) => variant.stock > 0);
  const [variantId, setVariantId] = useState(
    (firstAvailable ?? product.variants[0])?.id ?? "",
  );
  const [personalizationText, setPersonalizationText] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const variant = product.variants.find((item) => item.id === variantId);
  const showVariants = product.variants.length > 1;
  const unitPrice = variantPriceCents(product.basePrice, variant?.priceOverride ?? null);
  const maxQuantity = Math.min(variant?.stock ?? 0, MAX_QUANTITY_PER_LINE);
  const soldOut = !product.variants.some((item) => item.stock > 0);

  function onAddToCart() {
    if (!variant || variant.stock <= 0) {
      setError("Elegí una opción con stock disponible.");
      return;
    }

    const text = personalizationText.trim();
    if (product.personalizationRequired && !text) {
      setError(`Completá ${(product.personalizationLabel ?? "la personalización").toLowerCase()}.`);
      return;
    }

    setError(null);
    add({ variantId: variant.id, quantity, personalizationText: text });
  }

  return (
    <div className="space-y-5">
      <PriceDisplay basePriceCents={unitPrice} compareAtPriceCents={product.compareAtPrice} />

      {showVariants && (
        <fieldset>
          <legend className={labelClassName}>Opción</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((item) => {
              const disabled = item.stock <= 0;
              const selected = item.id === variantId;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setVariantId(item.id);
                    setQuantity(1);
                    setError(null);
                  }}
                  aria-pressed={selected}
                  className={
                    disabled
                      ? "cursor-not-allowed rounded-full border border-brand-200 px-4 py-2 text-sm text-brand-300 line-through"
                      : selected
                        ? "rounded-full border border-gold-600 bg-gold-700 px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 transition hover:border-gold-400"
                  }
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {product.personalizationLabel && (
        <div>
          <label htmlFor="personalizacion" className={labelClassName}>
            {product.personalizationLabel}{" "}
            <span className="font-normal text-brand-600">
              {product.personalizationRequired ? "(obligatorio)" : "(opcional)"}
            </span>
          </label>
          <input
            id="personalizacion"
            value={personalizationText}
            maxLength={product.personalizationMaxLength ?? 40}
            onChange={(event) => {
              setPersonalizationText(event.target.value);
              setError(null);
            }}
            className={inputClassName}
            placeholder="Ej: Felipe"
          />
          {product.personalizationMaxLength && (
            <p className="mt-1 text-xs text-brand-600">
              Hasta {product.personalizationMaxLength} caracteres. El grabado no tiene costo
              adicional.
            </p>
          )}
        </div>
      )}

      {!soldOut && variant && variant.stock <= LOW_STOCK_THRESHOLD && (
        <p className="text-sm font-semibold text-accent-600">
          ¡Últimas {variant.stock} {variant.stock === 1 ? "unidad" : "unidades"}!
        </p>
      )}

      <div className="flex items-center gap-3">
        <label htmlFor="cantidad" className="text-sm font-semibold text-brand-800">
          Cantidad
        </label>
        <select
          id="cantidad"
          value={quantity}
          disabled={soldOut || maxQuantity === 0}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-gold-500"
        >
          {Array.from({ length: Math.max(maxQuantity, 1) }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onAddToCart}
        disabled={soldOut}
        className="w-full rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {soldOut ? "Sin stock" : "Agregar al carrito"}
      </button>
    </div>
  );
}
