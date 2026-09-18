"use client";

import Link from "next/link";
import { useCartLines } from "./useCartLines";
import { CartLineRow } from "./CartLineRow";
import { CartSummary } from "./CartSummary";

export function CartPageContent() {
  const { cart, loading } = useCartLines();

  if (loading && cart.lines.length === 0) {
    return <p className="py-10 text-sm text-brand-600">Cargando tu carrito…</p>;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-white p-10 text-center">
        <p className="mb-4 text-brand-700">Tu carrito está vacío.</p>
        <Link
          href="/productos"
          className="inline-block rounded-full bg-gold-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
        >
          Ver la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-brand-200 bg-white px-4">
        {cart.unavailableCount > 0 && (
          <p className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">
            Quitamos {cart.unavailableCount}{" "}
            {cart.unavailableCount === 1 ? "producto que ya no está" : "productos que ya no están"}{" "}
            disponibles.
          </p>
        )}
        <ul className="divide-y divide-brand-100">
          {cart.lines.map((line) => (
            <CartLineRow key={`${line.variantId}-${line.personalizationText}`} line={line} />
          ))}
        </ul>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-brand-200 bg-white p-5">
        <CartSummary subtotal={cart.subtotal} />
        <Link
          href="/checkout"
          className="block w-full rounded-full bg-gold-700 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
        >
          Iniciar compra
        </Link>
        <Link
          href="/productos"
          className="block text-center text-sm font-semibold text-gold-700 hover:underline"
        >
          Seguir comprando
        </Link>
      </aside>
    </div>
  );
}
