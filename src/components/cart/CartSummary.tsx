import { formatCurrencyFromCents } from "@/lib/format";
import {
  installmentAmountCents,
  installmentsCount,
  transferDiscountPercent,
  transferPriceCents,
} from "@/lib/pricing";

export function CartSummary({ subtotal }: { subtotal: number }) {
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex items-baseline justify-between">
        <dt className="text-brand-600">Subtotal</dt>
        <dd className="text-lg font-extrabold text-brand-900">
          {formatCurrencyFromCents(subtotal)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between">
        <dt className="text-brand-600">Con transferencia ({transferDiscountPercent}% off)</dt>
        <dd className="font-bold text-accent-600">
          {formatCurrencyFromCents(transferPriceCents(subtotal))}
        </dd>
      </div>
      <p className="text-xs text-brand-600">
        o {installmentsCount} cuotas sin interés de{" "}
        {formatCurrencyFromCents(installmentAmountCents(subtotal))}
      </p>
      <p className="text-xs text-brand-600">El costo de envío se calcula en el checkout.</p>
    </dl>
  );
}
