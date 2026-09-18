import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserOrders } from "@/lib/orders";
import { formatCurrencyFromCents } from "@/lib/format";
import { formatOrderDate, PAYMENT_METHOD_LABELS } from "@/lib/order-labels";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";

export const metadata: Metadata = {
  title: "Mis pedidos",
};

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/cuenta/pedidos");

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-6">
      <h1 className="mb-4 text-xl font-extrabold text-brand-900">Mis pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-brand-600">
          Todavía no hiciste ningún pedido.{" "}
          <Link href="/productos" className="font-bold text-gold-700 hover:underline">
            Ver la tienda
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-brand-100">
          {orders.map((order) => (
            <li key={order.id} className="py-4">
              <Link href={`/cuenta/pedidos/${order.id}`} className="group block">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-brand-900 group-hover:text-gold-700">
                    Pedido #{order.orderNumber}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-xs text-brand-600">
                  {formatOrderDate(order.createdAt)} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </p>
                <p className="mt-1 text-sm text-brand-700">
                  {order.items.length === 1
                    ? order.items[0].productName
                    : `${order.items.length} productos`}{" "}
                  · <span className="font-semibold">{formatCurrencyFromCents(order.total)}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
