import Link from "next/link";
import { AlertTriangle, Package, Receipt, Wallet } from "lucide-react";
import { getAdminDashboard } from "@/lib/admin-queries";
import { formatCurrencyFromCents } from "@/lib/format";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Panel</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Receipt}
          label="Transferencias a confirmar"
          value={String(data.pendingTransfers)}
          hint={data.pendingTransfers > 0 ? "Revisá los comprobantes" : "Nada pendiente"}
          href="/admin/pedidos?status=PENDING_PAYMENT&paymentMethod=TRANSFER"
          highlight={data.pendingTransfers > 0}
        />
        <StatCard
          icon={Package}
          label="Pedidos este mes"
          value={String(data.ordersThisMonth)}
          hint={`${data.paidOrdersThisMonth} con pago acreditado`}
          href="/admin/pedidos"
        />
        <StatCard
          icon={Wallet}
          label="Ventas del mes"
          value={formatCurrencyFromCents(data.revenueThisMonth)}
          hint="Pedidos pagados en adelante"
          href="/admin/pedidos?status=PAID"
        />
        <StatCard
          icon={AlertTriangle}
          label="Productos desactivados"
          value={String(data.inactiveProducts)}
          hint="No se ven en la tienda"
          href="/admin/productos"
        />
      </div>

      <section className="rounded-2xl border border-brand-200 bg-white p-5">
        <h2 className="mb-1 font-bold text-brand-900">Stock bajo</h2>
        <p className="mb-4 text-xs text-brand-600">
          Opciones con {data.lowStockThreshold} unidades o menos, de productos publicados.
        </p>

        {data.lowStock.length === 0 ? (
          <p className="text-sm text-brand-600">Todo el catálogo tiene stock suficiente.</p>
        ) : (
          <ul className="divide-y divide-brand-100">
            {data.lowStock.map((variant) => (
              <li key={variant.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link
                  href={`/admin/productos/${variant.product.id}`}
                  className="font-medium text-brand-800 hover:text-gold-700"
                >
                  {variant.product.name}
                  {variant.product.variants.length > 1 && (
                    <span className="text-brand-600"> · {variant.name}</span>
                  )}
                </Link>
                <span
                  className={
                    variant.stock === 0
                      ? "rounded-full bg-danger-100 px-2.5 py-1 text-xs font-bold text-danger-700"
                      : "rounded-full bg-gold-100 px-2.5 py-1 text-xs font-bold text-gold-800"
                  }
                >
                  {variant.stock === 0 ? "Sin stock" : `${variant.stock} u.`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        highlight
          ? "block rounded-2xl border-2 border-gold-400 bg-white p-4 transition hover:shadow-sm"
          : "block rounded-2xl border border-brand-200 bg-white p-4 transition hover:shadow-sm"
      }
    >
      <Icon className="mb-2 h-5 w-5 text-gold-600" />
      <p className="text-xs uppercase tracking-wide text-brand-600">{label}</p>
      <p className="text-2xl font-extrabold text-brand-900">{value}</p>
      <p className="text-xs text-brand-600">{hint}</p>
    </Link>
  );
}
