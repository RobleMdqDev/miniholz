import Link from "next/link";
import type { Metadata } from "next";
import {
  AUDIT_SOURCES,
  ORDER_EVENT_TYPES,
  getAuditLog,
  type AuditSource,
} from "@/lib/admin-queries";
import { ORDER_EVENT_TYPE_LABELS, formatOrderDateTime } from "@/lib/order-labels";
import { OrderEventChanges } from "@/components/admin/OrderEventChanges";

export const metadata: Metadata = {
  title: "Auditoría",
};

const SOURCE_LABELS: Record<AuditSource, string> = {
  mercadopago: "Mercado Pago",
  admin: "Administración",
  tienda: "Tienda",
};

export default async function AdminAuditPage(props: PageProps<"/admin/auditoria">) {
  const params = await props.searchParams;
  const type = typeof params.type === "string" ? params.type : undefined;
  const source = typeof params.source === "string" ? params.source : undefined;
  const page = typeof params.page === "string" ? params.page : undefined;

  const { entries, total, page: current, pageCount } = await getAuditLog({ type, source, page });

  const hrefWith = (overrides: Record<string, string | undefined>) => {
    const next = { type, source, page: undefined, ...overrides };
    const query = Object.entries(next)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    return query ? `/admin/auditoria?${query}` : "/admin/auditoria";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Auditoría</h1>
        <p className="mt-1 text-sm text-brand-600">
          Cada cambio de estado de un pedido y de su pago, con quién lo provocó. Solo se registra
          lo que cambió: los avisos repetidos de Mercado Pago no dejan asiento.
        </p>
      </div>

      <div className="space-y-3">
        <FilterRow
          label="Evento"
          options={ORDER_EVENT_TYPES.map((value) => ({
            value,
            label: ORDER_EVENT_TYPE_LABELS[value],
          }))}
          active={type}
          hrefFor={(value) => hrefWith({ type: value })}
        />
        <FilterRow
          label="Origen"
          options={AUDIT_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value] }))}
          active={source}
          hrefFor={(value) => hrefWith({ source: value })}
        />
      </div>

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-brand-600">
          {total === 0
            ? "Todavía no hay asientos registrados. Se escriben a partir del primer cambio de un pedido."
            : "No hay asientos con estos filtros."}
        </p>
      ) : (
        <>
          {/* Móvil: tarjetas, misma decisión que en el listado de pedidos. */}
          <ul className="space-y-3 md:hidden">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-brand-200 bg-white p-4">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <Link
                    href={`/admin/pedidos/${entry.orderId}`}
                    className="font-bold text-brand-900 hover:text-gold-700"
                  >
                    #{entry.orderNumber}
                  </Link>
                  <time className="text-xs text-brand-600">{formatOrderDateTime(entry.at)}</time>
                </div>
                <p className="font-semibold text-brand-900">
                  {ORDER_EVENT_TYPE_LABELS[entry.type]}
                </p>
                <p className="text-xs text-brand-600">{entry.actorLabel}</p>
                <OrderEventChanges entry={entry} className="mt-1 text-sm text-brand-800" />
                {entry.detail && <p className="mt-1 text-xs text-brand-600">{entry.detail}</p>}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-brand-200 bg-white md:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-brand-600">
                <tr>
                  <th className="p-3 font-semibold">Cuándo</th>
                  <th className="p-3 font-semibold">Pedido</th>
                  <th className="p-3 font-semibold">Evento</th>
                  <th className="p-3 font-semibold">Quién</th>
                  <th className="p-3 font-semibold">Qué cambió</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-brand-50">
                    <td className="whitespace-nowrap p-3 text-brand-700">
                      {formatOrderDateTime(entry.at)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/pedidos/${entry.orderId}`}
                        className="font-bold text-brand-900 hover:text-gold-700"
                      >
                        #{entry.orderNumber}
                      </Link>
                    </td>
                    <td className="p-3 text-brand-800">{ORDER_EVENT_TYPE_LABELS[entry.type]}</td>
                    <td className="p-3 text-brand-700">{entry.actorLabel}</td>
                    <td className="p-3">
                      <OrderEventChanges entry={entry} className="text-brand-800" emptyLabel="—" />
                      {entry.detail && (
                        <span className="block text-xs text-brand-600">{entry.detail}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="text-brand-600">
              {total === 1 ? "1 asiento" : `${total} asientos`} · página {current} de {pageCount}
            </p>
            <div className="flex gap-2">
              <PageLink
                href={hrefWith({ page: String(current - 1) })}
                label="← Anteriores"
                disabled={current <= 1}
              />
              <PageLink
                href={hrefWith({ page: String(current + 1) })}
                label="Siguientes →"
                disabled={current >= pageCount}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FilterRow({
  label,
  options,
  active,
  hrefFor,
}: {
  label: string;
  options: { value: string; label: string }[];
  active?: string;
  hrefFor: (value?: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{label}</span>
      <Chip href={hrefFor(undefined)} label="Todos" active={!active} />
      {options.map((option) => (
        <Chip
          key={option.value}
          href={hrefFor(option.value)}
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

function PageLink({ href, label, disabled }: { href: string; label: string; disabled: boolean }) {
  if (disabled) {
    return (
      <span className="rounded-full border border-brand-100 px-3 py-1.5 text-xs font-medium text-brand-300">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:border-gold-400 hover:text-gold-700"
    >
      {label}
    </Link>
  );
}
