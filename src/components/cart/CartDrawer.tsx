"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCartLines } from "./useCartLines";
import { CartLineRow } from "./CartLineRow";
import { CartSummary } from "./CartSummary";

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const { cart, loading } = useCartLines();

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCart();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-brand-900/40"
        onClick={closeCart}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mi carrito"
        className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
          <h2 className="font-extrabold text-brand-900">Mi carrito</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar el carrito"
            className="text-brand-600 transition hover:text-brand-900"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4">
          {loading && cart.lines.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-600">Cargando…</p>
          ) : cart.lines.length === 0 ? (
            <div className="py-10 text-center">
              <p className="mb-4 text-sm text-brand-600">Todavía no agregaste productos.</p>
              <Link
                href="/productos"
                onClick={closeCart}
                className="rounded-full bg-gold-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gold-800"
              >
                Ver la tienda
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-brand-100">
              {cart.lines.map((line) => (
                <CartLineRow
                  key={`${line.variantId}-${line.personalizationText}`}
                  line={line}
                  onNavigate={closeCart}
                />
              ))}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 && (
          <footer className="space-y-3 border-t border-brand-100 px-4 py-4">
            <CartSummary subtotal={cart.subtotal} />
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block rounded-full bg-gold-700 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
            >
              Iniciar compra
            </Link>
            <Link
              href="/carrito"
              onClick={closeCart}
              className="block text-center text-sm font-semibold text-gold-700 hover:underline"
            >
              Ver el carrito
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
