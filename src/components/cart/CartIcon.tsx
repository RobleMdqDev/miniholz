"use client";

import { ShoppingCart } from "lucide-react";
import { useCartCount, useCartStore } from "@/store/cart-store";

export function CartIcon() {
  const count = useCartCount();
  const openCart = useCartStore((state) => state.openCart);

  return (
    <button
      type="button"
      onClick={openCart}
      className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-1 transition hover:bg-brand-200"
      aria-label={`Abrir el carrito (${count} ${count === 1 ? "producto" : "productos"})`}
    >
      <span className="relative">
        <ShoppingCart className="h-5 w-5" aria-hidden />
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      </span>
      <span className="hidden lg:inline">Mi carrito</span>
    </button>
  );
}
