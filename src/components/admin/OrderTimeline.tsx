import type { OrderTimelineEntry } from "@/lib/admin-queries";
import { ORDER_EVENT_TYPE_LABELS, formatOrderDateTime } from "@/lib/order-labels";
import { OrderEventChanges } from "@/components/admin/OrderEventChanges";

/**
 * Historial del pedido. Es lo que se mira cuando hay un reclamo, así que lo
 * que tiene que quedar claro de un vistazo es *quién* provocó cada cambio: en
 * `Order` un pago acreditado por Mercado Pago y uno que un admin marcó a mano
 * son indistinguibles, y acá no.
 */
export function OrderTimeline({ entries }: { entries: OrderTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-brand-200 bg-white p-5 text-sm">
        <h2 className="mb-2 font-bold text-brand-900">Historial</h2>
        <p className="text-brand-600">
          Este pedido es anterior a la bitácora, así que no tiene asientos registrados.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 text-sm">
      <h2 className="mb-3 font-bold text-brand-900">Historial</h2>
      <ol className="space-y-4">
        {entries.map((entry) => (
          <li key={entry.id} className="relative border-l border-brand-200 pl-4">
            <span
              className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold-400"
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="font-semibold text-brand-900">{ORDER_EVENT_TYPE_LABELS[entry.type]}</p>
              <time className="text-xs text-brand-600">{formatOrderDateTime(entry.at)}</time>
            </div>

            <p className="text-xs text-brand-600">{entry.actorLabel}</p>

            <OrderEventChanges entry={entry} className="mt-1 text-brand-800" />

            {entry.detail && <p className="mt-1 text-xs text-brand-600">{entry.detail}</p>}

            {entry.mpPaymentId && (
              <p className="text-xs text-brand-500">Pago MP: {entry.mpPaymentId}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
