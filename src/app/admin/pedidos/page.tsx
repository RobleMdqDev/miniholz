import Link from "next/link";
import type { Metadata } from "next";
import { Paperclip } from "lucide-react";
import { getAdminOrders, ORDER_STATUSES, PAYMENT_METHODS } from "@/lib/admin-queries";
import { formatCurrencyFromCents } from "@/lib/format";
import { formatOrderDate, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-labels";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";

export const metadata: Metadata = {
  title: "Pedidos",
};

export default async function AdminOrdersPage(props: PageProps<"/admin/pedidos">) {
  const params = await props.searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const paymentMethod = typeof params.paymentMethod === "string" ? params.paymentMethod : undefined;

  const orders = await getAdminOrders({ status, paymentMethod });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-brand-900">Pedidos</h1>

      <div className="space-y-3">
        <FilterRow
          label="Estado"
          options={ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] }))}
          paramName="status"
          active={status}
          otherParam={paymentMethod ? `paymentMethod=${paymentMethod}` : ""}
        />
        <FilterRow
          label="Pago"
          options={PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }))}
          paramName="paymentMethod"
          active={paymentMethod}
          otherParam={status ? `status=${status}` : ""}
        />
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600">
          No hay pedidos con estos filtros.
        </p>
      ) : (
        <>
          {/* Móvil: tarjetas, para no scrollear una tabla de 6 columnas de costado. */}
          <ul className="space-y-3 md:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="block rounded-2xl border border-brand-200 bg-white p-4"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-bold text-brand-900">#{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-brand-600">
                    {formatOrderDate(order.createdAt)} ·{" "}
                    {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                    {order.transferReceiptUrl && " · con comprobante"}
                  </p>
                  <p className="mt-1 truncate text-sm text-brand-800">
                    {order.user?.name ?? order.guestName ?? "—"}
                    <span className="text-brand-600">
                      {" "}
                      · {order.user ? order.user.email : "Invitado"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-bold text-brand-900">
                      {formatCurrencyFromCents(order.total)}
                    </span>
                    <span className="text-brand-600">
                      {" "}
                      · {order.items.length === 1 ? "1 ítem" : `${order.items.length} ítems`}
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-brand-200 bg-white md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-brand-600">
              <tr>
                <th className="p-3 font-semibold">Pedido</th>
                <th className="p-3 font-semibold">Fecha</th>
                <th className="p-3 font-semibold">Cliente</th>
                <th className="p-3 font-semibold">Pago</th>
                <th className="p-3 font-semibold">Total</th>
                <th className="p-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-brand-50">
                  <td className="p-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-bold text-brand-900 hover:text-gold-700"
                    >
                      #{order.orderNumber}
                    </Link>
                    <span className="block text-xs text-brand-600">
                      {order.items.length === 1 ? "1 ítem" : `${order.items.length} ítems`}
                    </span>
                  </td>
                  <td className="p-3 text-brand-700">{formatOrderDate(order.createdAt)}</td>
                  <td className="p-3">
                    <span className="block text-brand-800">
                      {order.user?.name ?? order.guestName ?? "—"}
                    </span>
                    <span className="block text-xs text-brand-600">
                      {order.user ? order.user.email : "Invitado"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1.5 text-brand-700">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                      {order.transferReceiptUrl && (
                        <Paperclip
                          className="h-3.5 w-3.5 text-gold-600"
                          aria-label="Con comprobante"
                        />
                      )}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-brand-800">
                    {formatCurrencyFromCents(order.total)}
                  </td>
                  <td className="p-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function FilterRow({
  label,
  options,
  paramName,
  active,
  otherParam,
}: {
  label: string;
  options: { value: string; label: string }[];
  paramName: string;
  active?: string;
  otherParam: string;
}) {
  const buildHref = (value?: string) => {
    const parts = [otherParam, value ? `${paramName}=${value}` : ""].filter(Boolean);
    return parts.length > 0 ? `/admin/pedidos?${parts.join("&")}` : "/admin/pedidos";
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{label}</span>
      <Chip href={buildHref()} label="Todos" active={!active} />
      {options.map((option) => (
        <Chip
          key={option.value}
          href={buildHref(option.value)}
          label={option.label}
          active={active === option.value}
        />
      ))}
    </div>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-full bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white"
          : "rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:border-gold-400 hover:text-gold-700"
      }
    >
      {label}
    </Link>
  );
}
