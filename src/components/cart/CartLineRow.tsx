"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartLine } from "@/lib/cart";
import { formatCurrencyFromCents } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";

export function CartLineRow({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const atStockLimit = line.quantity >= line.stock;

  return (
    <li className="flex gap-3 py-4">
      <Link
        href={`/productos/${line.productSlug}`}
        onClick={onNavigate}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50"
      >
        {line.image && (
          <Image
            src={line.image.url}
            alt={line.image.alt ?? line.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/productos/${line.productSlug}`}
          onClick={onNavigate}
          className="block font-semibold leading-snug text-brand-900 hover:text-gold-700"
        >
          {line.productName}
        </Link>

        {line.showVariantName && <p className="text-xs text-brand-600">{line.variantName}</p>}
        {line.personalizationText && (
          <p className="text-xs text-brand-600">
            Grabado: <span className="font-semibold">{line.personalizationText}</span>
          </p>
        )}

        {line.quantity < line.requestedQuantity && (
          <p className="mt-1 text-xs font-medium text-danger-600">
            Quedan {line.stock} en stock: ajustamos la cantidad.
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-full border border-brand-200">
            <button
              type="button"
              onClick={() =>
                setQuantity(line.variantId, line.personalizationText, line.quantity - 1)
              }
              className="flex h-10 w-10 items-center justify-center rounded-l-full text-brand-700 transition hover:bg-brand-100 hover:text-gold-700"
              aria-label="Quitar una unidad"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="min-w-7 text-center text-sm font-semibold">{line.quantity}</span>
            <button
              type="button"
              disabled={atStockLimit}
              onClick={() =>
                setQuantity(line.variantId, line.personalizationText, line.quantity + 1)
              }
              className="flex h-10 w-10 items-center justify-center rounded-r-full text-brand-700 transition hover:bg-brand-100 hover:text-gold-700 disabled:opacity-40"
              aria-label="Agregar una unidad"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          <span className="text-sm font-bold text-brand-800">
            {formatCurrencyFromCents(line.subtotal)}
          </span>

          <button
            type="button"
            onClick={() => remove(line.variantId, line.personalizationText)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-brand-600 transition hover:bg-danger-50 hover:text-danger-600"
            aria-label={`Quitar ${line.productName} del carrito`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
