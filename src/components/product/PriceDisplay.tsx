import { formatCurrencyFromCents } from "@/lib/format";
import { installmentAmountCents, installmentsCount, transferPriceCents } from "@/lib/pricing";

export function PriceDisplay({
  basePriceCents,
  compareAtPriceCents,
}: {
  basePriceCents: number;
  compareAtPriceCents: number | null;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        {compareAtPriceCents && (
          <span className="text-sm text-slate-400 line-through">
            {formatCurrencyFromCents(compareAtPriceCents)}
          </span>
        )}
        <span className="text-lg font-bold text-brand-700">
          {formatCurrencyFromCents(basePriceCents)}
        </span>
      </div>
      <p className="text-sm font-semibold text-accent-600">
        {formatCurrencyFromCents(transferPriceCents(basePriceCents))} con Transferencia
      </p>
      <p className="text-xs text-slate-500">
        {installmentsCount} cuotas sin interés de {formatCurrencyFromCents(installmentAmountCents(basePriceCents))}
      </p>
    </div>
  );
}
