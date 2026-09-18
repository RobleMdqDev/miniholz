import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/CartPageContent";

export const metadata: Metadata = {
  title: "Mi carrito",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-brand-900">Mi carrito</h1>
      <CartPageContent />
    </div>
  );
}
