import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { canViewOrder, getOrderById } from "@/lib/orders";
import { getOrderCheckoutUrl } from "@/lib/mercadopago-orders";
import { formatCurrencyFromCents } from "@/lib/format";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";

export const metadata: Metadata = {
  title: "Pagar con Mercado Pago",
};

export default async function MercadoPagoCheckoutPage(
  props: PageProps<"/checkout/mercadopago/[orderId]">,
) {
  const { orderId } = await props.params;
  const [order, session] = await Promise.all([getOrderById(orderId), auth()]);

  if (!order) notFound();
  if (!canViewOrder(order, session?.user ?? null)) notFound();
  if (order.paymentMethod !== "MERCADOPAGO") notFound();

  const alreadyPaid = order.paymentStatus === "APPROVED";
  // El link solo se pide si falta pagar: crear una preferencia para un pedido
  // ya acreditado es una llamada a MP al pedo.
  const checkout = alreadyPaid ? null : await getOrderCheckoutUrl(order.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gold-700">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        Pedido #{order.orderNumber} registrado
      </p>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">
        {alreadyPaid ? "Tu pago ya está acreditado" : "Pagá con Mercado Pago"}
      </h1>
      <p className="mb-8 text-sm text-brand-600">
        {alreadyPaid
          ? "No hace falta que hagas nada más: ya estamos preparando tu pedido."
          : "Guardamos tu pedido. Te llevamos al sitio de Mercado Pago para completar el pago y después volvés acá."}
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-brand-200 bg-white p-5">
            {alreadyPaid ? (
              <p className="rounded-xl bg-accent-50 p-4 text-sm text-accent-700">
                Recibimos {formatCurrencyFromCents(order.total)} por el pedido #{order.orderNumber}.
              </p>
            ) : checkout?.ok ? (
              <>
                <p className="mb-1 text-sm text-brand-600">Total a pagar</p>
                <p className="mb-4 text-2xl font-extrabold text-brand-900">
                  {formatCurrencyFromCents(order.total)}
                </p>

                <a
                  href={checkout.initPoint}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-700 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-800"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Pagar con Mercado Pago
                </a>

                <p className="mt-3 flex items-start gap-2 text-xs text-brand-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden />
                  El pago se hace en el sitio de Mercado Pago: MiniHolz nunca ve los datos de tu
                  tarjeta. El envío se cotiza aparte y no está incluido en este total.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <p className="rounded-xl bg-danger-50 p-4 text-sm text-danger-700">
                  {checkout?.error ?? "No pudimos abrir el pago con Mercado Pago."} Tu pedido #
                  {order.orderNumber} quedó registrado igual.
                </p>
                <p className="text-sm text-brand-600">
                  Podés recargar esta página para reintentar, o escribirnos y coordinamos el pago
                  por otro medio.
                </p>
              </div>
            )}
          </section>

          <p className="text-sm text-brand-600">
            {order.userId ? (
              <>
                Podés volver a este pedido desde{" "}
                <Link href="/cuenta/pedidos" className="font-bold text-gold-700 hover:underline">
                  Mis pedidos
                </Link>
                .
              </>
            ) : (
              <>Guardá este link: como comprás sin cuenta, es la única forma de volver al pedido.</>
            )}
          </p>
        </div>

        <aside>
          <h2 className="mb-3 font-bold text-brand-900">Tu pedido</h2>
          <OrderSummaryCard order={order} />
        </aside>
      </div>
    </div>
  );
}
