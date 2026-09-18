import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMercadoPagoEnabled } from "@/lib/mercadopago";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Finalizar compra",
};

export default async function CheckoutPage() {
  // Se permite comprar como invitado; si hay sesión, se precargan los datos.
  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, phone: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-brand-900">Finalizar compra</h1>
      <CheckoutForm
        prefill={{
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
        }}
        mercadoPagoEnabled={isMercadoPagoEnabled()}
      />
    </div>
  );
}
