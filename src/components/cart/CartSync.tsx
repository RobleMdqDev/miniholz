"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";

/**
 * Detecta cambios de usuario logueado: al entrar mergea el carrito de invitado
 * con el guardado en la base, y al salir lo limpia del navegador.
 */
export function CartSync({ userId }: { userId: string | null }) {
  const hydrated = useCartStore((state) => state.hydrated);
  const syncWithUser = useCartStore((state) => state.syncWithUser);

  useEffect(() => {
    if (!hydrated) return;
    void syncWithUser(userId);
  }, [hydrated, userId, syncWithUser]);

  return null;
}
