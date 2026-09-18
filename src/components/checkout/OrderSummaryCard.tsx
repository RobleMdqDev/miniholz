import Image from "next/image";
import Link from "next/link";
import { formatCurrencyFromCents } from "@/lib/format";
import { formatShippingAddress, parseShippingAddress, type OrderDetail } from "@/lib/orders";

export function OrderSummaryCard({ order }: { order: OrderDetail }) {
  const address = parseShippingAddress(order.shippingAddress);

  return (
    <div className="space-y-5 rounded-2xl border border-brand-200 bg-white p-5">
      <ul className="divide-y divide-brand-100">
        {order.items.map((item) => {
          const image = item.productVariant.product.images[0];
          return (
            <li key={item.id} className="flex gap-3 py-3">
              <Link
                href={`/productos/${item.productVariant.product.slug}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-50"
              >
                {image && (
                  <Image
                    src={image.url}
                    alt={image.alt ?? item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-brand-900">{item.productName}</p>
                {item.variantName && <p className="text-xs text-brand-600">{item.variantName}</p>}
                {item.personalizationText && (
                  <p className="text-xs text-brand-600">
                    Grabado: <span className="font-semibold">{item.personalizationText}</span>
                  </p>
                )}
                <p className="text-xs text-brand-600">
                  {item.quantity} × {formatCurrencyFromCents(item.unitPrice)}
                </p>
              </div>

              <span className="shrink-0 text-sm font-bold text-brand-800">
                {formatCurrencyFromCents(item.subtotal)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-baseline justify-between border-t border-brand-100 pt-3">
        <span className="text-sm text-brand-600">Total de productos</span>
        <span className="text-lg font-extrabold text-brand-900">
          {formatCurrencyFromCents(order.total)}
        </span>
      </div>

      {address && (
        <div className="border-t border-brand-100 pt-3 text-sm">
          <p className="mb-1 font-semibold text-brand-900">Envío a</p>
          <p className="text-brand-700">{address.fullName}</p>
          <p className="text-brand-700">{formatShippingAddress(address)}</p>
          <p className="text-brand-700">{address.phone}</p>
          <p className="mt-2 text-xs text-brand-600">
            El costo de envío se coordina aparte y no está incluido en el total.
          </p>
        </div>
      )}

      {order.notes && (
        <div className="border-t border-brand-100 pt-3 text-sm">
          <p className="mb-1 font-semibold text-brand-900">Notas</p>
          <p className="whitespace-pre-line text-brand-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
