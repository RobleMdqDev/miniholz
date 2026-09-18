import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { getOrderById, formatShippingAddress, parseShippingAddress } from "@/lib/orders";
import { formatCurrencyFromCents } from "@/lib/format";
import { formatOrderDate, PAYMENT_METHOD_LABELS } from "@/lib/order-labels";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { OrderAdminPanel } from "@/components/admin/OrderAdminPanel";
import { OrderTimeline } from "@/components/admin/OrderTimeline";
import { getOrderTimeline } from "@/lib/admin-queries";

export const metadata: Metadata = {
  title: "Detalle del pedido",
};

export default async function AdminOrderDetailPage(props: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await props.params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const timeline = await getOrderTimeline(order.id);

  const address = parseShippingAddress(order.shippingAddress);
  const contactName = order.user?.name ?? order.guestName ?? address?.fullName ?? "—";
  const contactEmail = order.user?.email ?? order.guestEmail ?? "—";

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/admin/pedidos" className="text-xs text-brand-600 hover:text-gold-700">
          ← Volver a pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-brand-900">Pedido #{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-brand-600">
          {formatOrderDate(order.createdAt)} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
          {order.user ? " · cliente registrado" : " · compra como invitado"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-brand-200 bg-white p-5">
            <h2 className="mb-3 font-bold text-brand-900">Productos</h2>
            <ul className="divide-y divide-brand-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link
                      href={`/productos/${item.productVariant.product.slug}`}
                      className="font-semibold text-brand-900 hover:text-gold-700"
                    >
                      {item.productName}
                    </Link>
                    {item.variantName && (
                      <span className="block text-xs text-brand-600">{item.variantName}</span>
                    )}
                    {item.personalizationText && (
                      <span className="block text-xs text-brand-600">
                        Grabado: <strong>{item.personalizationText}</strong>
                      </span>
                    )}
                    <span className="block text-xs text-brand-600">
                      {item.quantity} × {formatCurrencyFromCents(item.unitPrice)}
                    </span>
                  </div>
                  <span className="shrink-0 font-bold text-brand-800">
                    {formatCurrencyFromCents(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1 border-t border-brand-100 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-600">Productos</dt>
                <dd className="text-brand-800">{formatCurrencyFromCents(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-600">Envío</dt>
                <dd className="text-brand-800">
                  {order.shippingCost === 0
                    ? "A coordinar"
                    : formatCurrencyFromCents(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-brand-100 pt-1">
                <dt className="font-semibold text-brand-900">Total</dt>
                <dd className="text-lg font-extrabold text-brand-900">
                  {formatCurrencyFromCents(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-brand-200 bg-white p-5 text-sm">
            <h2 className="mb-3 font-bold text-brand-900">Contacto y envío</h2>
            <p className="text-brand-800">{contactName}</p>
            <p className="text-brand-700">{contactEmail}</p>
            {(order.guestPhone ?? address?.phone) && (
              <p className="text-brand-700">{order.guestPhone ?? address?.phone}</p>
            )}
            {address && (
              <p className="mt-2 text-brand-700">{formatShippingAddress(address)}</p>
            )}
            {order.notes && (
              <div className="mt-3 border-t border-brand-100 pt-3">
                <p className="mb-1 font-semibold text-brand-900">Notas del cliente</p>
                <p className="whitespace-pre-line text-brand-700">{order.notes}</p>
              </div>
            )}
          </section>

          {order.paymentMethod === "TRANSFER" && (
            <section className="rounded-2xl border border-brand-200 bg-white p-5 text-sm">
              <h2 className="mb-3 font-bold text-brand-900">Comprobante de transferencia</h2>
              {order.transferReceiptUrl ? (
                <a
                  href={order.transferReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-fit items-center gap-2 rounded-full border border-brand-300 px-4 py-2 font-semibold text-brand-800 transition hover:border-gold-400 hover:text-gold-700"
                >
                  <Paperclip className="h-4 w-4" aria-hidden />
                  Ver comprobante
                </a>
              ) : (
                <p className="text-brand-600">El cliente todavía no subió el comprobante.</p>
              )}
            </section>
          )}
          <OrderTimeline entries={timeline} />
        </div>

        <aside>
          <OrderAdminPanel
            orderId={order.id}
            status={order.status}
            shippingCost={order.shippingCost}
          />
        </aside>
      </div>
    </div>
  );
}
