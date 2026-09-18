import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { canViewOrder, getOrderById, getStoreSettings } from "@/lib/orders";
import { formatCurrencyFromCents } from "@/lib/format";
import { transferDiscountPercent, transferPriceCents } from "@/lib/pricing";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";
import { ReceiptUploader } from "@/components/checkout/ReceiptUploader";

export const metadata: Metadata = {
  title: "Pagar por transferencia",
};

export default async function TransferCheckoutPage(
  props: PageProps<"/checkout/transferencia/[orderId]">,
) {
  const { orderId } = await props.params;
  const [order, settings, session] = await Promise.all([
    getOrderById(orderId),
    getStoreSettings(),
    auth(),
  ]);

  if (!order) notFound();
  if (!canViewOrder(order, session?.user ?? null)) notFound();

  const amountToTransfer = transferPriceCents(order.total);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gold-700">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        Pedido #{order.orderNumber} registrado
      </p>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-900">Pagá por transferencia</h1>
      <p className="mb-8 text-sm text-brand-600">
        Guardamos tu pedido. Para confirmarlo, transferí el total y subí el comprobante: lo
        revisamos y te avisamos cuando esté acreditado.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-brand-200 bg-white p-5">
            <h2 className="mb-3 font-bold text-brand-900">Datos para transferir</h2>

            <p className="mb-1 text-sm text-brand-600">Monto a transferir</p>
            <p className="mb-1 text-2xl font-extrabold text-accent-600">
              {formatCurrencyFromCents(amountToTransfer)}
            </p>
            <p className="mb-4 text-xs text-brand-600">
              Incluye el {transferDiscountPercent}% de descuento por transferencia sobre{" "}
              {formatCurrencyFromCents(order.total)}. El envío se coordina aparte.
            </p>

            {settings?.bankAccountInfo ? (
              <pre className="whitespace-pre-wrap rounded-xl bg-brand-50 p-4 font-sans text-sm text-brand-800">
                {settings.bankAccountInfo}
              </pre>
            ) : (
              <p className="rounded-xl bg-danger-50 p-4 text-sm text-danger-700">
                Todavía no cargamos los datos bancarios. Escribinos y te los pasamos.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-brand-200 bg-white p-5">
            <h2 className="mb-3 font-bold text-brand-900">Subí el comprobante</h2>
            <ReceiptUploader orderId={order.id} currentReceiptUrl={order.transferReceiptUrl} />
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
