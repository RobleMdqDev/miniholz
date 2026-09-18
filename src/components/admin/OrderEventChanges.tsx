import type { OrderTimelineEntry } from "@/lib/admin-queries";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-labels";

/**
 * Las dos transiciones que puede llevar un asiento —estado del pedido y estado
 * del pago—, cada una opcional. Lo usan el historial de un pedido y la tabla de
 * auditoría, que muestran lo mismo en contextos distintos: se renderiza con
 * `span` en bloque para que sirva dentro de una celda y de un `li` por igual.
 */
export function OrderEventChanges({
  entry,
  className,
  emptyLabel,
}: {
  entry: Pick<OrderTimelineEntry, "statusChange" | "paymentChange">;
  className?: string;
  /** Qué mostrar cuando el asiento no movió ningún estado (un costo de envío). */
  emptyLabel?: string;
}) {
  if (!entry.statusChange && !entry.paymentChange) {
    return emptyLabel ? <span className={className}>{emptyLabel}</span> : null;
  }

  return (
    <span className={className}>
      {entry.statusChange && (
        <span className="block">
          Estado:{" "}
          <Transition
            from={entry.statusChange.from && ORDER_STATUS_LABELS[entry.statusChange.from]}
            to={ORDER_STATUS_LABELS[entry.statusChange.to]}
          />
        </span>
      )}
      {entry.paymentChange && (
        <span className="block">
          Pago:{" "}
          <Transition
            from={entry.paymentChange.from && PAYMENT_STATUS_LABELS[entry.paymentChange.from]}
            to={PAYMENT_STATUS_LABELS[entry.paymentChange.to]}
          />
        </span>
      )}
    </span>
  );
}

/** Sin origen (un alta) se muestra solo el destino, sin una flecha que no dice nada. */
function Transition({ from, to }: { from: string | null; to: string }) {
  if (!from) return <strong className="font-semibold">{to}</strong>;
  return (
    <>
      {from} → <strong className="font-semibold">{to}</strong>
    </>
  );
}
