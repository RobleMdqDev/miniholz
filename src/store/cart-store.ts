"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mergeGuestCart, syncCart } from "@/actions/cart.actions";
import { cartItemKey, MAX_QUANTITY_PER_LINE, type CartItemInput } from "@/lib/cart";

type CartState = {
  items: CartItemInput[];
  /** Id del usuario dueño del carrito guardado, o null si es de invitado. */
  ownerId: string | null;
  isOpen: boolean;
  /** false hasta leer localStorage: evita un mismatch de hidratación en el header. */
  hydrated: boolean;

  add: (item: CartItemInput) => void;
  setQuantity: (variantId: string, personalizationText: string, quantity: number) => void;
  remove: (variantId: string, personalizationText: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  markHydrated: () => void;
  /** Se llama en cada carga con el usuario actual: mergea o limpia según cambie. */
  syncWithUser: (userId: string | null) => Promise<void>;
};

function clampQuantity(quantity: number) {
  return Math.min(Math.max(1, Math.trunc(quantity)), MAX_QUANTITY_PER_LINE);
}

/** Guarda en la base si hay sesión; para invitados el persist de localStorage alcanza. */
function pushToServer(state: Pick<CartState, "items" | "ownerId">) {
  if (!state.ownerId) return;
  void syncCart(state.items);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerId: null,
      isOpen: false,
      hydrated: false,

      add(item) {
        const key = cartItemKey(item.variantId, item.personalizationText);
        const items = [...get().items];
        const index = items.findIndex(
          (current) => cartItemKey(current.variantId, current.personalizationText) === key,
        );

        if (index >= 0) {
          items[index] = {
            ...items[index],
            quantity: clampQuantity(items[index].quantity + item.quantity),
          };
        } else {
          items.push({ ...item, quantity: clampQuantity(item.quantity) });
        }

        set({ items, isOpen: true });
        pushToServer(get());
      },

      setQuantity(variantId, personalizationText, quantity) {
        const key = cartItemKey(variantId, personalizationText);
        const items = get()
          .items.map((item) =>
            cartItemKey(item.variantId, item.personalizationText) === key
              ? { ...item, quantity: clampQuantity(quantity) }
              : item,
          )
          .filter((item) => item.quantity > 0);

        set({ items });
        pushToServer(get());
      },

      remove(variantId, personalizationText) {
        const key = cartItemKey(variantId, personalizationText);
        set({
          items: get().items.filter(
            (item) => cartItemKey(item.variantId, item.personalizationText) !== key,
          ),
        });
        pushToServer(get());
      },

      clear() {
        set({ items: [] });
        pushToServer(get());
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      markHydrated: () => set({ hydrated: true }),

      async syncWithUser(userId) {
        const { ownerId, items } = get();
        if (userId === ownerId) return;

        if (!userId) {
          // Cerró sesión: el carrito guardado no puede quedar visible para el
          // siguiente que use el navegador.
          set({ items: [], ownerId: null });
          return;
        }

        const merged = await mergeGuestCart(items);
        set({ items: merged, ownerId: userId });
      },
    }),
    {
      name: "miniholz-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, ownerId: state.ownerId }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export function useCartCount() {
  return useCartStore((state) =>
    state.hydrated ? state.items.reduce((total, item) => total + item.quantity, 0) : 0,
  );
}
