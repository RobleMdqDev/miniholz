"use client";

import { useEffect, useState } from "react";
import { getCartLines } from "@/actions/cart.actions";
import type { CartItemInput, ResolvedCart } from "@/lib/cart";
import { useCartStore } from "@/store/cart-store";

const EMPTY: ResolvedCart = { lines: [], subtotal: 0, itemCount: 0, unavailableCount: 0 };

/**
 * Los ítems guardados en el cliente son solo ids y cantidades: nombres, precios,
 * stock e imágenes se piden al servidor cada vez que cambia el carrito, para no
 * mostrar nunca datos viejos del localStorage.
 *
 * Mientras llega la respuesta se siguen mostrando las líneas anteriores, así
 * cambiar una cantidad no vacía la pantalla por un instante.
 */
export function useCartLines() {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const [resolved, setResolved] = useState<{ source: CartItemInput[]; cart: ResolvedCart } | null>(
    null,
  );

  useEffect(() => {
    if (!hydrated || items.length === 0) return;

    let cancelled = false;
    getCartLines(items).then((cart) => {
      if (!cancelled) setResolved({ source: items, cart });
    });

    return () => {
      cancelled = true;
    };
    // El store crea un array nuevo en cada cambio, así que la identidad alcanza
    // para saber si lo resuelto corresponde al carrito actual.
  }, [items, hydrated]);

  if (items.length === 0) {
    return { cart: EMPTY, loading: !hydrated };
  }

  return {
    cart: resolved?.cart ?? EMPTY,
    loading: !hydrated || resolved?.source !== items,
  };
}
