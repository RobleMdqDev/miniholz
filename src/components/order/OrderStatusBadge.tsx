import type { OrderStatus } from "@/generated/prisma/enums";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-labels";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${ORDER_STATUS_STYLES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
