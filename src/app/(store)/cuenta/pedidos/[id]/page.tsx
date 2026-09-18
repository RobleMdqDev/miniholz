import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canViewOrder, getOrderById } from "@/lib/orders";
import { formatOrderDate, PAYMENT_METHOD_LABELS } from "@/lib/order-labels";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";

export const metadata: Metadata = {
  title: "Detalle del pedido",
};

export default async function AccountOrderDetailPage(props: PageProps<"/cuenta/pedidos/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/cuenta/pedidos/${id}`);

  const order = await getOrderById(id);
  if (!order || !canViewOrder(order, session.user)) notFound();

  const CONTINUE_PAYMENT = {
    MERCADOPAGO: { href: `/checkout/mercadopago/${order.id}`, label: "Pagar con Mercado Pago" },
    TRANSFER: { href: `/checkout/transferencia/${order.id}`, label: "Ver datos para transferir" },
    WHATSAPP: { href: `/checkout/whatsapp/${order.id}`, label: "Coordinar por WhatsApp" },
  } as const;

  const continuePayment =
    order.status === "PENDING_PAYMENT" ? CONTINUE_PAYMENT[order.paymentMethod] : null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-brand-200 bg-white p-6">
        <Link href="/cuenta/pedidos" className="text-xs text-brand-600 hover:text-gold-700">
          ← Volver a mis pedidos
        </Link>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold text-brand-900">Pedido #{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>

        <p className="mt-1 text-sm text-brand-600">
          {formatOrderDate(order.createdAt)} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </p>

        {continuePayment && (
          <Link
            href={continuePayment.href}
            className="mt-4 inline-block rounded-full bg-gold-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gold-800"
          >
            {continuePayment.label}
          </Link>
        )}
      </div>

      <OrderSummaryCard order={order} />
    </div>
  );
}
