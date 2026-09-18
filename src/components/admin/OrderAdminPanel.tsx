"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma/enums";
import {
  cancelOrderAndRestock,
  setOrderShippingCost,
  updateOrderStatus,
} from "@/actions/admin-order.actions";
import { centsToPesos } from "@/lib/pricing";
import { MANUAL_ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-labels";
import { FormError, inputClassName, labelClassName } from "@/components/ui/form";

export function OrderAdminPanel({
  orderId,
  status,
  shippingCost,
}: {
  orderId: string;
  status: OrderStatus;
  shippingCost: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [shipping, setShipping] = useState(String(centsToPesos(shippingCost)));

  const cancelled = status === "CANCELLED";

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "No se pudo completar la acción.");
        return;
      }
      setMessage(result.message ?? null);
      setConfirmingCancel(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-brand-200 bg-white p-5">
      <h2 className="font-bold text-brand-900">Gestión del pedido</h2>

      <div>
        <label htmlFor="status" className={labelClassName}>
          Estado
        </label>
        <select
          id="status"
          value={cancelled ? "" : status}
          disabled={cancelled || pending}
          onChange={(event) => run(() => updateOrderStatus(orderId, event.target.value))}
          className={inputClassName}
        >
          {cancelled && <option value="">Cancelado</option>}
          {MANUAL_ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-brand-600">
          Marcarlo como pagado también acredita el pago: es el paso a dar cuando verificás el
          comprobante de una transferencia.
        </p>
      </div>

      <div>
        <label htmlFor="shipping" className={labelClassName}>
          Costo de envío (pesos)
        </label>
        <div className="flex gap-2">
          <input
            id="shipping"
            type="number"
            min="0"
            step="0.01"
            value={shipping}
            onChange={(event) => setShipping(event.target.value)}
            className={inputClassName}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setOrderShippingCost(orderId, Number(shipping)))}
            className="shrink-0 rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
        <p className="mt-1 text-xs text-brand-600">
          Se suma al total del pedido. Cargalo cuando lo acuerdes con el cliente.
        </p>
      </div>

      {!cancelled && (
        <div className="border-t border-brand-100 pt-4">
          {confirmingCancel ? (
            <div className="space-y-2">
              <p className="text-sm text-brand-700">
                Se cancela el pedido y las unidades vuelven al stock. No se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => cancelOrderAndRestock(orderId))}
                  className="rounded-full bg-danger-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-danger-700 disabled:opacity-50"
                >
                  Sí, cancelar y reponer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-900"
                >
                  Volver
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingCancel(true)}
              className="text-sm font-semibold text-danger-700 hover:underline disabled:opacity-50"
            >
              Cancelar pedido y reponer stock
            </button>
          )}
        </div>
      )}

      <FormError message={error ?? undefined} />
      {message && (
        <p className="rounded-lg bg-brand-100 px-3 py-2 text-sm font-medium text-brand-800">
          {message}
        </p>
      )}
    </div>
  );
}
